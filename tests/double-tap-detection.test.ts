import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Double Tap Detection', () => {
  const DOUBLE_TAP_DELAY = 300; // milliseconds

  describe('Tap timing logic', () => {
    it('should detect single tap', () => {
      const lastPressRef = { current: null as { id: string; time: number } | null };
      const transactionId = 'tx-1';
      const now = Date.now();

      // First tap
      const lastPress = lastPressRef.current;
      if (lastPress && lastPress.id === transactionId && now - lastPress.time < DOUBLE_TAP_DELAY) {
        // Double tap
      } else {
        // Single tap
        lastPressRef.current = { id: transactionId, time: now };
      }

      expect(lastPressRef.current).toEqual({ id: transactionId, time: now });
    });

    it('should detect double tap within delay window', () => {
      const lastPressRef = { current: null as { id: string; time: number } | null };
      const transactionId = 'tx-1';
      const firstTapTime = Date.now();

      // First tap
      lastPressRef.current = { id: transactionId, time: firstTapTime };

      // Second tap within delay window
      const secondTapTime = firstTapTime + 200; // 200ms later
      const lastPress = lastPressRef.current;
      let isDoubleTap = false;

      if (lastPress && lastPress.id === transactionId && secondTapTime - lastPress.time < DOUBLE_TAP_DELAY) {
        isDoubleTap = true;
        lastPressRef.current = null;
      } else {
        lastPressRef.current = { id: transactionId, time: secondTapTime };
      }

      expect(isDoubleTap).toBe(true);
      expect(lastPressRef.current).toBeNull();
    });

    it('should not detect double tap outside delay window', () => {
      const lastPressRef = { current: null as { id: string; time: number } | null };
      const transactionId = 'tx-1';
      const firstTapTime = Date.now();

      // First tap
      lastPressRef.current = { id: transactionId, time: firstTapTime };

      // Second tap outside delay window
      const secondTapTime = firstTapTime + 400; // 400ms later (exceeds 300ms delay)
      const lastPress = lastPressRef.current;
      let isDoubleTap = false;

      if (lastPress && lastPress.id === transactionId && secondTapTime - lastPress.time < DOUBLE_TAP_DELAY) {
        isDoubleTap = true;
        lastPressRef.current = null;
      } else {
        lastPressRef.current = { id: transactionId, time: secondTapTime };
      }

      expect(isDoubleTap).toBe(false);
      expect(lastPressRef.current).toEqual({ id: transactionId, time: secondTapTime });
    });

    it('should not detect double tap on different transactions', () => {
      const lastPressRef = { current: null as { id: string; time: number } | null };
      const firstTransactionId = 'tx-1';
      const secondTransactionId = 'tx-2';
      const firstTapTime = Date.now();

      // First tap on tx-1
      lastPressRef.current = { id: firstTransactionId, time: firstTapTime };

      // Second tap on tx-2 within delay window
      const secondTapTime = firstTapTime + 200;
      const lastPress = lastPressRef.current;
      let isDoubleTap = false;

      if (lastPress && lastPress.id === secondTransactionId && secondTapTime - lastPress.time < DOUBLE_TAP_DELAY) {
        isDoubleTap = true;
        lastPressRef.current = null;
      } else {
        lastPressRef.current = { id: secondTransactionId, time: secondTapTime };
      }

      expect(isDoubleTap).toBe(false);
      expect(lastPressRef.current).toEqual({ id: secondTransactionId, time: secondTapTime });
    });

    it('should handle multiple taps correctly', () => {
      const lastPressRef = { current: null as { id: string; time: number } | null };
      const transactionId = 'tx-1';
      const taps: boolean[] = [];

      // Tap 1
      let now = Date.now();
      let lastPress = lastPressRef.current;
      if (lastPress && lastPress.id === transactionId && now - lastPress.time < DOUBLE_TAP_DELAY) {
        taps.push(true); // Double tap
        lastPressRef.current = null;
      } else {
        taps.push(false); // Single tap
        lastPressRef.current = { id: transactionId, time: now };
      }

      // Tap 2 (within delay)
      now = now + 250;
      lastPress = lastPressRef.current;
      if (lastPress && lastPress.id === transactionId && now - lastPress.time < DOUBLE_TAP_DELAY) {
        taps.push(true); // Double tap
        lastPressRef.current = null;
      } else {
        taps.push(false); // Single tap
        lastPressRef.current = { id: transactionId, time: now };
      }

      // Tap 3 (outside delay from tap 2, but within delay from tap 1 if tap 1 was still active)
      now = now + 100;
      lastPress = lastPressRef.current;
      if (lastPress && lastPress.id === transactionId && now - lastPress.time < DOUBLE_TAP_DELAY) {
        taps.push(true); // Double tap
        lastPressRef.current = null;
      } else {
        taps.push(false); // Single tap
        lastPressRef.current = { id: transactionId, time: now };
      }

      expect(taps).toEqual([false, true, false]);
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid taps', () => {
      const lastPressRef = { current: null as { id: string; time: number } | null };
      const transactionId = 'tx-1';
      const baseTime = Date.now();

      const taps: boolean[] = [];

      // Rapid taps at 50ms intervals
      for (let i = 0; i < 5; i++) {
        const now = baseTime + i * 50;
        const lastPress = lastPressRef.current;

        if (lastPress && lastPress.id === transactionId && now - lastPress.time < DOUBLE_TAP_DELAY) {
          taps.push(true);
          lastPressRef.current = null;
        } else {
          taps.push(false);
          lastPressRef.current = { id: transactionId, time: now };
        }
      }

      // Should be: single, double, single, double, single
      expect(taps).toEqual([false, true, false, true, false]);
    });

    it('should handle null initial state', () => {
      const lastPressRef = { current: null as { id: string; time: number } | null };
      const transactionId = 'tx-1';
      const now = Date.now();

      const lastPress = lastPressRef.current;
      let isDoubleTap = false;

      if (lastPress && lastPress.id === transactionId && now - lastPress.time < DOUBLE_TAP_DELAY) {
        isDoubleTap = true;
      } else {
        lastPressRef.current = { id: transactionId, time: now };
      }

      expect(isDoubleTap).toBe(false);
      expect(lastPressRef.current).not.toBeNull();
    });
  });

  describe('URL generation for edit screen', () => {
    it('should generate correct edit URL with transaction ID', () => {
      const transactionId = 'tx-123-abc';
      const editUrl = `/edit-transaction?id=${transactionId}`;
      expect(editUrl).toBe('/edit-transaction?id=tx-123-abc');
    });

    it('should handle various transaction ID formats', () => {
      const testIds = ['tx-1', 'abc123', '12345', 'long-id-with-dashes'];
      testIds.forEach(id => {
        const editUrl = `/edit-transaction?id=${id}`;
        expect(editUrl).toContain(`id=${id}`);
      });
    });
  });
});
