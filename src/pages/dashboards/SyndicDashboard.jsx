import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import ChargesPanel from '../../components/ChargesPanel'
import AnnouncementsPanel from '../../components/AnnouncementsPanel'
import DocumentsPanel from '../../components/DocumentsPanel'
import ResidentsPanel from '../../components/ResidentsPanel'
import ImmeublesPanel from '../../components/ImmeublesPanel'
import SocietesPanel from '../../components/SocietesPanel'
import DevisFacturesPanel from '../../components/DevisFacturesPanel'
import TresoreriePanel from '../../components/TresoreriePanel'
import ReclamationsPanel from '../../components/ReclamationsPanel'
import AssembleesPanel from '../../components/AssembleesPanel'
import ExecutiveSummaryCard from '../../components/ExecutiveSummaryCard'
import AfficheResidenceModal from '../../components/AfficheResidenceModal'
import NavigationTabs from '../../components/NavigationTabs'
import ParkingPanel from '../../components/ParkingPanel'
import CompteursPanel from '../../components/CompteursPanel'
import MisesEnDemeurePanel from '../../components/MisesEnDemeurePanel'
import ReservationsPanel from '../../components/ReservationsPanel'

export default function SyndicDashboard() {
  const { profile } = useAuth()
  const { t, lang } = useLanguage()
  const [tab, setTab] = useState('charges')
  const [showAfficheModal, setShowAfficheModal] = useState(false)

  const isAr = lang === 'ar'

  const TABS = [
    { key: 'charges', label: t('tabs.charges') },
    { key: 'tresorerie', label: t('tabs.tresorerie') },
    { key: 'parking', label: isAr ? '🚗 المرآب والسيارات' : '🚗 Parking & Voitures' },
    { key: 'compteurs', label: isAr ? '⚡💧 العدادات والتسربات' : '⚡💧 Compteurs & Fuites' },
    { key: 'misedemeure', label: isAr ? '⚖️ إنذارات الأداء (Loi 18-00)' : '⚖️ Mises en demeure (Loi 18-00)' },
    { key: 'reservations', label: isAr ? '📅 حجز السطح والمرافق' : '📅 Réservations d’équipements' },
    { key: 'assemblees', label: t('tabs.assemblees') },
    { key: 'reclamations', label: t('tabs.reclamations') },
    { key: 'annonces', label: t('tabs.announcements') },
    { key: 'documents', label: t('tabs.documents') },
    { key: 'residents', label: t('tabs.residents') },
    { key: 'immeubles', label: t('tabs.immeubles') },
    { key: 'societes', label: t('tabs.societes') }
  ]

  return (
    <div>
      <ExecutiveSummaryCard />

      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0 }}>{profile.residences?.name}</h1>
          <p className="muted" style={{ margin: '4px 0 0 0' }}>{t('syndicDashboard.managementSpace')} {profile.full_name}</p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowAfficheModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
            fontSize: '0.84rem',
            background: '#ffffff',
            border: '1.5px solid #047857',
            color: '#047857',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {lang === 'ar' ? '🖨️ ملصق مدخل الإقامة (QR Code)' : '🖨️ Affiche Hall d\'entrée (QR Code)'}
        </button>
      </div>

      <NavigationTabs
        tabs={TABS}
        activeTab={tab}
        onChangeTab={setTab}
        role="syndic"
      />

      {tab === 'charges' && <ChargesPanel canManage={true} />}
      {tab === 'tresorerie' && <TresoreriePanel />}
      {tab === 'parking' && <ParkingPanel canManage={true} />}
      {tab === 'compteurs' && <CompteursPanel canManage={true} />}
      {tab === 'misedemeure' && <MisesEnDemeurePanel canManage={true} />}
      {tab === 'reservations' && <ReservationsPanel canManage={true} />}
      {tab === 'assemblees' && <AssembleesPanel canManage={true} />}
      {tab === 'reclamations' && <ReclamationsPanel canManage={true} />}
      {tab === 'annonces' && <AnnouncementsPanel canManage={true} />}
      {tab === 'documents' && <DocumentsPanel canManage={true} />}
      {tab === 'residents' && <ResidentsPanel />}
      {tab === 'immeubles' && <ImmeublesPanel />}
      {(tab === 'societes' || tab === 'devis') && <SocietesPanel />}

      {showAfficheModal && (
        <AfficheResidenceModal
          residence={profile.residences}
          syndicProfile={profile}
          onClose={() => setShowAfficheModal(false)}
        />
      )}
    </div>
  )
}
