import {
  animalLabel,
  rescueStatusClass,
  RESCUE_STATUS_DESCRIPTIONS,
  RESCUE_STATUS_LABELS,
  RESCUE_STATUS_ORDER,
  RESCUE_STATUS_TRANSITION_HINTS,
  speciesIcon,
} from './rescue-status';

describe('rescue-status helpers', () => {
  it('lists every status in lifecycle order', () => {
    expect(RESCUE_STATUS_ORDER).toEqual([
      'rescued',
      'in_care',
      'recovering',
      'ready_for_adoption',
      'adopted',
    ]);
  });

  it('provides a label, description and transition hint for every status', () => {
    for (const status of RESCUE_STATUS_ORDER) {
      expect(RESCUE_STATUS_LABELS[status]).toBeTruthy();
      expect(RESCUE_STATUS_DESCRIPTIONS[status]).toBeTruthy();
      expect(RESCUE_STATUS_TRANSITION_HINTS[status]).toBeTruthy();
    }
  });

  it('returns a distinct badge class for each status', () => {
    const classes = RESCUE_STATUS_ORDER.map((status) => rescueStatusClass(status));
    expect(new Set(classes).size).toBe(RESCUE_STATUS_ORDER.length);
  });

  it('falls back to a friendly label when the name is empty', () => {
    expect(animalLabel(null)).toBe('Unnamed animal');
    expect(animalLabel('   ')).toBe('Unnamed animal');
    expect(animalLabel('Rex')).toBe('Rex');
  });

  it('maps known species to icons and falls back to a paw', () => {
    expect(speciesIcon('dog')).toBe('🐕');
    expect(speciesIcon('Cat')).toBe('🐈');
    expect(speciesIcon('dragon')).toBe('🐾');
  });
});
