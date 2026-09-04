import { render, screen } from '@testing-library/react-native';

import RoomThumbnail from '@/components/molecules/room-thumbnail';

describe('RoomThumbnail', () => {
    it('sizes a square thumbnail by width when not stretched', async () => {
        await render(<RoomThumbnail room={{ id: 'room-1', vibe: 'fantasy' }} width={80} />);

        const frame = screen.root!;
        expect(frame.props.style).toEqual(
            expect.arrayContaining([expect.objectContaining({ width: 80, height: 80 })])
        );
    });

    it('uses a fixed taller height when stretched', async () => {
        await render(<RoomThumbnail room={{ id: 'room-1', vibe: 'fantasy' }} width={80} stretch />);

        const frame = screen.root!;
        expect(frame.props.style).toEqual(
            expect.arrayContaining([expect.objectContaining({ width: 80, height: 96 })])
        );
    });
});
