import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { syndic_id, invitation_id, admin_id } = req.body

  if (!admin_id) {
    return res.status(400).json({ error: 'admin_id manquant' })
  }

  // security check: chi khass ykon admin bach ymsah
  const { data: requester, error: reqError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', admin_id)
    .single()

  if (reqError || !requester || requester.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé : action réservée aux administrateurs.' })
  }

  // cas 1: syndic 3ndo compte deja (accepted) -> khasna nmsaho mn auth.users
  //         profiles ghadi ytmsah wahdo (on delete cascade, chof schema.sql)
  if (syndic_id) {
    const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(syndic_id)
    if (delError) {
      return res.status(400).json({ error: delError.message })
    }
    return res.status(200).json({ success: true })
  }

  // cas 2: invitation mazal pending (syndic mazal ma-dkhalch) -> ghir msah l-invitation
  if (invitation_id) {
    const { error: invDelError } = await supabaseAdmin
      .from('invitations')
      .delete()
      .eq('id', invitation_id)
    if (invDelError) {
      return res.status(400).json({ error: invDelError.message })
    }
    return res.status(200).json({ success: true })
  }

  return res.status(400).json({ error: 'syndic_id ولا invitation_id khasshom ykono mzoudin.' })
}
