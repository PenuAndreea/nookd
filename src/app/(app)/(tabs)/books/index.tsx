import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import Typography from '@/components/atoms/typography';
import BookLibraryList from '@/components/organisms/book-library-list';
import BookSearchResults from '@/components/organisms/book-search-results';
import { SearchField } from '@/components/molecules/search-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useBooksLibrary } from '@/hooks/use-books-library';
import { useTheme } from '@/hooks/use-theme';

export { default as ErrorBoundary } from '@/components/organisms/route-error-boundary';

export default function BooksScreen() {
    const { session } = useAuth();
    const userId = session?.user?.id;
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    const {
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
    } = useBooksLibrary(userId);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Typography variant="title1">{t('books.title')}</Typography>

            <SearchField
                placeholder={t('books.searchPlaceholder')}
                value={query}
                onChangeText={search}
                loading={searching}
            />

            {isSearching ? (
                <BookSearchResults
                    query={query}
                    results={searchResults}
                    searching={searching}
                    searchError={searchError}
                    addingKey={addingKey}
                    onRetry={() => search(query)}
                    onOpen={openResult}
                    onQuickAdd={quickAdd}
                />
            ) : (
                <BookLibraryList
                    activelyReadItems={activelyReadItems}
                    popularBookItems={popularBookItems}
                    status={status}
                    onStatusChange={setStatus}
                    userBooks={userBooks}
                    loadingList={loadingList}
                    listError={listError}
                    onRetry={loadUserBooks}
                />
            )}
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        marginTop: Spacing.six,
        marginHorizontal: Spacing.three,
        backgroundColor: colors.background,
        gap: Spacing.three,
    },
});
