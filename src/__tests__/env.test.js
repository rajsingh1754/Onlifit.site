import { describe, it, expect } from 'vitest';
import { validateEnv } from '../env.js';

describe('Environment Validation', () => {
  it('validateEnv returns a boolean', () => {
    const result = validateEnv();
    expect(typeof result).toBe('boolean');
  });
});
