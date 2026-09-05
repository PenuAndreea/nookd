import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/atoms/icon';
import Typography from '@/components/atoms/typography';
import { SearchField } from '@/components/molecules/search-field';
import BookLibraryList from '@/components/organisms/book-library-list';
import BookSearchResults from '@/components/organisms/book-search-results';
import ContinueReadingCarousel from '@/components/organisms/continue-reading-carousel';
import { createCommonStyles } from '@/constants/common-styles';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useBooksLibrary } from '@/hooks/use-books-library';
import { useContinueReading } from '@/hooks/use-continue-reading';
import { useTheme } from '@/hooks/use-theme';

export { default as ErrorBoundary } from '@/components/organisms/route-error-boundary';

export default function LibraryScreen() {
    const { session } = useAuth();
    const userId = session?.user?.id;
    const colors = useTheme();
    const styles = createStyles(colors);
    const common = createCommonStyles();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [searchOpen, setSearchOpen] = useState(false);
    const continueReading = useContinueReading();

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
        currentlyReading,
        filteredBooks,
        filter,
        setFilter,
        loadingList,
        listError,
        loadUserBooks,
    } = useBooksLibrary(userId);

    function toggleSearch() {
        if (searchOpen) search('');
        setSearchOpen((open) => !open);
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
                <View style={styles.titleRow}>
                    <Typography variant="title1" color="inkText">{t('books.books')}</Typography>
                    <Pressable
                        onPress={toggleSearch}
                        hitSlop={12}
                        accessibilityRole="button"
                        accessibilityLabel={searchOpen ? t('books.searchClose') : t('books.searchToggle')}
                        style={({ pressed }) => pressed && common.pressed}
                    >
                        <Icon name={searchOpen ? 'xmark' : 'magnifyingglass'} color={colors.inkText} />
                    </Pressable>
                </View>

                {searchOpen ? (
                    <View style={styles.searchField}>
                        <SearchField
                            autoFocus
                            placeholder={t('books.searchPlaceholder')}
                            value={query}
                            onChangeText={search}
                            loading={searching}
                        />
                    </View>
                ) : (
                    <ContinueReadingCarousel books={currentlyReading} onContinue={continueReading} />
                )}
            </View>

            <KeyboardAvoidingView
                style={styles.panel}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
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
                        books={filteredBooks}
                        filter={filter}
                        onFilterChange={setFilter}
                        loadingList={loadingList}
                        listError={listError}
                        onRetry={loadUserBooks}
                    />
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        // Fixed navy in both themes. In dark mode this matches the page
        // background exactly, so only the panel's edge separates the two.
        backgroundColor: colors.ink,
    },
    header: {
        paddingBottom: Spacing.four,
        gap: Spacing.four,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.three,
    },
    searchField: {
        paddingHorizontal: Spacing.three,
    },
    panel: {
        flex: 1,
        backgroundColor: colors.white,
        borderTopLeftRadius: BorderRadius.xlarge,
        borderTopRightRadius: BorderRadius.xlarge,
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.four,
    },
});
