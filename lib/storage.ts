import { supabase } from './supabase';

// ─── Database Types ──────────────────────────────────────────────────────────

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

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Project[];
}

export async function createProject(data: CreateProjectData): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ ...data, created_by: user.id })
    .select()
    .single();

  if (error) throw error;
  return project as Project;
}

export async function getProject(id: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const { data: project, error } = await supabase
    .from('projects')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return project as Project;
}

// ─── Sheets ──────────────────────────────────────────────────────────────────

export async function getSheets(projectId: string): Promise<Sheet[]> {
  const { data, error } = await supabase
    .from('sheets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Sheet[];
}

export async function createSheet(data: CreateSheetData): Promise<Sheet> {
  const { data: sheet, error } = await supabase
    .from('sheets')
    .insert({ ...data, submitted: false })
    .select()
    .single();

  if (error) throw error;
  return sheet as Sheet;
}

export async function updateSheet(id: string, data: Partial<Sheet>): Promise<Sheet> {
  const { data: sheet, error } = await supabase
    .from('sheets')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return sheet as Sheet;
}

export async function submitSheet(id: string, techName: string): Promise<Sheet> {
  const { data: sheet, error } = await supabase
    .from('sheets')
    .update({
      submitted: true,
      submitted_at: new Date().toISOString(),
      tech_name: techName,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return sheet as Sheet;
}

// ─── Rooms ───────────────────────────────────────────────────────────────────

export async function getRooms(sheetId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('sheet_id', sheetId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as Room[];
}

export async function createRoom(data: CreateRoomData): Promise<Room> {
  const { data: room, error } = await supabase
    .from('rooms')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return room as Room;
}

export async function updateRoom(id: string, data: Partial<Room>): Promise<Room> {
  const { data: room, error } = await supabase
    .from('rooms')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return room as Room;
}

export async function deleteRoom(id: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Items ───────────────────────────────────────────────────────────────────

export async function getItems(roomId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('room_id', roomId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as Item[];
}

export async function createItems(items: CreateItemData[]): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .insert(items)
    .select();

  if (error) throw error;
  return data as Item[];
}

export async function updateItem(id: string, data: Partial<Item>): Promise<Item> {
  const { data: item, error } = await supabase
    .from('items')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return item as Item;
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export function subscribeToSheet(
  sheetId: string,
  callback: (payload: unknown) => void
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`sheet:${sheetId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'items' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms' },
      callback
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export async function getPhotos(itemId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Photo[];
}

export async function createPhoto(data: Omit<Photo, 'id' | 'created_at'>): Promise<Photo> {
  const { data: photo, error } = await supabase
    .from('photos')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return photo as Photo;
}

export async function deletePhotoRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
