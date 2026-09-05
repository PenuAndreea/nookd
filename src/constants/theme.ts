/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1D2E',
    // Light and close to neutral. The previous #f5f3ef carried a strong yellow
    // cast that read as dated next to the white cards sitting on it.
    background: '#F8F8F6',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#3e4c66',
    accent: '#FFC83D',
    white: '#fff',
    soft: '#EDEBE6',
    // Card and input edges. Was keyed to `background`, which no longer has
    // enough contrast against white surfaces now that it is near-neutral.
    border: '#EAE7E1',
    creme: '#FFF7ED',

    // Destructive / validation messaging (form errors).
    error: '#e24b4a',

    // Text/icons on any surface that is always literally white regardless of
    // theme (bottom sheets, cards, inputs, search fields, the header's back
    // button) — `colors.white` never flips, so text on it cannot use `text`/
    // `textSecondary` either, or it disappears in dark mode. Same values in
    // both palettes on purpose (see the dark section).
    sheetText: '#263238',
    sheetTextSecondary: '#8a8378',
    sheetHandle: '#d8d2c4',

    // Selectable chips (vibe/duration/mood pickers, book status filters).
    chipBackground: '#fff',
    chipBorder: '#e0e0e0',
    chipText: '#555',
    chipSelectedBackground: '#FFF3D6',
    chipSelectedBorder: '#f0b429',
    chipSelectedText: '#5a3a00',

    // Room "Popular / Live / Quiet" status badge.
    statusPopularBg: '#FDF1DC',
    statusPopularFg: '#8A6008',
    statusLiveBg: '#E7F4EC',
    statusLiveFg: '#2F7A4F',
    statusQuietBg: '#EFEDE9',
    statusQuietFg: '#7B7369',

    // The amber "current room" banner on Home.
    bannerBackground: '#FBF0D2',
    bannerTextSecondary: '#8A7A55',

    // The frosted timer card that floats over a room's (always light, static)
    // illustration. Deliberately the same near-white/near-black pair in both
    // modes — like the banner, it does not follow the app theme, since using
    // dark-mode `text` here would print near-white digits on this light card.
    timerCardBackground: 'rgba(255,253,250,0.97)',
    timerCardText: '#1A1D2E',
    timerCardTrack: '#EDE6D8',

    // Online-presence dot on the Home avatar — same green in both modes,
    // like `accent`, since "online" is a status colour, not a theme colour.
    presenceOnline: '#3BB273',

    // The app's fixed dark ink — same value in both modes. Used wherever a
    // surface is deliberately theme-invariant (the round icon button's dark
    // circle, text sitting on the always-`accent`-coloured primary button),
    // since pairing those with the flipping `text` token would turn them
    // near-white-on-yellow or near-white-on-white in dark mode.
    ink: '#1A1D2E',

    // Text on a surface that is always literally `ink` regardless of theme
    // (the Library header's navy band) — the mirror of the sheetText pair
    // above. `text` cannot be used there: it is near-black in light mode,
    // which would print navy on navy.
    inkText: '#F5F5F7',
    inkTextSecondary: '#A9AEC0',

    // Reading-progress bars. The fill is the palette's accent orange, which
    // reads far better than `accent` yellow in a 4px bar. Both tracks are
    // fixed for the same reason as their surfaces: `progressTrack` sits on
    // `white`, `progressTrackOnInk` on `ink`.
    accentStrong: '#FF8A00',
    progressTrack: '#E6E1D9',
    progressTrackOnInk: '#31364A',

    // A selected chip on an always-white surface (the Library's filter row).
    // The `chipSelected*` family above flips to a dark navy fill, which reads
    // as an inverted chip once the surface under it no longer flips too.
    chipOnWhiteSelectedBackground: '#FFF3D6',
    chipOnWhiteSelectedText: '#5a3a00',
  },
  dark: {
    text: '#F5F5F7',
    background: '#1A1D2E',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    accent: '#FFC83D',
    white: '#fff',
    soft: '#2A2D3E',
    border: '#33374A',
    creme: '#22252F',

    error: '#FF6B6A',

    // Same values as light, deliberately not flipped: the surface these sit
    // on (`white`) is a fixed `#fff` in both modes, so the text on it must
    // stay fixed-dark too, or it turns near-white-on-white in dark mode.
    sheetText: '#263238',
    sheetTextSecondary: '#8a8378',
    sheetHandle: '#d8d2c4',

    chipBackground: '#242838',
    chipBorder: '#3A3F52',
    chipText: '#C7CAD4',
    chipSelectedBackground: '#3D3116',
    chipSelectedBorder: '#FFC83D',
    chipSelectedText: '#FFD873',

    statusPopularBg: '#3D3116',
    statusPopularFg: '#FFD873',
    statusLiveBg: '#1D3327',
    statusLiveFg: '#6FCF97',
    statusQuietBg: '#2A2D3E',
    statusQuietFg: '#9EA3B0',

    // The banner keeps its amber identity in dark mode too — a deliberate
    // "spotlight" card rather than a surface that follows the page theme.
    bannerBackground: '#3D3116',
    bannerTextSecondary: '#C7B27A',

    timerCardBackground: 'rgba(255,253,250,0.97)',
    timerCardText: '#1A1D2E',
    timerCardTrack: '#EDE6D8',

    presenceOnline: '#3BB273',

    ink: '#1A1D2E',
    inkText: '#F5F5F7',
    inkTextSecondary: '#A9AEC0',
    accentStrong: '#FF8A00',
    progressTrack: '#E6E1D9',
    progressTrackOnInk: '#31364A',
    chipOnWhiteSelectedBackground: '#FFF3D6',
    chipOnWhiteSelectedText: '#5a3a00',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  none: 0,
  small: 4,
  medium: 8,
  large: 16,
  // The Library's white panel, whose top corners curve away from the navy
  // header above it.
  xlarge: 24,
  full: 9999,
} as const;

export const FontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

export const FontSizes = {
  xSmall: 12,
  small: 14,
  medium: 16,
  large: 20,
}

export const FontLineHeights = {
  xSmall: 16,
  small: 20,
  medium: 22,
  large: 34,
}

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
