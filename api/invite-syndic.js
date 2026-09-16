import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, full_name, admin_id } = req.body

  const { error: invError } = await supabaseAdmin.from('invitations').insert({
    email,
    role: 'syndic',
    invited_by: admin_id
  })
  if (invError) {
    return res.status(400).json({ error: invError.message })
  }

  const { error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'https://syndic-maroc-pi.vercel.app/complete-inscription',
    data: { full_name }
  })
  if (authError) {
    return res.status(400).json({ error: authError.message })
  }

  return res.status(200).json({ success: true })
}
