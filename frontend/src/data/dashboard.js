import { CheckCircle2, Clock, FileText, FolderOpen } from 'lucide-react';

/**
 * Static profile shown in the sidebar footer and the top navigation bar.
 * Real authentication lands in a later phase; this is presentational data.
 */
export const USER_PROFILE = {
  name: 'Employee',
  role: 'Verification Officer',
  initials: 'EM',
  online: true,
};

/**
 * Dummy headline statistics for the Dashboard landing page. The values are
 * placeholders until the backend endpoints are integrated in later phases.
 */
export const STAT_CARDS = [
  { id: 'applications', label: 'Applications', value: '1,248', icon: FolderOpen },
  { id: 'documents', label: 'Documents', value: '3,567', icon: FileText },
  { id: 'pending-reviews', label: 'Pending Reviews', value: '87', icon: Clock },
  { id: 'completed-reviews', label: 'Completed Reviews', value: '1,020', icon: CheckCircle2 },
];

/**
 * The completed verification pipeline shown as a horizontal stepper on the
 * Dashboard. The labels mirror the backend modules built across the project.
 */
export const PIPELINE_STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'completeness', label: 'Completeness' },
  { id: 'technical-validation', label: 'Technical Validation' },
  { id: 'processing', label: 'Processing' },
  { id: 'extraction', label: 'Extraction' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'normalization', label: 'Normalization' },
  { id: 'rules', label: 'Rules' },
  { id: 'reports', label: 'Reports' },
  { id: 'human-review', label: 'Human Review' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'learning', label: 'Learning' },
];
