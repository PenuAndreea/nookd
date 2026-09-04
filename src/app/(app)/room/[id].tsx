import BottomSheet from '@gorhom/bottom-sheet';
import { useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import Button from '@/components/atoms/button';
import { TypographyStyles } from '@/components/atoms/typography';
import { ErrorState } from '@/components/molecules/error-state';
import { Header } from '@/components/molecules/header';
import ReadingPickerSheet from '@/components/organisms/reading-picker-sheet';
import ReflectionSheet from '@/components/organisms/reflection-sheet';
import RoomDetailsSheet from '@/components/organisms/room-details-sheet';
import TimerCard from '@/components/organisms/timer-card';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRoomData } from '@/hooks/use-room-data';
import { useRoomReflection } from '@/hooks/use-room-reflection';
import { useRoomSession } from '@/hooks/use-room-session';
import { useTheme } from '@/hooks/use-theme';

export { default as ErrorBoundary } from '@/components/organisms/route-error-boundary';

export default function SilentRoomScreen() {
    const { id, autojoin } = useLocalSearchParams<{ id: string; autojoin?: string }>();
    const { session } = useAuth();
    const colors = useTheme();
    const isDark = useColorScheme() === 'dark';
    const userId = session?.user?.id;
    const { t } = useTranslation();
    const roomId = Array.isArray(id) ? id[0] : id;

    const bottomSheetRef = useRef<BottomSheet>(null);
    const reflectionSheetRef = useRef<BottomSheet>(null);
    const readingPickerRef = useRef<BottomSheet>(null);

    const { room, roomError, retryRoom, userBookForRoom, libraryBooks, libraryError, retryLibrary, theme } = useRoomData(roomId, userId);

    const {
        members,
        memberCount,
        lastSessionId,
        isJoined,
        presenceError,
        hasCheckedMembership,
        displayedElapsedSeconds,
        booksInRoom,
        selfHasBook,
        handleJoinPress,
        handleLeaveRoom,
        handleSelectBook,
        handleSkipBook,
        openReadingPicker,
    } = useRoomSession({
        roomId,
        userId,
        room,
        libraryBooks,
        autojoin,
        bottomSheetRef,
        reflectionSheetRef,
        readingPickerRef,
    });

    const { handleReflectionSubmit, handleReflectionSkip } = useRoomReflection({
        room,
        userBookForRoom,
        lastSessionId,
        userId,
        reflectionSheetRef,
    });

    const openDetails = () => {
        bottomSheetRef.current?.snapToIndex(1);
    };

    // The theme illustrations are light-mode artwork with no dark variant, so
    // matching the screen to their sampled background only makes sense in
    // light mode — in dark mode the page falls back to the app's own dark
    // creme rather than pairing a bright pastel illustration with a bright
    // pastel background regardless of the user's chosen theme.
    const screenBackground = theme && !isDark ? theme.background : colors.creme;

    // The room row failed to load and we have nothing to render around it —
    // every other piece of this screen (timer, sheets) needs `room` to mean
    // anything, so show a single full-screen error instead of a page of
    // blank/fallback pieces.
    if (roomError && !room) {
        return (
            <View style={{ flex: 1, backgroundColor: screenBackground }}>
                <Header title='' showBack />
                <ErrorState
                    title={t('rooms.loadRoomErrorTitle')}
                    subtitle={t('rooms.loadRoomErrorSubtitle')}
                    onRetry={retryRoom}
                />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: screenBackground }}>
            <Header
                title=''
                showBack
                right={hasCheckedMembership && !isJoined ? (
                    <Button title={t('rooms.join')} size="small" onPress={handleJoinPress} />
                ) : undefined}
            />
            {isJoined && presenceError && (
                <Text style={[styles.presenceWarning, { color: colors.statusPopularFg, backgroundColor: colors.statusPopularBg }]}>
                    {t('rooms.presenceIssue')}
                </Text>
            )}
            <View style={{ flex: 1 }}>
                {theme && (
                    <Animated.View style={styles.illustration}>
                        <Image
                            source={theme.source}
                            style={styles.illustrationImage}
                            resizeMode="cover"
                        />
                    </Animated.View>
                )}
                <TimerCard
                    elapsedSeconds={displayedElapsedSeconds}
                    duration={room?.duration_minutes ?? null}
                    memberCount={memberCount}
                    onPress={openDetails}
                />
            </View>

            <RoomDetailsSheet
                ref={bottomSheetRef}
                room={room}
                memberCount={memberCount}
                members={members}
                userId={userId}
                booksInRoom={booksInRoom}
                isJoined={isJoined}
                selfHasBook={selfHasBook}
                onAddBook={openReadingPicker}
                onLeaveRoom={handleLeaveRoom}
            />

            <ReflectionSheet
                ref={reflectionSheetRef}
                book={room?.book ?? null}
                initialPage={userBookForRoom?.current_page}
                onSubmit={handleReflectionSubmit}
                onSkip={handleReflectionSkip}
            />

            <ReadingPickerSheet
                ref={readingPickerRef}
                books={libraryBooks}
                error={libraryError}
                onRetry={retryLibrary}
                onSelect={handleSelectBook}
                onSkip={handleSkipBook}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    presenceWarning: {
        ...TypographyStyles.smallBold,
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        textAlign: 'center',
        paddingVertical: 4,
        zIndex: 1,
    },
    illustration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        // Taller than the square source, so "cover" trims a little from each
        // side and the art fills more of the screen. The matching background
        // colour carries it the rest of the way down.
        height: '55%',
        overflow: 'hidden',
    },
    illustrationImage: {
        width: '100%',
        height: '100%',
        // Every theme file carries a 1–2px dark border. Scaling up slightly
        // pushes it outside the clipped container so it never shows as a line.
        transform: [{ scale: 1.04 }],
    },
});
