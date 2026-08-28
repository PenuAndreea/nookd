import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getRooms, RoomWithDetails } from '@/api/rooms';
import { useAuth } from '@/contexts/auth-context';

type RoomsContextType = {
    rooms: RoomWithDetails[] | null;
    currentRoom: RoomWithDetails | null;
    loading: boolean;
    refreshing: boolean;
    refresh: () => Promise<void>;
    addRoom: (room: RoomWithDetails) => void;
    markJoined: (roomId: string, userId: string) => void;
    markLeft: (roomId: string, userId: string) => void;
};

const RoomsContext = createContext<RoomsContextType | undefined>(undefined);

export function RoomsProvider({ children }: { children: ReactNode }) {
    const { session } = useAuth();
    const userId = session?.user?.id;

    const [rooms, setRooms] = useState<RoomWithDetails[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const hasLoadedRef = useRef(false);

    const load = useCallback(async (isRefresh: boolean) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            const data = await getRooms();
            setRooms(data);
        } catch (error) {
            console.error('Error loading rooms:', error);
        } finally {
            isRefresh ? setRefreshing(false) : setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;
        load(false);
    }, [load]);

    const refresh = useCallback(() => load(true), [load]);

    const addRoom = useCallback((room: RoomWithDetails) => {
        setRooms((prev) => (prev ? [room, ...prev] : [room]));
    }, []);

    const markJoined = useCallback((roomId: string, memberId: string) => {
        setRooms((prev) => {
            if (!prev) return prev;
            return prev.map((room) => {
                if (room.id !== roomId) return room;
                if (room.members.some((m) => m.user_id === memberId)) return room;
                return { ...room, members: [...room.members, { user_id: memberId }] };
            });
        });
    }, []);

    const markLeft = useCallback((roomId: string, memberId: string) => {
        setRooms((prev) => {
            if (!prev) return prev;
            return prev.map((room) => {
                if (room.id !== roomId) return room;
                return { ...room, members: room.members.filter((m) => m.user_id !== memberId) };
            });
        });
    }, []);

    const currentRoom = useMemo(() => {
        if (!userId || !rooms) return null;
        return rooms.find((room) => room.members.some((m) => m.user_id === userId)) ?? null;
    }, [rooms, userId]);

    return (
        <RoomsContext.Provider
            value={{ rooms, currentRoom, loading, refreshing, refresh, addRoom, markJoined, markLeft }}
        >
            {children}
        </RoomsContext.Provider>
    );
}

export function useRooms() {
    const ctx = useContext(RoomsContext);
    if (!ctx) throw new Error('useRooms must be used within a RoomsProvider');
    return ctx;
}
