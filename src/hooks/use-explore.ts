import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    getActivelyReadBooks,
    getPopularBooks,
    PopularBook,
    RoomWithBook,
} from '@/api/books';
import { BookCarouselItem } from '@/components/molecules/book-carousel';

/**
 * The two discovery shelves behind the Explore tab: what people are reading in
 * rooms that are live right now, and which books have been read in the most
 * rooms over time.
 *
 * The shelves load independently — one failing leaves the other on screen, and
 * BookCarousel renders nothing for an empty list, so a failure degrades to a
 * missing shelf rather than an error page.
 */
export function useExplore() {
    const { t } = useTranslation();

    const [activelyRead, setActivelyRead] = useState<RoomWithBook[]>([]);
    const [popularBooks, setPopularBooks] = useState<PopularBook[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        await Promise.all([
            getActivelyReadBooks().then(setActivelyRead).catch((error) => {
                console.error('Error loading what others are reading:', error);
            }),
            getPopularBooks().then(setPopularBooks).catch((error) => {
                console.error('Error loading popular books:', error);
            }),
        ]);
        setLoading(false);
    }, []);

    useEffect(() => {
        function run() {
            load();
        }
        run();
    }, [load]);

    // Keyed by room id, not book id: tapping one of these takes you into that
    // room, and the same book can be open in more than one room at a time.
    const activelyReadItems: BookCarouselItem[] = activelyRead.map(({ id, book }) => ({ key: id, book }));
    const popularBookItems: BookCarouselItem[] = popularBooks.map(({ book, roomCount }) => ({
        key: book.id,
        book,
        subtitle: t('explore.popularBooksCount', { count: roomCount }),
    }));

    return { activelyReadItems, popularBookItems, loading, reload: load };
}
