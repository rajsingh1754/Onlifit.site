import { describe, it, expect, vi } from 'vitest';
import { initSentry, captureError, setGymContext } from '../sentry.js';

describe('Sentry Module', () => {
  it('initSentry runs without crashing when no DSN', () => {
    expect(() => initSentry()).not.toThrow();
  });

  it('captureError logs to console when no DSN', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    captureError(new Error('test error'), { page: 'dashboard' });
    expect(spy).toHaveBeenCalledWith(
      '[Onlifit Error]',
      expect.any(Error),
      expect.objectContaining({ page: 'dashboard' })
    );
    spy.mockRestore();
  });

  it('setGymContext runs without crashing when no DSN', () => {
    expect(() => setGymContext('GYM-001', 'Test Gym')).not.toThrow();
  });
});
