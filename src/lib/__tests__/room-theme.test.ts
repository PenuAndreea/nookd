import { themeForRoom } from '@/lib/room-theme';

describe('themeForRoom', () => {
    it('picks a fixed theme per known vibe', () => {
        const quiet = themeForRoom({ id: 'room-1', vibe: 'quiet_company' });
        const fantasy = themeForRoom({ id: 'room-1', vibe: 'fantasy' });

        expect(quiet).not.toBe(fantasy);
        // Same vibe, different id — the vibe wins over the id-derived hash.
        expect(themeForRoom({ id: 'room-2', vibe: 'quiet_company' })).toBe(quiet);
    });

    it('falls back to a stable, id-derived theme for an unknown or missing vibe', () => {
        const first = themeForRoom({ id: 'legacy-room-abc', vibe: null });
        const second = themeForRoom({ id: 'legacy-room-abc', vibe: null });
        const other = themeForRoom({ id: 'legacy-room-abc', vibe: 'not_a_real_vibe' });

        // Same id always resolves to the same theme...
        expect(first).toBe(second);
        // ...whether the vibe is missing or simply unrecognized.
        expect(first).toBe(other);
    });

    it('gives different ids a chance at different fallback themes', () => {
        const a = themeForRoom({ id: 'a', vibe: null });
        const z = themeForRoom({ id: 'zzzzzzzzzz', vibe: null });

        expect(a).not.toBe(z);
    });
});
