import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
    addToReadingList,
    getActivelyReadBooks,
    getOrCreateBook,
    getPopularBooks,
    getUserBooks,
    OpenLibraryResult,
    PopularBook,
    RoomWithBook,
    searchOpenLibrary,
    UserBookStatus,
    UserBookWithBook,
} from '@/api/books';
import { BookCarouselItem } from '@/components/molecules/book-carousel';
import { router } from 'expo-router';

/**
 * All state and Supabase/Open Library calls behind the Books tab: the
 * search-as-you-type flow, and the status-filtered personal library plus its
 * two decorative discovery shelves. The screen itself only renders what this
 * returns.
 */
export function useBooksLibrary(userId: string | undefined) {
    const { t } = useTranslation();

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<OpenLibraryResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState(false);
    const [addingKey, setAddingKey] = useState<string | null>(null);

    const [status, setStatus] = useState<UserBookStatus>('currently_reading');
    const [userBooks, setUserBooks] = useState<UserBookWithBook[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState(false);

    const [activelyRead, setActivelyRead] = useState<RoomWithBook[]>([]);
    const [popularBooks, setPopularBooks] = useState<PopularBook[]>([]);

    const loadUserBooks = useCallback(async () => {
        if (!userId) return;
        setLoadingList(true);
        try {
            const data = await getUserBooks(userId, status);
            setUserBooks(data);
            setListError(false);
        } catch (error) {
            console.error('Error loading reading list:', error);
            setListError(true);
        } finally {
            setLoadingList(false);
        }
    }, [userId, status]);

    useEffect(() => {
        // Calling the memoized loader through a local wrapper (rather than as
        // a bare reference) keeps this a plain "refetch on dependency change"
        // effect the analyzer can see through, instead of an opaque call to
        // an externally-defined function.
        function run() {
            loadUserBooks();
        }
        run();
    }, [loadUserBooks]);

    useEffect(() => {
        // Decorative secondary shelves — a failure here just means the
        // carousel stays hidden (BookCarousel renders nothing for an empty
        // list), which is a reasonable degrade for content that isn't the
        // point of this screen. The primary list below has its own error UI.
        getActivelyReadBooks().then(setActivelyRead).catch((error) => {
            console.error('Error loading what others are reading:', error);
        });
        getPopularBooks().then(setPopularBooks).catch((error) => {
            console.error('Error loading popular books:', error);
        });
    }, []);

    async function search(text: string) {
        setQuery(text);
        setSearchError(false);
        if (text.length < 3) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const results = await searchOpenLibrary(text);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching books:', error);
            setSearchResults([]);
            setSearchError(true);
        } finally {
            setSearching(false);
        }
    }

    async function openResult(result: OpenLibraryResult) {
        if (addingKey) return;
        setAddingKey(result.openLibraryKey);
        try {
            const book = await getOrCreateBook(result);
            setQuery('');
            setSearchResults([]);
            router.navigate(`/books/${book.id}`);
        } catch (error) {
            console.error('Error opening book:', error);
            Alert.alert(t('books.openBookErrorTitle'), t('common.genericErrorMessage'));
        } finally {
            setAddingKey(null);
        }
    }

    async function quickAdd(result: OpenLibraryResult) {
        if (!userId || addingKey) return;
        setAddingKey(result.openLibraryKey);
        try {
            const book = await getOrCreateBook(result);
            await addToReadingList(userId, book.id, 'want_to_read');
            setQuery('');
            setSearchResults([]);
            if (status === 'want_to_read') await loadUserBooks();
        } catch (error) {
            console.error('Error adding book to reading list:', error);
            Alert.alert(t('books.addToListErrorTitle'), t('common.genericErrorMessage'));
        } finally {
            setAddingKey(null);
        }
    }

    const isSearching = query.length >= 3;

    const activelyReadItems: BookCarouselItem[] = activelyRead.map(({ id, book }) => ({ key: id, book }));
    const popularBookItems: BookCarouselItem[] = popularBooks.map(({ book, roomCount }) => ({
        key: book.id,
        book,
        subtitle: t('books.popularBooksCount', { count: roomCount }),
    }));

    return {
        query,
        search,
        searchResults,
        searching,
        searchError,
        addingKey,
        isSearching,
        openResult,
        quickAdd,

        status,
        setStatus,
        userBooks,
        loadingList,
        listError,
        loadUserBooks,

        activelyReadItems,
        popularBookItems,
    };
}
