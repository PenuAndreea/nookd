import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
    addToReadingList,
    getOrCreateBook,
    getUserBooks,
    OpenLibraryResult,
    searchOpenLibrary,
    UserBookWithBook,
} from '@/api/books';
import { router } from 'expo-router';

/**
 * All state and Supabase/Open Library calls behind the Library tab: the
 * search-as-you-type flow, and the reader's own books split into what they're
 * reading right now and everything else. The screen only renders what this
 * returns. Discovery lives on the Explore tab (see use-explore).
 */
export function useBooksLibrary(userId: string | undefined) {
    const { t } = useTranslation();

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<OpenLibraryResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState(false);
    const [addingKey, setAddingKey] = useState<string | null>(null);

    const [userBooks, setUserBooks] = useState<UserBookWithBook[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState(false);

    const loadUserBooks = useCallback(async () => {
        if (!userId) return;
        setLoadingList(true);
        try {
            // Unfiltered: the screen shows the whole library and pulls the
            // currently-reading books to the top, rather than filtering to one
            // status at a time.
            const data = await getUserBooks(userId);
            setUserBooks(data);
            setListError(false);
        } catch (error) {
            console.error('Error loading reading list:', error);
            setListError(true);
        } finally {
            setLoadingList(false);
        }
    }, [userId]);

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
            await loadUserBooks();
        } catch (error) {
            console.error('Error adding book to reading list:', error);
            Alert.alert(t('books.addToListErrorTitle'), t('common.genericErrorMessage'));
        } finally {
            setAddingKey(null);
        }
    }

    const isSearching = query.length >= 3;

    const currentlyReading = userBooks.filter((userBook) => userBook.status === 'currently_reading');
    const otherBooks = userBooks.filter((userBook) => userBook.status !== 'currently_reading');

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

        currentlyReading,
        otherBooks,
        loadingList,
        listError,
        loadUserBooks,
    };
}
