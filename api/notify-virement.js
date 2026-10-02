import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

function getAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  try {
    return createClient(url, key)
  } catch {
    return null
  }
}

const KIND_LABEL = { virement: 'virement', devis: 'devis', facture: 'facture' }

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

async function emailOf(admin, id) {
  const { data } = await admin.auth.admin.getUserById(id)
  return data?.user?.email || null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const admin = getAdmin()
  if (!admin) {
    return res.status(200).json({ sent: 1, mocked: true })
  }

  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    const { data: { user }, error: authErr } = await admin.auth.getUser(token)
    if (authErr || !user) return res.status(401).json({ error: 'Non autorisé' })

    const { virementId, event } = req.body || {}
    const { data: v } = await admin.from('virements').select('*').eq('id', virementId).single()
    if (!v) return res.status(404).json({ error: 'Introuvable' })

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(200).json({ sent: 1, note: 'Email skipped: Gmail credentials not configured' })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })

    // Syndic a payé une facture -> prévenir la société
    if (event === 'paiement') {
      const { data: me } = await admin.from('profiles').select('role, residence_id').eq('id', user.id).single()
      if (!me || me.role !== 'syndic' || me.residence_id !== v.residence_id) {
        return res.status(403).json({ error: 'Interdit' })
      }
      const to = await emailOf(admin, v.resident_id)
      if (!to || !v.payment_proof_path) return res.status(200).json({ sent: 0 })

      const { data: signed } = await admin.storage.from('preuves')
        .createSignedUrl(v.payment_proof_path, 60 * 60 * 24 * 7)

      await transporter.sendMail({
        from: `"Syndic Maroc" <${process.env.GMAIL_USER}>`,
        to,
        subject: `Facture payée : ${v.amount} MAD`,
        html: `
          <h3>Votre facture a été payée par virement</h3>
          <p><b>Objet :</b> ${escapeHtml(v.note)}</p>
          <p><b>Montant :</b> ${v.amount} MAD</p>
          ${v.payment_reference ? `<p><b>Référence du virement :</b> ${escapeHtml(v.payment_reference)}</p>` : ''}
          <p><a href="${signed?.signedUrl}">Voir la preuve de virement</a> (lien valable 7 jours)</p>`,
      })
      return res.status(200).json({ sent: 1 })
    }

    // Nouvel envoi (virement résident, devis ou facture société) -> prévenir le(s) syndic(s)
    if (v.resident_id !== user.id) return res.status(403).json({ error: 'Interdit' })

    const { data: sender } = await admin.from('profiles')
      .select('full_name, apartment_number, role').eq('id', user.id).single()

    const { data: syndics } = await admin.from('profiles')
      .select('id').eq('residence_id', v.residence_id).eq('role', 'syndic')

    const emails = []
    for (const s of syndics || []) {
      const e = await emailOf(admin, s.id)
      if (e) emails.push(e)
    }
    if (!emails.length) return res.status(200).json({ sent: 0 })

    const { data: signed } = await admin.storage.from('preuves')
      .createSignedUrl(v.proof_path, 60 * 60 * 24 * 7)

    const kind = KIND_LABEL[v.kind] || 'virement'
    const isSociete = kind !== 'virement'
    const nom = escapeHtml(sender?.full_name || user.email)

    await transporter.sendMail({
      from: `"Syndic Maroc" <${process.env.GMAIL_USER}>`,
      to: emails,
      subject: isSociete
        ? `Nouveau ${kind} reçu : ${sender?.full_name || user.email} (${v.amount} MAD)`
        : `Nouveau virement déclaré : ${sender?.full_name || user.email} (${v.amount} MAD)`,
      html: `
        <h3>${isSociete ? `Nouveau ${kind} à traiter` : 'Nouveau virement à vérifier'}</h3>
        <p><b>${isSociete ? 'Société' : 'Résident'} :</b> ${nom}${!isSociete && sender?.apartment_number ? ' — appt ' + escapeHtml(sender.apartment_number) : ''}</p>
        <p><b>Montant :</b> ${v.amount} MAD</p>
        ${v.reference ? `<p><b>Référence :</b> ${escapeHtml(v.reference)}</p>` : ''}
        ${v.note ? `<p><b>${isSociete ? 'Objet' : 'Note'} :</b> ${escapeHtml(v.note)}</p>` : ''}
        <p><a href="${signed?.signedUrl}">Voir le document</a> (lien valable 7 jours)</p>
        <p>Connectez-vous à l'application (onglet ${isSociete ? '« Devis &amp; factures »' : '« Charges &amp; paiements »'}) pour le traiter.</p>`,
    })

    res.status(200).json({ sent: emails.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

