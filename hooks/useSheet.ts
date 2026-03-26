import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sheet,
  Room,
  Item,
  updateSheet,
  updateRoom,
  updateItem,
  getRooms,
  getItems,
  subscribeToSheet,
} from '../lib/storage';
import { supabase } from '../lib/supabase';

interface RoomWithItems extends Room {
  items: Item[];
}

interface UseSheetResult {
  sheet: Sheet | null;
  rooms: RoomWithItems[];
  loading: boolean;
  error: string | null;
  updateItem: (itemId: string, data: Partial<Item>) => Promise<void>;
  updateRoom: (roomId: string, data: Partial<Room>) => Promise<void>;
  submitSheet: (techName: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSheet(sheetId: string): UseSheetResult {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [rooms, setRooms] = useState<RoomWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const fetchAll = useCallback(async () => {
    if (!sheetId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: sheetData, error: sheetErr } = await supabase
        .from('sheets')
        .select('*')
        .eq('id', sheetId)
        .single();

      if (sheetErr) throw sheetErr;
      setSheet(sheetData as Sheet);

      const roomList = await getRooms(sheetId);
      const roomsWithItems: RoomWithItems[] = await Promise.all(
        roomList.map(async (room) => {
          const items = await getItems(room.id);
          return { ...room, items };
        })
      );
      setRooms(roomsWithItems);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sheet');
    } finally {
      setLoading(false);
    }
  }, [sheetId]);

  useEffect(() => {
    fetchAll();

    // Set up realtime subscription
    subscriptionRef.current = subscribeToSheet(sheetId, () => {
      fetchAll();
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [sheetId, fetchAll]);

  const handleUpdateItem = useCallback(
    async (itemId: string, data: Partial<Item>) => {
      await updateItem(itemId, data);
      setRooms((prev) =>
        prev.map((room) => ({
          ...room,
          items: room.items.map((item) =>
            item.id === itemId ? { ...item, ...data } : item
          ),
        }))
      );
    },
    []
  );

  const handleUpdateRoom = useCallback(
    async (roomId: string, data: Partial<Room>) => {
      await updateRoom(roomId, data);
      setRooms((prev) =>
        prev.map((room) =>
          room.id === roomId ? { ...room, ...data } : room
        )
      );
    },
    []
  );

  const handleSubmitSheet = useCallback(
    async (techName: string) => {
      const updated = await updateSheet(sheetId, {
        submitted: true,
        submitted_at: new Date().toISOString(),
        tech_name: techName,
      });
      setSheet(updated);
    },
    [sheetId]
  );

  return {
    sheet,
    rooms,
    loading,
    error,
    updateItem: handleUpdateItem,
    updateRoom: handleUpdateRoom,
    submitSheet: handleSubmitSheet,
    refresh: fetchAll,
  };
}
