// src/config/navigation.ts
export interface NavItem {
  name: string;
  href: string;
}

export const HEADER_NAV_ITEMS: NavItem[] = [
  { name: 'All', href: '/' },
  { name: 'Types & Functions', href: '/types-functions' },
  { name: 'Materials & Finishes', href: '/materials-finishes' },
  { name: 'Keying Systems', href: '/keying-systems' },
  { name: 'Security Mechanisms', href: '/security-mechanisms' },
  { name: 'Standards & Testing', href: '/standards-testing' },
  { name: 'Sizing & Installation', href: '/sizing-installation' },
];