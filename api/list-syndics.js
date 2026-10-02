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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseAdmin = getAdmin()
  if (!supabaseAdmin) {
    return res.status(200).json({
      syndics: [
        {
          id: 'demo-syndic-1',
          full_name: 'Mohammed Benjelloun',
          phone: '+212 6 61 12 23 34',
          email: 'syndic@demo.ma',
          residence_id: 'res-andalous-1',
          residence_name: 'Résidence Al Andalous',
          status: 'active'
        },
        {
          id: 'invite-demo-2',
          invitation_id: 'inv-demo-2',
          full_name: 'Fatima Zahra Mansouri',
          phone: '+212 6 65 54 43 32',
          email: 'f.mansouri@syndic.ma',
          residence_id: 'res-andalous-2',
          residence_name: 'Résidence Majorelle',
          status: 'pending'
        }
      ]
    })
  }

  // 1) jib les profiles bach role = syndic, m3a la residence dyalhom

  const { data: profiles, error: profError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, phone, residence_id, created_at, residences:residence_id(id, name)')
    .eq('role', 'syndic')
    .order('created_at', { ascending: false })

  if (profError) {
    return res.status(400).json({ error: profError.message })
  }

  // 2) jib les emails mn auth.users (l-email makaynch f profiles table)
  //    listUsers kaydir pagination, khasna njib bezaf bach ntgtaw ga3 les users
  let emailById = {}
  try {
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    if (!usersError && usersData?.users) {
      for (const u of usersData.users) {
        emailById[u.id] = u.email
      }
    }
  } catch (err) {
    console.warn('Could not list auth users:', err.message)
  }

  const acceptedEmails = new Set()
  const syndics = profiles.map(p => {
    const email = emailById[p.id] || null
    if (email) acceptedEmails.add(email.toLowerCase())
    return {
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      email,
      residence_id: p.residence_id,
      residence_name: p.residences?.name || null,
      status: 'active'
    }
  })

  // 3) jib les invitations li mazal ma-tsanadatch (invite mrsl, wakha l-syndic mazal
  //    ma-dkhalch bach ysswb password -> mazal 3ndo profile)
  const { data: invitations, error: invError } = await supabaseAdmin
    .from('invitations')
    .select('id, email, residence_id, created_at, residences:residence_id(id, name)')
    .eq('role', 'syndic')
    .order('created_at', { ascending: false })

  if (!invError && invitations) {
    for (const inv of invitations) {
      if (!inv.email || acceptedEmails.has(inv.email.toLowerCase())) continue // deja accepted
      syndics.push({
        id: `invite-${inv.id}`,
        invitation_id: inv.id,
        full_name: null,
        phone: null,
        email: inv.email,
        residence_id: inv.residence_id,
        residence_name: inv.residences?.name || null,
        status: 'pending'
      })
    }
  }

  return res.status(200).json({ syndics })
}
