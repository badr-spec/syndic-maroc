import { createClient } from '@supabase/supabase-js'

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, residence_id, apartment_number, syndic_id } = req.body || {}

  const supabaseAdmin = getAdmin()
  if (!supabaseAdmin) {
    return res.status(200).json({ success: true, mocked: true })
  }

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

  const { error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${req.headers.origin || 'http://localhost:3000'}/complete-inscription`
  })
  if (authError) {
    return res.status(400).json({ error: authError.message })
  }

  return res.status(200).json({ success: true })
}

