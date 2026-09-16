import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ResidentsPanel() {
  const { profile } = useAuth()
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteApt, setInviteApt] = useState('')
  const [inviteStatus, setInviteStatus] = useState(null)
  const [sending, setSending] = useState(false)

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

  async function inviteResident(e) {
    e.preventDefault()
    setSending(true)
    setInviteStatus(null)

    try {
      const res = await fetch('/api/invite-resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          residence_id: profile.residence_id,
          apartment_number: inviteApt,
          syndic_id: profile.id
        })
      })
      const data = await res.json()

      if (data.error) {
        setInviteStatus({ ok: false, message: data.error })
      } else {
        setInviteStatus({ ok: true, message: 'Invitation envoyee avec succes !' })
        setInviteEmail('')
        setInviteApt('')
      }
    } catch (err) {
      setInviteStatus({ ok: false, message: 'Erreur reseau, reessayez.' })
    }
    setSending(false)
  }

  if (loading) return <p className="muted">Chi lhda9a...</p>

  return (
    <div className="panel">
      <div className="card invite-card">
        <h3>Inviter un resident par email</h3>
        <p className="muted small">Le resident recevra un email pour creer son mot de passe et acceder a son compte.</p>
        <form onSubmit={inviteResident} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
          <input
            type="email"
            placeholder="email@exemple.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="N appartement"
            value={inviteApt}
            onChange={e => setInviteApt(e.target.value)}
          />
          <button className="btn-secondary small" type="submit" disabled={sending}>
            {sending ? 'Envoi en cours' : 'Envoyer invitation'}
          </button>
        </form>
        {inviteStatus && (
          <p className={inviteStatus.ok ? 'success small' : 'error small'} style={{ marginTop: '8px' }}>
            {inviteStatus.message}
          </p>
        )}
      </div>

      <div className="card invite-card">
        <h3>Code d'invitation de la residence</h3>
        <p className="muted small">Partagez ce code avec la societe externe pour qu'elle puisse creer son compte et rejoindre la residence.</p>
        <div className="invite-code-box">
          <code>{profile.residences?.invite_code}</code>
          <button className="btn-secondary small" onClick={copyCode}>{copied ? 'Copie !' : 'Copier'}</button>
        </div>
      </div>

      <div className="card">
        <h3>Membres ({residents.length})</h3>
        <table className="mini-table">
          <thead>
            <tr><th>Nom</th><th>Role</th><th>Appartement</th><th>Telephone</th></tr>
          </thead>
          <tbody>
            {residents.map(r => (
              <tr key={r.id}>
                <td>{r.full_name}</td>
                <td>{r.role === 'resident' ? 'Resident' : r.role === 'syndic' ? 'Syndic' : 'Societe externe'}</td>
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
