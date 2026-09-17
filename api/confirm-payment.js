import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

function buildReceiptHtml({ residentName, residenceName, amount, date, paymentId, chargeTitle }) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background:#0f3d2e; color:#fff; padding:20px; text-align:center;">
      <h2 style="margin:0;">Syndic Maroc</h2>
    </div>
    <div style="padding: 24px;">
      <h3 style="color:#0f3d2e;">Preuve de paiement / إثبات الدفع</h3>
      <hr/>
      <p><strong>Résidence :</strong> ${residenceName}</p>
      <p><strong>Résident/Société :</strong> ${residentName}</p>
      <p><strong>Objet :</strong> ${chargeTitle || '—'}</p>
      <p><strong>Montant :</strong> ${amount} DH</p>
      <p><strong>Date :</strong> ${date}</p>
      <p><strong>Référence paiement :</strong> ${paymentId}</p>
      <p style="color:green;"><strong>Statut : Payé ✅</strong></p>
      <hr/>
      <p dir="rtl" style="text-align:right;"><strong>الإقامة:</strong> ${residenceName}</p>
      <p dir="rtl" style="text-align:right;"><strong>الساكن/الشركة:</strong> ${residentName}</p>
      <p dir="rtl" style="text-align:right;"><strong>الموضوع:</strong> ${chargeTitle || '—'}</p>
      <p dir="rtl" style="text-align:right;"><strong>المبلغ:</strong> ${amount} درهم</p>
      <p dir="rtl" style="text-align:right;"><strong>التاريخ:</strong> ${date}</p>
      <p dir="rtl" style="text-align:right;"><strong>رقم العملية:</strong> ${paymentId}</p>
      <p dir="rtl" style="text-align:right; color:green;"><strong>الحالة: مدفوع ✅</strong></p>
      <hr/>
      <p style="font-size:12px; color:#888; text-align:center;">Ce document est une preuve automatique générée par Syndic Maroc.<br/>هذه وثيقة آلية صادرة عن Syndic Maroc.</p>
    </div>
  </div>`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { payment_id, action, syndic_id } = req.body

  const { data: payment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('*, charges(title), profiles:paid_by(full_name, id), residences:residence_id(name, syndic_id)')
    .eq('id', payment_id)
    .single()

  if (fetchError || !payment) {
    return res.status(404).json({ error: 'Paiement introuvable' })
  }

  if (payment.residences?.syndic_id !== syndic_id) {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  const newStatus = action === 'confirm' ? 'paid' : 'rejected'

  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      status: newStatus,
      paid_at: action === 'confirm' ? new Date().toISOString() : payment.paid_at,
      confirmed_by: syndic_id
    })
    .eq('id', payment_id)

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  if (action === 'confirm') {
    const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(payment.paid_by)
    const email = userAuth?.user?.email

    if (email) {
      try {
        await transporter.sendMail({
          from: `"Syndic Maroc" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: 'Preuve de paiement / إثبات الدفع - Syndic Maroc',
          html: buildReceiptHtml({
            residentName: payment.profiles?.full_name || '—',
            residenceName: payment.residences?.name || '—',
            amount: payment.amount,
            date: new Date().toLocaleDateString('fr-FR'),
            paymentId: payment.id,
            chargeTitle: payment.charges?.title
          })
        })
        await supabaseAdmin.from('payments').update({ receipt_sent: true }).eq('id', payment_id)
      } catch (emailErr) {
        console.error('Email error:', emailErr)
      }
    }
  }

  return res.status(200).json({ success: true, status: newStatus })
}
