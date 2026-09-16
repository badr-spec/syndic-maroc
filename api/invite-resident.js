import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, residence_id, apartment_number, syndic_id } = req.body

  const { error: invError } = await supabaseAdmin.from('invitations').insert({
    email,
    role: 'resident',
    residence_id,
    apartment_number,
    invited_by: syndic_id
  })
  if (invError) {
    return res.status(400).json({ error: invError.message })
  }

  const { error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(e
