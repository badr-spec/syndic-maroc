import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function AnnouncementsPanel({ canManage }) {
  const { profile, user } = useAuth()
  const { t } = useLanguage()
  const [activeSubTab, setActiveSubTab] = useState('annonces') // 'annonces' or 'votes'
  const [items, setItems] = useState([])
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', content: '' })
  const [pollForm, setPollForm] = useState({ question: '', description: '', deadline: '' })
  const [creating, setCreating] = useState(false)
  const [creatingPoll, setCreatingPoll] = useState(false)

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('residence_id', profile.residence_id)
      .order('created_at', { ascending: false })
    setItems(data || [])

    // Load polls from localStorage
    const savedPolls = localStorage.getItem(`syndic_polls_${profile.residence_id}`)
    if (savedPolls) {
      try {
        setPolls(JSON.parse(savedPolls))
      } catch (e) {
        setPolls([])
      }
    } else {
      const initialPolls = [
        {
          id: 'poll-1',
          question: 'Installation de 4 caméras de surveillance dans le hall & parking sous-sol',
          description: 'Devis reçu de 4.800 DH pour l\'installation complète avec enregistreur 30 jours.',
          deadline: '2026-10-15',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          votes: {
            pour: ['demo-user-syndic', 'res-1', 'res-2', 'res-3', 'res-4'],
            contre: ['res-5'],
            abstention: []
          }
        },
        {
          id: 'poll-2',
          question: 'Travaux de peinture de la cage d\'escalier & changement des luminaires LED',
          description: 'Prévision pour le mois prochain. Budget estimé à 3.200 DH.',
          deadline: '2026-10-31',
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          votes: {
            pour: ['demo-user-syndic', 'res-1', 'res-2'],
            contre: [],
            abstention: ['res-3']
          }
        }
      ]
      setPolls(initialPolls)
      localStorage.setItem(`syndic_polls_${profile.residence_id}`, JSON.stringify(initialPolls))
    }

    setLoading(false)
  }

  useEffect(() => {
    if (profile?.residence_id) loadData()
  }, [profile])

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    try {
      const { error } = await supabase.from('announcements').insert({
        residence_id: profile.residence_id,
        title: form.title,
        content: form.content,
        created_by: user.id
      })
      if (error) throw error
      setForm({ title: '', content: '' })
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  function handleCreatePoll(e) {
    e.preventDefault()
    if (!pollForm.question) return
    setCreatingPoll(true)
    const newPoll = {
      id: `poll-${Date.now()}`,
      question: pollForm.question,
      description: pollForm.description,
      deadline: pollForm.deadline || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      votes: {
        pour: [user?.id || profile?.id],
        contre: [],
        abstention: []
      }
    }
    const updated = [newPoll, ...polls]
    setPolls(updated)
    localStorage.setItem(`syndic_polls_${profile.residence_id}`, JSON.stringify(updated))
    setPollForm({ question: '', description: '', deadline: '' })
    setCreatingPoll(false)
  }

  function handleVote(pollId, choice) {
    const userId = user?.id || profile?.id || 'demo-user-resident'
    const updated = polls.map(p => {
      if (p.id !== pollId) return p
      const votes = { ...p.votes }
      // Remove previous vote if any
      votes.pour = (votes.pour || []).filter(id => id !== userId)
      votes.contre = (votes.contre || []).filter(id => id !== userId)
      votes.abstention = (votes.abstention || []).filter(id => id !== userId)
      // Add new vote
      votes[choice] = [...(votes[choice] || []), userId]
      return { ...p, votes }
    })
    setPolls(updated)
    localStorage.setItem(`syndic_polls_${profile.residence_id}`, JSON.stringify(updated))
  }

  async function handleDelete(id) {
    if (!confirm(t('announcements.confirmDelete'))) return
    await supabase.from('announcements').delete().eq('id', id)
    loadData()
  }

  function handleDeletePoll(id) {
    if (!confirm('Supprimer ce sondage ?')) return
    const updated = polls.filter(p => p.id !== id)
    setPolls(updated)
    localStorage.setItem(`syndic_polls_${profile.residence_id}`, JSON.stringify(updated))
  }

  if (loading) return <p className="muted">{t('common.loading')}</p>

  const currentUserId = user?.id || profile?.id || 'demo-user-resident'

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <button
          type="button"
          className={'tab' + (activeSubTab === 'annonces' ? ' active' : '')}
          style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.88rem' }}
          onClick={() => setActiveSubTab('annonces')}
        >
          📢 Annonces Officielles ({items.length})
        </button>
        <button
          type="button"
          className={'tab' + (activeSubTab === 'votes' ? ' active' : '')}
          style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.88rem' }}
          onClick={() => setActiveSubTab('votes')}
        >
          🗳️ Sondages & Votes Express ({polls.length})
        </button>
      </div>

      {activeSubTab === 'annonces' && (
        <>
          {canManage && (
            <div className="card">
              <h3>{t('announcements.publishTitle')}</h3>
              <form onSubmit={handleCreate} className="stacked-form">
                <input required placeholder={t('announcements.titlePlaceholder')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <textarea required rows={3} placeholder={t('announcements.contentPlaceholder')} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                <button className="btn-primary" disabled={creating}>{creating ? t('announcements.publishing') : t('announcements.publish')}</button>
              </form>
            </div>
          )}

          {items.length === 0 && <p className="muted">{t('announcements.none')}</p>}

          {items.map(item => (
            <div key={item.id} className="card">
              <div className="charge-head">
                <div>
                  <h4>{item.title}</h4>
                  <span className="muted small">{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {canManage && <button className="btn-text" onClick={() => handleDelete(item.id)}>{t('common.delete')}</button>}
              </div>
              <p style={{ marginTop: '8px', lineHeight: 1.5 }}>{item.content}</p>
            </div>
          ))}
        </>
      )}

      {activeSubTab === 'votes' && (
        <>
          {canManage && (
            <div className="card" style={{ border: '1.5px solid #6366f1', background: '#faf5ff' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#4338ca' }}>🗳️ Créer une consultation / vote pour les copropriétaires</h3>
              <form onSubmit={handleCreatePoll} className="stacked-form">
                <input
                  required
                  placeholder="Question soumise au vote (ex: Remplacement des caméras, Peinture...)"
                  value={pollForm.question}
                  onChange={e => setPollForm({ ...pollForm, question: e.target.value })}
                />
                <textarea
                  rows={2}
                  placeholder="Détails du projet, devis et impact financier pour les copropriétaires..."
                  value={pollForm.description}
                  onChange={e => setPollForm({ ...pollForm, description: e.target.value })}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="small" style={{ fontWeight: 600 }}>Date limite de vote :</label>
                  <input
                    type="date"
                    value={pollForm.deadline}
                    onChange={e => setPollForm({ ...pollForm, deadline: e.target.value })}
                    style={{ padding: '6px 10px' }}
                  />
                  <button className="btn-primary" type="submit" disabled={creatingPoll}>
                    {creatingPoll ? 'Publication...' : 'Lancer le vote'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {polls.length === 0 && <p className="muted">Aucun vote en cours actuellement.</p>}

          {polls.map(poll => {
            const pourCount = poll.votes?.pour?.length || 0
            const contreCount = poll.votes?.contre?.length || 0
            const abstCount = poll.votes?.abstention?.length || 0
            const totalVotes = pourCount + contreCount + abstCount

            const pourPct = totalVotes > 0 ? Math.round((pourCount / totalVotes) * 100) : 0
            const contrePct = totalVotes > 0 ? Math.round((contreCount / totalVotes) * 100) : 0
            const abstPct = totalVotes > 0 ? Math.round((abstCount / totalVotes) * 100) : 0

            const userVotedPour = poll.votes?.pour?.includes(currentUserId)
            const userVotedContre = poll.votes?.contre?.includes(currentUserId)
            const userVotedAbst = poll.votes?.abstention?.includes(currentUserId)

            return (
              <div key={poll.id} className="card" style={{ borderLeft: '4px solid #6366f1' }}>
                <div className="charge-head" style={{ marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', margin: 0 }}>{poll.question}</h4>
                    <span className="muted small">
                      Clôture le {new Date(poll.deadline).toLocaleDateString('fr-FR')} · {totalVotes} vote(s) exprimé(s)
                    </span>
                  </div>
                  {canManage && (
                    <button className="btn-text" onClick={() => handleDeletePoll(poll.id)} style={{ color: '#ef4444' }}>
                      Supprimer
                    </button>
                  )}
                </div>

                {poll.description && (
                  <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '14px' }}>
                    {poll.description}
                  </p>
                )}

                {/* Progress bar */}
                <div style={{
                  height: '14px',
                  background: '#e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  overflow: 'hidden',
                  marginBottom: '10px'
                }}>
                  <div style={{ width: `${pourPct}%`, background: '#10b981', transition: 'width 0.3s' }} title={`Pour: ${pourPct}%`} />
                  <div style={{ width: `${contrePct}%`, background: '#ef4444', transition: 'width 0.3s' }} title={`Contre: ${contrePct}%`} />
                  <div style={{ width: `${abstPct}%`, background: '#94a3b8', transition: 'width 0.3s' }} title={`Abstention: ${abstPct}%`} />
                </div>

                {/* Vote stats */}
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', marginBottom: '14px' }}>
                  <span style={{ color: '#047857', fontWeight: 700 }}>👍 Pour : {pourCount} ({pourPct}%)</span>
                  <span style={{ color: '#b91c1c', fontWeight: 700 }}>👎 Contre : {contreCount} ({contrePct}%)</span>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>⚪ Abstention : {abstCount} ({abstPct}%)</span>
                </div>

                {/* Voting Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Votre vote :</span>
                  <button
                    type="button"
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: userVotedPour ? '2px solid #047857' : '1px solid #cbd5e1',
                      background: userVotedPour ? '#dcfce7' : '#ffffff',
                      color: userVotedPour ? '#047857' : '#334155',
                      fontWeight: userVotedPour ? 800 : 600,
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                    onClick={() => handleVote(poll.id, 'pour')}
                  >
                    👍 Pour {userVotedPour ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: userVotedContre ? '2px solid #b91c1c' : '1px solid #cbd5e1',
                      background: userVotedContre ? '#fee2e2' : '#ffffff',
                      color: userVotedContre ? '#b91c1c' : '#334155',
                      fontWeight: userVotedContre ? 800 : 600,
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                    onClick={() => handleVote(poll.id, 'contre')}
                  >
                    👎 Contre {userVotedContre ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: userVotedAbst ? '2px solid #64748b' : '1px solid #cbd5e1',
                      background: userVotedAbst ? '#f1f5f9' : '#ffffff',
                      color: userVotedAbst ? '#475569' : '#64748b',
                      fontWeight: userVotedAbst ? 800 : 600,
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                    onClick={() => handleVote(poll.id, 'abstention')}
                  >
                    ⚪ Abstention {userVotedAbst ? '✓' : ''}
                  </button>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
