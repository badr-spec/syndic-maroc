import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import ChargesPanel from '../../components/ChargesPanel'
import AnnouncementsPanel from '../../components/AnnouncementsPanel'
import DocumentsPanel from '../../components/DocumentsPanel'

export default function ResidentDashboard() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState('charges')

  const TABS = [
    { key: 'charges', label: t('tabs.myCharges') },
    { key: 'annonces', label: t('tabs.announcements') },
    { key: 'documents', label: t('tabs.documents') }
  ]

  return (
    <div>
      <div className="page-head">
        <h1>{t('residentDashboard.hello')} {profile.full_name.split(' ')[0]}</h1>
        <p className="muted">{profile.residences?.name} {profile.apartment_number && `· ${t('residentDashboard.apt')} ${profile.apartment_number}`}</p>
      </div>

      <div className="tabs">
        {TABS.map(tItem => (
          <button key={tItem.key} className={'tab' + (tab === tItem.key ? ' active' : '')} onClick={() => setTab(tItem.key)}>
            {tItem.label}
          </button>
        ))}
      </div>

      {tab === 'charges' && <ChargesPanel canManage={false} />}
      {tab === 'annonces' && <AnnouncementsPanel canManage={false} />}
      {tab === 'documents' && <DocumentsPanel canManage={false} />}
    </div>
  )
}
