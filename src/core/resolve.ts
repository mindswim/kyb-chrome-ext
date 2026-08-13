import type { EntityCandidate } from './types';

/**
 * Auto-confirm only when the top candidate is both strong and unambiguous.
 * Thresholds are deliberately conservative: a wrong auto-match in a
 * verification tool costs more than one extra click. Below them the panel
 * shows the chooser, and "change entity" remains the recovery path after
 * an auto-confirm.
 */
export const AUTO_CONFIRM_MIN = 0.85;
export const AUTO_CONFIRM_MARGIN = 0.3;

export function pickAutoConfirm(candidates: EntityCandidate[]): EntityCandidate | null {
  const [top, second] = candidates;
  if (!top || top.confidence < AUTO_CONFIRM_MIN) return null;
  if (second && top.confidence - second.confidence < AUTO_CONFIRM_MARGIN) return null;
  return top;
}
