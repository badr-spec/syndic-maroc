import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import ChargesPanel from '../../components/ChargesPanel'
import AnnouncementsPanel from '../../components/AnnouncementsPanel'
import DocumentsPanel from '../../components/DocumentsPanel'
import ResidentsPanel from '../../components/ResidentsPanel'

export default function SyndicDashboard() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState('charges')

  const TABS = [
    { key: 'charges', label: t('tabs.charges') },
    { key: 'annonces', label: t('tabs.announcements') },
    { key: 'documents', label: t('tabs.documents') },
    { key: 'residents', label: t('tabs.residents') }
  ]

  return (
    <div>
      <div className="page-head">
        <h1>{profile.residences?.name}</h1>
        <p className="muted">{t('syndicDashboard.managementSpace')} {profile.full_name}</p>
      </div>

      <div className="tabs">
        {TABS.map(tItem => (
          <button key={tItem.key} className={'tab' + (tab === tItem.key ? ' active' : '')} onClick={() => setTab(tItem.key)}>
            {tItem.label}
          </button>
        ))}
      </div>

      {tab === 'charges' && <ChargesPanel canManage={true} />}
      {tab === 'annonces' && <AnnouncementsPanel canManage={true} />}
      {tab === 'documents' && <DocumentsPanel canManage={true} />}
      {tab === 'residents' && <ResidentsPanel />}
    </div>
  )
}
