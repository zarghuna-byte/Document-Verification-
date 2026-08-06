import {
  ArrowLeftRight,
  ClipboardCheck,
  Cog,
  FileText,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Scale,
  ScanSearch,
  Settings,
  ShieldCheck,
  UploadCloud,
  UserCheck,
} from 'lucide-react';

/**
 * Sidebar navigation model.
 *
 * Each entry declares its label, the route path and the icon rendered by the
 * Sidebar. The path doubles as the React Router destination and as the key for
 * deriving the page title and breadcrumb in the layout. The order mirrors the
 * document verification pipeline so the employee can see the full workflow.
 */
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { id: 'applications', label: 'Applications', path: '/applications', icon: FolderOpen },
  { id: 'upload', label: 'Upload Documents', path: '/upload', icon: UploadCloud },
  { id: 'completeness', label: 'Document Completeness', path: '/completeness', icon: ClipboardCheck },
  { id: 'technical-validation', label: 'Technical Validation', path: '/technical-validation', icon: ShieldCheck },
  { id: 'processing', label: 'Document Processing', path: '/processing', icon: Cog },
  { id: 'extraction', label: 'Field Extraction', path: '/extraction', icon: ScanSearch },
  { id: 'confidence', label: 'Confidence Review', path: '/confidence', icon: Gauge },
  { id: 'normalization', label: 'Normalization', path: '/normalization', icon: ArrowLeftRight },
  { id: 'business-rules', label: 'Business Rules', path: '/business-rules', icon: Scale },
  { id: 'reports', label: 'Validation Reports', path: '/reports', icon: FileText },
  { id: 'human-review', label: 'Human Review', path: '/human-review', icon: UserCheck },
  { id: 'feedback', label: 'Feedback', path: '/feedback', icon: MessageSquare },
  { id: 'continuous-learning', label: 'Continuous Learning', path: '/continuous-learning', icon: RefreshCw },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
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
