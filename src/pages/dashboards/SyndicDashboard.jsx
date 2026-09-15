import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import ChargesPanel from '../../components/ChargesPanel'
import AnnouncementsPanel from '../../components/AnnouncementsPanel'
import DocumentsPanel from '../../components/DocumentsPanel'
import ResidentsPanel from '../../components/ResidentsPanel'

const TABS = [
  { key: 'charges', label: 'Charges & paiements' },
  { key: 'annonces', label: 'Annonces' },
  { key: 'documents', label: 'Documents' },
  { key: 'residents', label: 'Résidents' }
]

export default function SyndicDashboard() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('charges')

  return (
    <div>
      <div className="page-head">
        <h1>{profile.residences?.name}</h1>
        <p className="muted">Espace de gestion — {profile.full_name}</p>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.key} className={'tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
            {t.label}
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
