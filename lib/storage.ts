// ─── Supabase Storage Backend ─────────────────────────────────────────────────
import { supabase } from './supabase';

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
  weekend_sheet: boolean;
  additional_techs: string[] | null;
  additional_techs_answered: boolean;
}

export interface RoomMeasurements {
  l: string;
  w: string;
  h: string;
  l2: string;
  w2: string;
}

export interface Room {
  id: string;
  sheet_id: string;
  name: string;
  sort_order: number;
  walls_data: Record<string, unknown> | null;
  ceiling_data: Record<string, unknown> | null;
  flooring_data: Record<string, unknown> | null;
  measurements: RoomMeasurements | null;
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
  require_photo: boolean;
  sort_order: number;
  status: 'pending' | 'done' | 'not_needed';
  hours: number | null;
  hours_type: 'regular' | 'after';
  note: string | null;
  qty_value: string | null;
  drop_value: string | null;
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
export type CreateSheetData = Omit<Sheet, 'id' | 'created_at' | 'submitted' | 'submitted_at' | 'weekend_sheet' | 'additional_techs_answered'> & { weekend_sheet?: boolean };
export type CreateRoomData = Omit<Room, 'id' | 'created_at'>;
export type CreateItemData = Omit<Item, 'id' | 'created_at'>;

// ─── Projects ─────────────────────────────────────────────────────────────────

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
  const { data: project, error } = await supabase
    .from('projects')
    .insert({ ...data, created_by: user?.id ?? null })
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
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return project as Project;
}

// ─── Sheets ───────────────────────────────────────────────────────────────────

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
    .insert(data)
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
  return updateSheet(id, {
    submitted: true,
    submitted_at: new Date().toISOString(),
    tech_name: techName,
  });
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

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
  // Items are cascade-deleted by the foreign key constraint
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── Items ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
}

export async function createSheetWithCarryForward(
  projectId: string,
  date: string,
  techName: string | null,
  waterCategory: 'cat2' | 'cat3' | null,
): Promise<Sheet> {
  const weekend = isWeekend(date);

  const sheet = await createSheet({
    project_id: projectId,
    tech_name: techName,
    hours_type: weekend ? 'after' : 'regular',
    contents_status: null,
    contents_boxes: null,
    contents_hours: null,
    date,
    weekend_sheet: weekend,
    additional_techs: null,
  });

  // Carry forward rooms from the most recent previous sheet
  const previousSheets = await getSheets(projectId);
  const prevSheet = previousSheets.find((s) => s.id !== sheet.id);

  if (prevSheet) {
    const prevRooms = await getRooms(prevSheet.id);
    for (const prevRoom of prevRooms) {
      const newRoom = await createRoom({
        sheet_id: sheet.id,
        name: prevRoom.name,
        sort_order: prevRoom.sort_order,
        walls_data: prevRoom.walls_data,
        ceiling_data: prevRoom.ceiling_data,
        flooring_data: prevRoom.flooring_data,
        measurements: prevRoom.measurements,
      });

      // Get previous items and reset to pending
      const prevItems = await getItems(prevRoom.id);
      if (prevItems.length > 0) {
        const newItems = prevItems.map((item) => ({
          room_id: newRoom.id,
          scope_item_id: item.scope_item_id,
          label: item.label,
          phase: item.phase,
          subsection: item.subsection,
          child_sub: item.child_sub,
          input_type: item.input_type,
          drop_options: item.drop_options,
          no_hours: item.no_hours,
          mandatory: item.mandatory,
          has_note: item.has_note,
          require_photo: item.require_photo,
          sort_order: item.sort_order,
          status: 'pending' as const,
          hours: null,
          hours_type: weekend ? 'after' as const : 'regular' as const,
          note: null,
          qty_value: item.no_hours ? item.qty_value : null, // Preserve equipment quantities
          drop_value: null,
        }));
        await createItems(newItems);
      }
    }
  }

  return sheet;
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export function subscribeToSheet(
  sheetId: string,
  callback: (payload: unknown) => void
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`sheet-${sheetId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'items', filter: `room_id=in.(select id from rooms where sheet_id='${sheetId}')` },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `sheet_id=eq.${sheetId}` },
      callback
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export async function getPhotos(itemId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('item_id', itemId);
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
