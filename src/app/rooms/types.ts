export interface Room {
    id: number
    name?: string | null
    host_id?: string | null
    duration_minutes?: number | null
    started_at?: string
    status?: 'waiting' | 'active' | 'ended' | null
}
