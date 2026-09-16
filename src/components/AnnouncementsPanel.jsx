import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function AnnouncementsPanel({ canManage }) {
  const { profile, user } = useAuth()
  const { t } = useLanguage()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', content: '' })
  const [creating, setCreating] = useState(false)

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('residence_id', profile.residence_id)
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.residence_id) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handleDelete(id) {
    if (!confirm(t('announcements.confirmDelete'))) return
    await supabase.from('announcements').delete().eq('id', id)
    loadData()
  }

  if (loading) return <p className="muted">{t('common.loading')}</p>

  return (
    <div className="panel">
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
          <p>{item.content}</p>
        </div>
      ))}
    </div>
  )
}
