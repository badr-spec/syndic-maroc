import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { payment_id, resident_id } = req.body

  if (!payment_id || !resident_id) {
    return res.status(400).json({ error: 'payment_id et resident_id requis' })
  }

  const { data: payment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('id, resident_id, status')
    .eq('id', payment_id)
    .single()

  if (fetchError || !payment) {
    return res.status(404).json({ error: 'Paiement introuvable' })
  }

  if (payment.resident_id !== resident_id) {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (payment.status !== 'pending') {
    return res.status(400).json({ error: 'Ce paiement a déjà été traité' })
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'declared',
      payment_method: 'virement',
      paid_by: resident_id
    })
    .eq('id', payment_id)
    .select()
    .single()

  if (updateError) {
    return res.status(400).json({ error: updateError.message })
  }

  return res.status(200).json({ success: true, payment: updated })
}
