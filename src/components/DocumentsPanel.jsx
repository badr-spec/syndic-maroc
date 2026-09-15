import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function DocumentsPanel({ canManage }) {
  const { profile, user } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState('general')

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('residence_id', profile.residence_id)
      .order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.residence_id) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const path = `${profile.residence_id}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file)
      if (uploadError) throw uploadError

      const { error: dbError } = await supabase.from('documents').insert({
        residence_id: profile.residence_id,
        name: file.name,
        category,
        file_path: path,
        uploaded_by: user.id
      })
      if (dbError) throw dbError
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDownload(doc) {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 60)
    if (error) return alert(error.message)
    window.open(data.signedUrl, '_blank')
  }

  async function handleDelete(doc) {
    if (!confirm('Bghiti thyd had l\'document?')) return
    await supabase.storage.from('documents').remove([doc.file_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    loadData()
  }

  if (loading) return <p className="muted">Chi lhda9a...</p>

  return (
    <div className="panel">
      {canManage && (
        <div className="card">
          <h3>Ajouter un document</h3>
          <div className="inline-form">
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="general">Général</option>
              <option value="proces-verbal">Procès-verbal</option>
              <option value="reglement">Règlement intérieur</option>
              <option value="facture">Facture</option>
              <option value="contrat">Contrat</option>
            </select>
            <input type="file" onChange={handleUpload} disabled={uploading} />
          </div>
          {uploading && <p className="muted small">Chi t'upload...</p>}
        </div>
      )}

      {docs.length === 0 && <p className="muted">Ma kayn ta document daba.</p>}

      <div className="doc-grid">
        {docs.map(doc => (
          <div key={doc.id} className="card doc-card">
            <span className="doc-category">{doc.category}</span>
            <strong>{doc.name}</strong>
            <span className="muted small">{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
            <div className="row-buttons">
              <button className="btn-secondary small" onClick={() => handleDownload(doc)}>Télécharger</button>
              {canManage && <button className="btn-text" onClick={() => handleDelete(doc)}>Supprimer</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
