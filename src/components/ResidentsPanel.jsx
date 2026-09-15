import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ResidentsPanel() {
  const { profile } = useAuth()
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, phone, apartment_number, role, created_at')
        .eq('residence_id', profile.residence_id)
        .order('role')
      setResidents(data || [])
      setLoading(false)
    }
    if (profile?.residence_id) load()
  }, [profile])

  function copyCode() {
    navigator.clipboard.writeText(profile.residences?.invite_code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <p className="muted">Chi lhda9a...</p>

  return (
    <div className="panel">
      <div className="card invite-card">
        <h3>Code d'invitation de la résidence</h3>
        <p className="muted small">Partagez ce code avec les résidents et la société externe pour qu'ils puissent créer leur compte et rejoindre la résidence.</p>
        <div className="invite-code-box">
          <code>{profile.residences?.invite_code}</code>
          <button className="btn-secondary small" onClick={copyCode}>{copied ? 'Copié !' : 'Copier'}</button>
        </div>
      </div>

      <div className="card">
        <h3>Membres ({residents.length})</h3>
        <table className="mini-table">
          <thead>
            <tr><th>Nom</th><th>Rôle</th><th>Appartement</th><th>Téléphone</th></tr>
          </thead>
          <tbody>
            {residents.map(r => (
              <tr key={r.id}>
                <td>{r.full_name}</td>
                <td>{r.role === 'resident' ? 'Résident' : r.role === 'syndic' ? 'Syndic' : 'Société externe'}</td>
                <td>{r.apartment_number || '—'}</td>
                <td>{r.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
