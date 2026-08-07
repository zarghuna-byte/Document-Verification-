import {
  ClipboardCheck,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Settings,
  UploadCloud,
  UserCheck,
} from 'lucide-react';

/**
 * Sidebar navigation model, organised into employee-facing sections.
 *
 * Each section groups top-level links only. Internal document-processing
 * stages (technical validation, extraction, confidence, normalisation,
 * business rules, ...) are intentionally absent: they run automatically as
 * part of application verification and will surface later inside an
 * application's status view, not as sidebar navigation.
 */
export const NAVIGATION = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
      { id: 'applications', label: 'Applications', path: '/applications', icon: FolderOpen },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    items: [
      { id: 'upload', label: 'Upload Documents', path: '/upload', icon: UploadCloud },
    ],
  },
  {
    id: 'verification',
    label: 'Verification',
    items: [
      { id: 'completeness', label: 'Document Completeness', path: '/completeness', icon: ClipboardCheck },
      { id: 'reports', label: 'Validation Reports', path: '/reports', icon: FileText },
    ],
  },
  {
    id: 'review',
    label: 'Review',
    items: [
      { id: 'human-review', label: 'Human Review', path: '/human-review', icon: UserCheck },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    items: [
      { id: 'feedback', label: 'Feedback', path: '/feedback', icon: MessageSquare },
      { id: 'continuous-learning', label: 'Continuous Learning', path: '/continuous-learning', icon: RefreshCw },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

/** Flat list of every sidebar navigation leaf, in display order. */
export const NAV_ITEMS = NAVIGATION.flatMap(({ items }) => items);

/**
 * Internal routes that stay reachable (for future application-level workflow
 * screens and testing) but are not exposed in the sidebar.
 */
export const INTERNAL_ROUTES = [
  { id: 'technical-validation', label: 'Technical Validation', path: '/technical-validation' },
  { id: 'processing', label: 'Document Processing', path: '/processing' },
  { id: 'extraction', label: 'Field Extraction', path: '/extraction' },
  { id: 'confidence', label: 'Confidence Review', path: '/confidence' },
  { id: 'normalization', label: 'Normalization', path: '/normalization' },
  { id: 'business-rules', label: 'Business Rules', path: '/business-rules' },
];

/**
 * Look up a navigation entry by its route path.
 *
 * Nested module routes (e.g. "/applications/12/upload") are matched against the
 * nav path as a path boundary prefix so the navbar always reflects the parent
 * module. Exact matches win; the Dashboard entry is the fallback.
 *
 * @param {string} path The current location pathname.
 * @returns {object} The matching nav entry, defaulting to Dashboard.
 */
export function findNavItem(path) {
  const exact = NAV_ITEMS.find((item) => item.path === path);
  if (exact) {
    return exact;
  }
  const prefixed = NAV_ITEMS.filter(
    (item) => item.path !== '/' && path.startsWith(`${item.path}/`)
  );
  return prefixed.sort((a, b) => b.path.length - a.path.length)[0] ?? NAV_ITEMS[0];
}
