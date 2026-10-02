import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import ChargesPanel from '../../components/ChargesPanel'
import AnnouncementsPanel from '../../components/AnnouncementsPanel'
import DocumentsPanel from '../../components/DocumentsPanel'
import VirementForm from '../../components/VirementForm'
import ReclamationsPanel from '../../components/ReclamationsPanel'
import AssembleesPanel from '../../components/AssembleesPanel'
import NavigationTabs from '../../components/NavigationTabs'
import ParkingPanel from '../../components/ParkingPanel'
import ReservationsPanel from '../../components/ReservationsPanel'

export default function ResidentDashboard() {
  const { profile } = useAuth()
  const { t, lang } = useLanguage()
  const isAr = lang === 'ar'
  const [tab, setTab] = useState('charges')

  const TABS = [
    { key: 'charges', label: t('tabs.myCharges') },
    { key: 'parking', label: isAr ? '🚗 المرآب والسيارات' : '🚗 Mon Parking' },
    { key: 'reservations', label: isAr ? '📅 حجز السطح والمرافق' : '📅 Réserver un équipement' },
    { key: 'assemblees', label: t('tabs.assemblees') },
    { key: 'reclamations', label: t('tabs.reclamations') },
    { key: 'virement', label: t('tabs.virement') },
    { key: 'annonces', label: t('tabs.announcements') },
    { key: 'documents', label: t('tabs.documents') }
  ]

  return (
    <div>
      <div className="page-head">
        <h1>{t('residentDashboard.hello')} {profile.full_name.split(' ')[0]}</h1>
        <p className="muted">{profile.residences?.name} {profile.apartment_number && `· ${t('residentDashboard.apt')} ${profile.apartment_number}`}</p>
      </div>

      <NavigationTabs
        tabs={TABS}
        activeTab={tab}
        onChangeTab={setTab}
        role="resident"
      />

      {tab === 'charges' && <ChargesPanel canManage={false} />}
      {tab === 'parking' && <ParkingPanel canManage={false} />}
      {tab === 'reservations' && <ReservationsPanel canManage={false} />}
      {tab === 'assemblees' && <AssembleesPanel canManage={false} />}
      {tab === 'reclamations' && <ReclamationsPanel canManage={false} />}
      {tab === 'virement' && <VirementForm />}
      {tab === 'annonces' && <AnnouncementsPanel canManage={false} />}
      {tab === 'documents' && <DocumentsPanel canManage={false} />}
    </div>
  )
}
