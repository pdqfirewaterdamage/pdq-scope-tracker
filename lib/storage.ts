// ─── Local Storage Backend (prototype mode — no Supabase needed) ─────────────

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function now(): string {
  return new Date().toISOString();
}

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Database Types ───────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  role: 'technician' | 'estimator' | 'admin';
  company_id: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  job_name: string;
  address: string;
  job_type: 'Water Mitigation' | 'Fire & Smoke' | 'General';
  water_category: 'cat2' | 'cat3' | null;
  status: 'active' | 'complete' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Sheet {
  id: string;
  project_id: string;
  tech_name: string | null;
  hours_type: 'regular' | 'after';
  contents_status: 'yes' | 'no' | 'not_sure' | null;
  contents_boxes: number | null;
  contents_hours: number | null;
  submitted: boolean;
  submitted_at: string | null;
  created_at: string;
  date: string;
}

export interface Room {
  id: string;
  sheet_id: string;
  name: string;
  sort_order: number;
  walls_data: Record<string, unknown> | null;
  ceiling_data: Record<string, unknown> | null;
  flooring_data: Record<string, unknown> | null;
  created_at: string;
}

export interface Item {
  id: string;
  room_id: string;
  scope_item_id: string;
  label: string;
  phase: string;
  subsection: string;
  child_sub: string | null;
  input_type: string | null;
  drop_options: string[] | null;
  no_hours: boolean;
  mandatory: boolean;
  has_note: boolean | null;
  sort_order: number;
  status: 'pending' | 'done' | 'not_needed';
  hours: number | null;
  hours_type: 'regular' | 'after';
  note: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  item_id: string | null;
  room_id: string | null;
  project_id: string;
  storage_path: string;
  caption: string | null;
  created_by: string | null;
  created_at: string;
}

export type CreateProjectData = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by'>;
export type CreateSheetData = Omit<Sheet, 'id' | 'created_at' | 'submitted' | 'submitted_at'>;
export type CreateRoomData = Omit<Room, 'id' | 'created_at'>;
export type CreateItemData = Omit<Item, 'id' | 'created_at'>;

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  return load<Project>('pdq_projects').sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function createProject(data: CreateProjectData): Promise<Project> {
  const projects = load<Project>('pdq_projects');
  const project: Project = {
    ...data,
    id: uuid(),
    created_by: 'local',
    created_at: now(),
    updated_at: now(),
  };
  save('pdq_projects', [project, ...projects]);
  return project;
}

export async function getProject(id: string): Promise<Project> {
  const project = load<Project>('pdq_projects').find((p) => p.id === id);
  if (!project) throw new Error('Project not found');
  return project;
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const projects = load<Project>('pdq_projects');
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Project not found');
  projects[idx] = { ...projects[idx], ...data, updated_at: now() };
  save('pdq_projects', projects);
  return projects[idx];
}

// ─── Sheets ───────────────────────────────────────────────────────────────────

export async function getSheets(projectId: string): Promise<Sheet[]> {
  return load<Sheet>('pdq_sheets')
    .filter((s) => s.project_id === projectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createSheet(data: CreateSheetData): Promise<Sheet> {
  const sheets = load<Sheet>('pdq_sheets');
  const sheet: Sheet = {
    ...data,
    id: uuid(),
    submitted: false,
    submitted_at: null,
    created_at: now(),
  };
  save('pdq_sheets', [sheet, ...sheets]);
  return sheet;
}

export async function updateSheet(id: string, data: Partial<Sheet>): Promise<Sheet> {
  const sheets = load<Sheet>('pdq_sheets');
  const idx = sheets.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Sheet not found');
  sheets[idx] = { ...sheets[idx], ...data };
  save('pdq_sheets', sheets);
  return sheets[idx];
}

export async function submitSheet(id: string, techName: string): Promise<Sheet> {
  return updateSheet(id, {
    submitted: true,
    submitted_at: now(),
    tech_name: techName,
  });
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export async function getRooms(sheetId: string): Promise<Room[]> {
  return load<Room>('pdq_rooms')
    .filter((r) => r.sheet_id === sheetId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function createRoom(data: CreateRoomData): Promise<Room> {
  const rooms = load<Room>('pdq_rooms');
  const room: Room = { ...data, id: uuid(), created_at: now() };
  save('pdq_rooms', [...rooms, room]);
  return room;
}

export async function updateRoom(id: string, data: Partial<Room>): Promise<Room> {
  const rooms = load<Room>('pdq_rooms');
  const idx = rooms.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Room not found');
  rooms[idx] = { ...rooms[idx], ...data };
  save('pdq_rooms', rooms);
  return rooms[idx];
}

export async function deleteRoom(id: string): Promise<void> {
  save('pdq_rooms', load<Room>('pdq_rooms').filter((r) => r.id !== id));
  save('pdq_items', load<Item>('pdq_items').filter((i) => i.room_id !== id));
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function getItems(roomId: string): Promise<Item[]> {
  return load<Item>('pdq_items')
    .filter((i) => i.room_id === roomId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function createItems(items: CreateItemData[]): Promise<Item[]> {
  const existing = load<Item>('pdq_items');
  const created = items.map((i) => ({ ...i, id: uuid(), created_at: now() }));
  save('pdq_items', [...existing, ...created]);
  return created;
}

export async function updateItem(id: string, data: Partial<Item>): Promise<Item> {
  const items = load<Item>('pdq_items');
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('Item not found');
  items[idx] = { ...items[idx], ...data };
  save('pdq_items', items);
  return items[idx];
}

// ─── Realtime (no-op in local mode) ──────────────────────────────────────────

export function subscribeToSheet(
  _sheetId: string,
  _callback: (payload: unknown) => void
): { unsubscribe: () => void } {
  return { unsubscribe: () => {} };
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export async function getPhotos(itemId: string): Promise<Photo[]> {
  return load<Photo>('pdq_photos').filter((p) => p.item_id === itemId);
}

export async function createPhoto(data: Omit<Photo, 'id' | 'created_at'>): Promise<Photo> {
  const photos = load<Photo>('pdq_photos');
  const photo: Photo = { ...data, id: uuid(), created_at: now() };
  save('pdq_photos', [...photos, photo]);
  return photo;
}

export async function deletePhotoRecord(id: string): Promise<void> {
  save('pdq_photos', load<Photo>('pdq_photos').filter((p) => p.id !== id));
}
