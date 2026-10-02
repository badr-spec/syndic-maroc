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

  const { email, full_name, residence_name, admin_id, password } = req.body || {}

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (key.startsWith('sb_publishable_')) {
    return res.status(400).json({
      error: "Clé SUPABASE_SERVICE_ROLE_KEY invalide sur Vercel: vous avez configuré la clé publique 'publishable' au lieu de la clé secrète 'service_role'. Rendez-vous sur Supabase > Settings > API > service_role (secret)."
    })
  }

  const supabaseAdmin = getAdmin()
  if (!supabaseAdmin) {
    return res.status(200).json({ success: true, mocked: true })
  }

  const { data: residence, error: resError } = await supabaseAdmin
    .from('residences')
    .insert({ name: residence_name })
    .select()
    .single()

  if (resError) {
    if (/Invalid API key/i.test(resError.message)) {
      return res.status(400).json({
        error: "Clé SUPABASE_SERVICE_ROLE_KEY invalide sur Vercel. Veuillez copier la clé secrète 'service_role' depuis Supabase > Settings > API."
      })
    }
    return res.status(400).json({ error: resError.message })
  }

  const { error: invError } = await supabaseAdmin.from('invitations').insert({
    email,
    role: 'syndic',
    residence_id: residence.id,
    invited_by: admin_id
  })
  if (invError) {
    console.warn('invitation insert error:', invError.message)
  }

  let authError = null
  if (password) {
    const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })
    authError = createErr
  } else {
    const { error: invErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.origin || 'http://localhost:3000'}/complete-inscription`,
      data: { full_name }
    })
    authError = invErr
  }

  if (authError) {
    if (/Invalid API key/i.test(authError.message)) {
      return res.status(400).json({
        error: "Clé SUPABASE_SERVICE_ROLE_KEY invalide sur Vercel. Veuillez vérifier la variable d'environnement SUPABASE_SERVICE_ROLE_KEY dans les paramètres de votre projet Vercel."
      })
    }
    return res.status(400).json({ error: authError.message })
  }

  return res.status(200).json({ success: true })
}

