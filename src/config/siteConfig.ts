export interface CategoryConfig {
  slug: string;
  name: string;
  shortName: string;
  description: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    slug: 'types-functions',
    name: 'Mechanical Types & Configurations',
    shortName: 'Types & Profiles',
    description: 'Double, half, thumbturn, BK privacy, offset, and international lock cylinder profiles.'
  },
  {
    slug: 'materials-finishes',
    name: 'Materials & Surface Treatments',
    shortName: 'Materials & Finishes',
    description: 'Solid brass metallurgy, PVD coatings, satin nickel, antique finishes, and corrosion tests.'
  },
  {
    slug: 'keying-systems',
    name: 'Keying Systems & Master Key Hierarchy',
    shortName: 'Master Keying',
    description: 'Keyed alike (KA), keyed different (KD), construction keying, and 2-5 level master key matrices.'
  },
  {
    slug: 'security-mechanisms',
    name: 'Security & Anti-Attack Engineering',
    shortName: 'Security Mechanisms',
    description: 'Sacrificial anti-snap grooves, hardened anti-drill pins, anti-bump, and anti-pick engineering.'
  },
  {
    slug: 'standards-testing',
    name: 'Standards, Testing & Compliance',
    shortName: 'Standards & Testing',
    description: 'EN 1303 European classification codes, ANSI/BHMA Grade 1 durability, and fire door ratings.'
  },
  {
    slug: 'sizing-installation',
    name: 'Sizing, Cam Types & Installation',
    shortName: 'Sizing & Installation',
    description: 'A/B dimension measurement, offset calculation, DIN 30° cams, and cogwheel compatibility.'
  }
];