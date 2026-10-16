import { MilestoneType, RescueStatus } from './models';

export const RESCUE_STATUS_ORDER: RescueStatus[] = [
  'rescued',
  'in_care',
  'recovering',
  'ready_for_adoption',
  'adopted',
];

export const RESCUE_STATUS_LABELS: Record<RescueStatus, string> = {
  rescued: 'Rescued',
  in_care: 'In Care',
  recovering: 'Recovering',
  ready_for_adoption: 'Ready for Adoption',
  adopted: 'Adopted',
};

export function rescueStatusClass(status: RescueStatus): string {
  switch (status) {
    case 'rescued':
      return 'bg-sky-100 text-sky-800';
    case 'in_care':
      return 'bg-amber-100 text-amber-800';
    case 'recovering':
      return 'bg-violet-100 text-violet-800';
    case 'ready_for_adoption':
      return 'bg-emerald-100 text-emerald-800';
    case 'adopted':
      return 'bg-slate-800 text-white';
    default:
      return 'bg-slate-200 text-slate-700';
  }
}

export const MILESTONE_TYPE_LABELS: Record<MilestoneType, string> = {
  rescue: 'Rescue documented',
  first_day: 'First day in care',
  health: 'Health update',
  recovery: 'Recovery milestone',
  ready_for_adoption: 'Ready for adoption',
  adoption: 'Adoption completed',
  general: 'Update',
};

export function milestoneIcon(type: MilestoneType): string {
  switch (type) {
    case 'rescue':
      return '🆘';
    case 'first_day':
      return '🏠';
    case 'health':
      return '🩺';
    case 'recovery':
      return '💚';
    case 'ready_for_adoption':
      return '🌟';
    case 'adoption':
      return '🎉';
    default:
      return '📌';
  }
}

export function speciesIcon(species: string): string {
  switch (species?.toLowerCase()) {
    case 'dog':
      return '🐕';
    case 'cat':
      return '🐈';
    case 'rabbit':
      return '🐇';
    case 'bird':
      return '🐦';
    default:
      return '🐾';
  }
}

export function animalLabel(name: string | null | undefined): string {
  return name && name.trim().length > 0 ? name : 'Unknown';
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
