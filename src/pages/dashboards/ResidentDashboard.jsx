import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import ChargesPanel from '../../components/ChargesPanel'
import AnnouncementsPanel from '../../components/AnnouncementsPanel'
import DocumentsPanel from '../../components/DocumentsPanel'

const TABS = [
  { key: 'charges', label: 'Mes charges' },
  { key: 'annonces', label: 'Annonces' },
  { key: 'documents', label: 'Documents' }
]

export default function ResidentDashboard() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('charges')

  return (
    <div>
      <div className="page-head">
        <h1>Bonjour, {profile.full_name.split(' ')[0]}</h1>
        <p className="muted">{profile.residences?.name} {profile.apartment_number && `· Apt ${profile.apartment_number}`}</p>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.key} className={'tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'charges' && <ChargesPanel canManage={false} />}
      {tab === 'annonces' && <AnnouncementsPanel canManage={false} />}
      {tab === 'documents' && <DocumentsPanel canManage={false} />}
    </div>
  )
}
