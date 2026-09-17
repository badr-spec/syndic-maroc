import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import ChargesPanel from '../../components/ChargesPanel'
import AnnouncementsPanel from '../../components/AnnouncementsPanel'
import DocumentsPanel from '../../components/DocumentsPanel'
import ResidentsPanel from '../../components/ResidentsPanel'

export default function SocieteDashboard() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState('charges')

  const isResponsableImmeuble = profile.role === 'responsable_immeuble'

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
        <p className="muted">
          {isResponsableImmeuble
            ? t('societeDashboard.immeubleManagement')
            : t('societeDashboard.delegatedManagement')} {profile.full_name}
        </p>
      </div>

      <div className="tabs">
        {TABS.map(tItem => (
          <button key={tItem.key} className={'tab' + (tab === tItem.key ? ' active' : '')} onClick={() => setTab(tItem.key)}>
            {tItem.label}
          </button>
        ))}
      </div>

      {tab === 'charges' && <ChargesPanel canManage={!isResponsableImmeuble} />}
      {tab === 'annonces' && <AnnouncementsPanel canManage={!isResponsableImmeuble} />}
      {tab === 'documents' && <DocumentsPanel canManage={!isResponsableImmeuble} />}
      {tab === 'residents' && <ResidentsPanel filterImmeubleId={isResponsableImmeuble ? profile.immeuble_id : null} />}
    </div>
  )
}
