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

  const { syndic_id, email, new_password, admin_id } = req.body || {}

  if (!new_password || (!syndic_id && !email)) {
    return res.status(400).json({ error: 'Paramètres manquants (syndic_id ou email, et new_password requis)' })
  }

  const supabaseAdmin = getAdmin()
  if (!supabaseAdmin) {
    return res.status(200).json({ success: true, mocked: true })
  }

  try {
    let targetUserId = syndic_id
    if (!targetUserId && email) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
      const found = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (found) targetUserId = found.id
    }

    if (!targetUserId) {
      return res.status(404).json({ error: 'Utilisateur syndic non trouvé dans Supabase Auth' })
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      password: new_password
    })

    if (updateError) {
      return res.status(400).json({ error: updateError.message })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
