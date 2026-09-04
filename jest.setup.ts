// Importing the package registers its jest matchers (toBeVisible, etc.) —
// RNTL 12.4+ bundles them, no separate jest-native package needed.
import '@testing-library/react-native';

// Real i18n config (not a mock) so tests assert against the actual copy in
// src/i18n/locales/en.ts — a test that hardcodes stale copy will fail the
// same way a user would notice it, instead of silently matching a mock key.
import '@/i18n';
