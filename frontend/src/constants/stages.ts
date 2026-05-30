import type { Stage } from '@/lib/types';

export const STAGES: Stage[] = [
  'intake',
  'audit',
  'strategy',
  'build',
  'qa',
  'launch',
  'operate',
];

export const STAGE_LABEL: Record<Stage, string> = {
  intake: 'Intake',
  audit: 'Audit',
  strategy: 'Strategy',
  build: 'Build',
  qa: 'QA',
  launch: 'Launch',
  operate: 'Operate',
};
