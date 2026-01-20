/**
 * Haptic feedback utilities for mobile devices
 * Uses the Vibration API when available
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 50, 25],
  error: [50, 100, 50],
  selection: 15,
};

/**
 * Trigger haptic feedback on supported devices
 * @param pattern - The type of haptic feedback to trigger
 * @returns boolean - Whether haptic feedback was triggered
 */
export function triggerHaptic(pattern: HapticPattern = 'light'): boolean {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(patterns[pattern]);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Check if haptic feedback is supported on this device
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Cancel any ongoing vibration
 */
export function cancelHaptic(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(0);
  }
}
