// Gestionnaire de personnalisation des grilles d'onglets pour Syndic, Résident et Société de service

export const ALL_AVAILABLE_TABS = {
  charges: { key: 'charges', labelFr: 'Charges & Cotisations', labelAr: 'المساهمات والواجبات', icon: '💳', category: 'finances' },
  tresorerie: { key: 'tresorerie', labelFr: 'Trésorerie & Caisse', labelAr: 'الخزينة والصندوق', icon: '💰', category: 'finances' },
  parking: { key: 'parking', labelFr: 'Parking & Véhicules', labelAr: 'المرآب والسيارات', icon: '🚗', category: 'residence' },
  compteurs: { key: 'compteurs', labelFr: 'Compteurs Eau & Élec', labelAr: 'العدادات واستهلاك الماء والكهرباء', icon: '⚡💧', category: 'finances' },
  misedemeure: { key: 'misedemeure', labelFr: 'Mises en demeure (Loi 18-00)', labelAr: 'الإنذارات القانونية', icon: '⚖️', category: 'finances' },
  reservations: { key: 'reservations', labelFr: 'Réservations (Terrasse & Salle)', labelAr: 'حجز السطح والقاعة', icon: '📅', category: 'residence' },
  assemblees: { key: 'assemblees', labelFr: 'Assemblées & Votes AG', labelAr: 'الجمع العام والتصويت', icon: '🗳️', category: 'residence' },
  reclamations: { key: 'reclamations', labelFr: 'Pannes & Réclamations', labelAr: 'الأعطال والشكايات', icon: '🚨', category: 'residence' },
  annonces: { key: 'annonces', labelFr: 'Annonces & Avis', labelAr: 'الإعلانات وبلاغات الإقامة', icon: '📢', category: 'gestion' },
  documents: { key: 'documents', labelFr: 'Documents & Contrats', labelAr: 'الوثائق والقوانين الداخلية', icon: '📁', category: 'gestion' },
  residents: { key: 'residents', labelFr: 'Annuaire des Résidents', labelAr: 'دليل السكان والملاك', icon: '👥', category: 'gestion' },
  immeubles: { key: 'immeubles', labelFr: 'Gestion des Immeubles', labelAr: 'العمارات والشقق', icon: '🏢', category: 'gestion' },
  societes: { key: 'societes', labelFr: 'Prestataires & Devis', labelAr: 'شركات الصيانة والخدمات', icon: '🛠️', category: 'gestion' },
  virement: { key: 'virement', labelFr: 'Virement & Coordonnées RIB', labelAr: 'التحويل والـ RIB البنكي', icon: '💳', category: 'finances' },
  devis: { key: 'devis', labelFr: 'Devis & Estimations', labelAr: 'عروض الأسعار', icon: '📄', category: 'gestion' },
  facture: { key: 'facture', labelFr: 'Factures de service', labelAr: 'فواتير الصيانة', icon: '🧾', category: 'gestion' }
}

export const DEFAULT_ROLE_TABS = {
  syndic: [
    'charges',
    'tresorerie',
    'parking',
    'compteurs',
    'misedemeure',
    'reservations',
    'assemblees',
    'reclamations',
    'annonces',
    'documents',
    'residents',
    'immeubles',
    'societes'
  ],
  resident: [
    'charges',
    'parking',
    'reservations',
    'assemblees',
    'reclamations',
    'virement',
    'annonces',
    'documents'
  ],
  societe: [
    'devis',
    'facture',
    'annonces',
    'documents',
    'residents'
  ]
}

const STORAGE_KEY = 'syndic_maroc_custom_tabs'

export function getCustomTabsConfig() {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    if (val) {
      const parsed = JSON.parse(val)
      return {
        syndic: Array.isArray(parsed.syndic) ? parsed.syndic : DEFAULT_ROLE_TABS.syndic,
        resident: Array.isArray(parsed.resident) ? parsed.resident : DEFAULT_ROLE_TABS.resident,
        societe: Array.isArray(parsed.societe) ? parsed.societe : DEFAULT_ROLE_TABS.societe
      }
    }
  } catch (e) {}
  return { ...DEFAULT_ROLE_TABS }
}

export function saveCustomTabsConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    window.dispatchEvent(new CustomEvent('grid-tabs-updated', { detail: config }))
  } catch (e) {}
}

export function getTabsForRole(role) {
  const normRole = role === 'societe_externe' ? 'societe' : role
  const cfg = getCustomTabsConfig()
  return cfg[normRole] || DEFAULT_ROLE_TABS[normRole] || DEFAULT_ROLE_TABS.syndic
}

export function removeTabFromRole(role, tabKey) {
  const normRole = role === 'societe_externe' ? 'societe' : role
  const cfg = getCustomTabsConfig()
  const current = cfg[normRole] || [...DEFAULT_ROLE_TABS[normRole]]
  const updated = current.filter(k => k !== tabKey)
  // Ne pas vider complètement
  if (updated.length === 0) return current
  cfg[normRole] = updated
  saveCustomTabsConfig(cfg)
  return updated
}

export function addTabToRole(role, tabKey) {
  const normRole = role === 'societe_externe' ? 'societe' : role
  const cfg = getCustomTabsConfig()
  const current = cfg[normRole] || [...DEFAULT_ROLE_TABS[normRole]]
  if (!current.includes(tabKey)) {
    current.push(tabKey)
    cfg[normRole] = current
    saveCustomTabsConfig(cfg)
  }
  return current
}

export function resetRoleTabs(role) {
  const normRole = role === 'societe_externe' ? 'societe' : role
  const cfg = getCustomTabsConfig()
  cfg[normRole] = [...DEFAULT_ROLE_TABS[normRole]]
  saveCustomTabsConfig(cfg)
  return cfg[normRole]
}
