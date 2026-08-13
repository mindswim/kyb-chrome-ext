import { describe, expect, it } from 'vitest';
import { pickAutoConfirm } from './resolve';
import type { EntityCandidate } from './types';

const c = (name: string, confidence: number): EntityCandidate => ({
  name,
  confidence,
  origin: 'footer',
});

describe('pickAutoConfirm', () => {
  it('auto-confirms a strong, well-separated top candidate', () => {
    expect(pickAutoConfirm([c('Paseo, Inc.', 0.94), c('Paseo Coffee LLC', 0.38)])?.name).toBe(
      'Paseo, Inc.',
    );
  });

  it('asks when the top candidate is weak', () => {
    expect(pickAutoConfirm([c('Vantis Labs, Inc.', 0.61), c('Vantis', 0.22)])).toBeNull();
  });

  it('asks when two candidates are close, even if both are strong', () => {
    expect(pickAutoConfirm([c('Acme, Inc.', 0.9), c('Acme Holdings, Inc.', 0.88)])).toBeNull();
  });

  it('handles a single strong candidate and an empty list', () => {
    expect(pickAutoConfirm([c('Solo Corp', 0.9)])?.name).toBe('Solo Corp');
    expect(pickAutoConfirm([])).toBeNull();
  });
});
