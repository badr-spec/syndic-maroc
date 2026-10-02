import { createClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const envUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

const isConfigured = Boolean(
  envUrl &&
  envKey &&
  !envUrl.includes('placeholder') &&
  !envUrl.includes('xxxxxxxx') &&
  !envUrl.includes('your-project') &&
  !envUrl.includes('aBcDe')
)

function getStorage(key, defaultValue) {
  try {
    const val = localStorage.getItem(`syndic_maroc_${key}`)
    if (val) return JSON.parse(val)
  } catch (e) {
    // fallback
  }
  return defaultValue
}

function setStorage(key, value) {
  try {
    localStorage.setItem(`syndic_maroc_${key}`, JSON.stringify(value))
  } catch (e) {
    // ignore
  }
}

function initDefaultDatabase() {
  const defaultResidences = [
    {
      id: 'res-andalous-1',
      name: 'Résidence Al Andalous',
      address: '142 Boulevard d’Anfa',
      city: 'Casablanca',
      syndic_id: 'demo-user-syndic',
      invite_code: 'ANDALOUS2026',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    }
  ]

  const defaultProfiles = [
    {
      id: 'demo-user-syndic',
      full_name: 'Mohammed Benjelloun',
      role: 'syndic',
      email: 'syndic@demo.ma',
      phone: '0661122334',
      residence_id: 'res-andalous-1',
      apartment_number: null,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'demo-user-resident',
      full_name: 'Karim El Amrani',
      role: 'resident',
      email: 'resident@demo.ma',
      phone: '0662233445',
      residence_id: 'res-andalous-1',
      apartment_number: 'B-14',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 'demo-user-societe',
      full_name: 'Société Atlas Propreté & Sécurité',
      role: 'societe',
      email: 'societe@demo.ma',
      phone: '0522334455',
      residence_id: 'res-andalous-1',
      apartment_number: null,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'demo-user-admin',
      full_name: 'Super Admin',
      role: 'admin',
      email: 'admin@demo.ma',
      phone: '0600000000',
      residence_id: null,
      apartment_number: null,
      created_at: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
      id: 'admin-badr-tabti',
      full_name: 'Badr Tabti (Super Admin)',
      role: 'admin',
      email: 'badr.tabti@gmail.com',
      phone: '0600000000',
      residence_id: null,
      apartment_number: null,
      created_at: new Date().toISOString()
    }
  ]

  const defaultCharges = [
    {
      id: 'chg-1',
      residence_id: 'res-andalous-1',
      title: 'Cotisation mensuelle — Octobre 2026',
      description: 'Entretien ascenseur, nettoyage des parties communes, éclairage et gardiennage.',
      amount: 500,
      due_date: '2026-10-31',
      created_by: 'demo-user-syndic',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'chg-2',
      residence_id: 'res-andalous-1',
      title: 'Réparation porte de garage sous-sol',
      description: 'Remplacement du vérin hydraulique et nouvelles télécommandes programmées.',
      amount: 250,
      due_date: '2026-11-15',
      created_by: 'demo-user-syndic',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ]

  const defaultPayments = [
    {
      id: 'pay-1',
      charge_id: 'chg-1',
      resident_id: 'demo-user-resident',
      paid_by: 'demo-user-resident',
      residence_id: 'res-andalous-1',
      amount: 500,
      status: 'paid',
      paid_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      note: 'Virement bancaire BMCE réf #VIR-2026-8819',
      receipt_sent: true,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'pay-2',
      charge_id: 'chg-2',
      resident_id: 'demo-user-resident',
      paid_by: 'demo-user-resident',
      residence_id: 'res-andalous-1',
      amount: 250,
      status: 'pending',
      paid_at: null,
      note: null,
      receipt_sent: false,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ]

  const defaultAnnouncements = [
    {
      id: 'ann-1',
      residence_id: 'res-andalous-1',
      title: 'Assemblée Générale Ordinaire 2026',
      content: 'Chers copropriétaires, nous vous convions à l’Assemblée Générale Ordinaire le samedi 24 octobre à 18h30 dans le hall d’entrée. Ordre du jour: bilan financier et renouvellement du contrat d’ascenseur.',
      created_by: 'demo-user-syndic',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'ann-2',
      residence_id: 'res-andalous-1',
      title: 'Nettoyage des cuves et surpresseurs d’eau',
      content: 'Une interruption temporaire de l’approvisionnement en eau aura lieu le mardi matin entre 09h00 et 12h00 pour la désinfection réglementaire des réservoirs.',
      created_by: 'demo-user-syndic',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ]

  const defaultDocuments = [
    {
      id: 'doc-1',
      residence_id: 'res-andalous-1',
      name: 'Règlement_de_Copropriété_Al_Andalous.pdf',
      category: 'reglement',
      file_path: 'documents/reglement.pdf',
      uploaded_by: 'demo-user-syndic',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
      id: 'doc-2',
      residence_id: 'res-andalous-1',
      name: 'Procès_Verbal_AG_2025.pdf',
      category: 'pv',
      file_path: 'documents/pv_ag_2025.pdf',
      uploaded_by: 'demo-user-syndic',
      created_at: new Date(Date.now() - 120 * 86400000).toISOString()
    }
  ]

  const defaultVirements = [
    {
      id: 'vir-1',
      residence_id: 'res-andalous-1',
      resident_id: 'demo-user-societe',
      amount: 1800,
      reference: 'FAC-2026-09-ATLAS',
      note: 'Facture nettoyage mensuel Septembre 2026',
      proof_path: 'factures/facture-09.pdf',
      kind: 'facture',
      doc_status: 'approuve',
      payment_proof_path: null,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'vir-2',
      residence_id: 'res-andalous-1',
      resident_id: 'demo-user-resident',
      amount: 500,
      reference: 'VIR-OCT-B14',
      note: 'Cotisation Octobre 2026 — Appt B14',
      proof_path: 'preuves/vir_b14.pdf',
      kind: 'virement',
      doc_status: 'en_attente',
      payment_proof_path: null,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ]

  const defaultImmeubles = [
    { id: 'imm-1', residence_id: 'res-andalous-1', name: 'Immeuble A (Entrée principale)' },
    { id: 'imm-2', residence_id: 'res-andalous-1', name: 'Immeuble B (Entrée jardin)' }
  ]

  const defaultInvitations = [
    {
      id: 'inv-1',
      email: 'f.mansouri@syndic.ma',
      role: 'syndic',
      residence_id: 'res-andalous-1',
      created_at: new Date().toISOString()
    }
  ]

  const defaultParkingSpots = [
    {
      id: 'pk-1',
      residence_id: 'res-andalous-1',
      spot_number: '12',
      level: 'Sous-sol -1',
      resident_name: 'Karim El Amrani',
      apartment_number: 'B-14',
      matricule: '12345-أ-6',
      vehicle_model: 'Dacia Duster Gris foncé',
      phone: '0662233445',
      badge_number: 'BDG-084',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 'pk-2',
      residence_id: 'res-andalous-1',
      spot_number: '05',
      level: 'Sous-sol -1',
      resident_name: 'Omar Tazi',
      apartment_number: 'A-05',
      matricule: '45678-ب-1',
      vehicle_model: 'Renault Clio 5 Noire',
      phone: '0661998877',
      badge_number: 'BDG-031',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'pk-3',
      residence_id: 'res-andalous-1',
      spot_number: '18',
      level: 'Sous-sol -2',
      resident_name: 'Fatima Zahra Mansouri',
      apartment_number: 'B-02',
      matricule: '98765-د-6',
      vehicle_model: 'Volkswagen Golf 8 Blanche',
      phone: '0663445566',
      badge_number: 'BDG-112',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString()
    },
    {
      id: 'pk-4',
      residence_id: 'res-andalous-1',
      spot_number: '21',
      level: 'Sous-sol -2',
      resident_name: 'Place Visiteur / Syndic',
      apartment_number: 'Commune',
      matricule: 'RÉSERVÉ',
      vehicle_model: 'Emplacement de passage',
      phone: '0661122334',
      badge_number: 'BDG-SYN',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    }
  ]

  const defaultParkingIncidents = [
    {
      id: 'inc-1',
      residence_id: 'res-andalous-1',
      spot_number: '12',
      matricule_gênant: '74123-أ-26',
      vehicle_desc: 'Hyundai Tucson Bleue',
      reported_by: 'Karim El Amrani',
      date: '2026-09-28',
      status: 'resolu',
      motif: 'Stationnement sur place privée sans autorisation',
      action_taken: 'Propriétaire contacté par téléphone et véhicule déplacé en 15 min.'
    }
  ]

  const defaultCompteurs = [
    {
      id: 'cpt-1',
      residence_id: 'res-andalous-1',
      type: 'eau',
      label: 'Compteur Eau — Jardin & Entretien Hall',
      compteur_num: 'RAD-CAS-488219',
      previous_index: 1240,
      current_index: 1262,
      consumption: 22,
      unit: 'm³',
      period: 'Septembre 2026',
      read_date: '2026-09-30',
      estimated_cost: 264,
      is_leak_alert: false,
      note: 'Consommation normale conforme à la moyenne'
    },
    {
      id: 'cpt-2',
      residence_id: 'res-andalous-1',
      type: 'electricite',
      label: 'Compteur Électricité — Ascenseur & Éclairage des Cages',
      compteur_num: 'LYD-ELEC-90312',
      previous_index: 8520,
      current_index: 9140,
      consumption: 620,
      unit: 'kWh',
      period: 'Septembre 2026',
      read_date: '2026-09-30',
      estimated_cost: 744,
      is_leak_alert: false,
      note: 'Consommation standard des deux ascenseurs'
    },
    {
      id: 'cpt-3',
      residence_id: 'res-andalous-1',
      type: 'eau',
      label: 'Compteur Eau — Bâche à eau & Surpresseur',
      compteur_num: 'RAD-CAS-488220',
      previous_index: 820,
      current_index: 980,
      consumption: 160,
      unit: 'm³',
      period: 'Août 2026',
      read_date: '2026-08-31',
      estimated_cost: 1920,
      is_leak_alert: true,
      note: '⚠️ Alerte anomalie: fuite détectée au flotteur de cuve sous-sol (réparée)'
    }
  ]

  const defaultMisesEnDemeure = [
    {
      id: 'med-1',
      residence_id: 'res-andalous-1',
      resident_name: 'Omar Tazi',
      apartment_number: 'A-05',
      phone: '0661998877',
      total_due: 1250,
      overdue_months: 'Juin, Juillet, Août, Septembre, Octobre 2026',
      reference_code: 'MED-2026-004',
      sent_date: '2026-09-15',
      legal_deadline_days: 30,
      status: 'envoyee',
      delivery_method: 'Lettre recommandée avec AR & Notification remise en main propre'
    }
  ]

  const defaultReservations = [
    {
      id: 'res-1',
      residence_id: 'res-andalous-1',
      facility_name: 'Terrasse Commune (Stah)',
      facility_icon: '🌇',
      resident_name: 'Karim El Amrani',
      apartment_number: 'B-14',
      phone: '0662233445',
      date: '2026-10-10',
      time_slot: '14:00 - 18:00',
      purpose: 'Installation parabole & nettoyage panneaux solaires',
      status: 'approuve',
      notes: 'Clé à récupérer chez le concierge à 13h45',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'res-2',
      residence_id: 'res-andalous-1',
      facility_name: 'Salle polyvalente / Réunions',
      facility_icon: '🏛️',
      resident_name: 'Nadia Berrada',
      apartment_number: 'B-08',
      phone: '0665554433',
      date: '2026-10-18',
      time_slot: '16:00 - 20:00',
      purpose: 'Goûter d’anniversaire familial (20 personnes max)',
      status: 'en_attente',
      notes: 'Engagement à respecter le calme et rendre la salle propre',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ]

  if (!localStorage.getItem('syndic_maroc_residences')) setStorage('residences', defaultResidences)
  if (!localStorage.getItem('syndic_maroc_profiles')) setStorage('profiles', defaultProfiles)
  if (!localStorage.getItem('syndic_maroc_charges')) setStorage('charges', defaultCharges)
  if (!localStorage.getItem('syndic_maroc_payments')) {
    setStorage('payments', defaultPayments)
  } else {
    // Ensure pay-2 is pending by default so syndic can demonstrate unpaid charges & WhatsApp reminders
    try {
      const curPayments = getStorage('payments', [])
      let changed = false
      curPayments.forEach(p => {
        if (p.id === 'pay-2' && p.status === 'paid' && p.note === 'Virement bancaire 250 DH — Reçu validé') {
          p.status = 'pending'
          p.paid_at = null
          p.note = null
          p.receipt_sent = false
          changed = true
        }
      })
      if (changed) setStorage('payments', curPayments)
    } catch {}
  }
  if (!localStorage.getItem('syndic_maroc_announcements')) setStorage('announcements', defaultAnnouncements)
  if (!localStorage.getItem('syndic_maroc_documents')) setStorage('documents', defaultDocuments)
  if (!localStorage.getItem('syndic_maroc_virements')) setStorage('virements', defaultVirements)
  if (!localStorage.getItem('syndic_maroc_immeubles')) setStorage('immeubles', defaultImmeubles)
  if (!localStorage.getItem('syndic_maroc_invitations')) setStorage('invitations', defaultInvitations)
  if (!localStorage.getItem('syndic_maroc_parking_spots')) setStorage('parking_spots', defaultParkingSpots)
  if (!localStorage.getItem('syndic_maroc_parking_incidents')) setStorage('parking_incidents', defaultParkingIncidents)
  if (!localStorage.getItem('syndic_maroc_compteurs')) setStorage('compteurs', defaultCompteurs)
  if (!localStorage.getItem('syndic_maroc_mises_en_demeure')) setStorage('mises_en_demeure', defaultMisesEnDemeure)
  if (!localStorage.getItem('syndic_maroc_reservations')) setStorage('reservations', defaultReservations)
}

function createMockSupabaseClient() {
  initDefaultDatabase()

  const authListeners = new Set()

  function getActiveSession() {
    return getStorage('session', null)
  }

  function setActiveSession(sess) {
    setStorage('session', sess)
    authListeners.forEach(cb => {
      try {
        cb(sess ? 'SIGNED_IN' : 'SIGNED_OUT', sess)
      } catch (e) {
        console.error(e)
      }
    })
  }

  const auth = {
    async getSession() {
      const session = getActiveSession()
      return { data: { session }, error: null }
    },

    onAuthStateChange(callback) {
      authListeners.add(callback)
      const session = getActiveSession()
      setTimeout(() => {
        callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session)
      }, 0)
      return {
        data: {
          subscription: {
            unsubscribe: () => authListeners.delete(callback)
          }
        }
      }
    },

    async signInWithPassword({ email, password }) {
      const profiles = getStorage('profiles', [])
      const cleanEmail = (email || '').trim().toLowerCase()
      let userProfile = profiles.find(p => p.email && p.email.toLowerCase() === cleanEmail)

      if (!userProfile) {
        // Allow quick login by role or create demo profile
        let role = 'resident'
        if (cleanEmail.includes('syndic')) role = 'syndic'
        else if (cleanEmail.includes('societe')) role = 'societe'
        else if (cleanEmail.includes('admin') || cleanEmail === 'badr.tabti@gmail.com') role = 'admin'

        userProfile = {
          id: `usr_${Date.now()}`,
          full_name: email.split('@')[0],
          email: cleanEmail,
          role,
          phone: '0600000000',
          residence_id: role === 'admin' ? null : 'res-andalous-1',
          apartment_number: role === 'resident' ? 'Apt 1' : null,
          created_at: new Date().toISOString()
        }
        profiles.push(userProfile)
        setStorage('profiles', profiles)
      }

      const session = {
        access_token: 'mock-jwt-token-' + userProfile.id,
        user: {
          id: userProfile.id,
          email: userProfile.email,
          user_metadata: { full_name: userProfile.full_name }
        }
      }

      setActiveSession(session)
      return { data: { session, user: session.user }, error: null }
    },

    async signUp({ email, password }) {
      const id = `usr_${Date.now()}`
      const cleanEmail = (email || '').trim().toLowerCase()
      const session = {
        access_token: 'mock-jwt-token-' + id,
        user: { id, email: cleanEmail }
      }
      setActiveSession(session)
      return { data: { user: session.user, session }, error: null }
    },

    async signOut() {
      setActiveSession(null)
      return { error: null }
    },

    async updateUser(updates) {
      const session = getActiveSession()
      return { data: { user: session?.user }, error: null }
    }
  }

  function from(tableName) {
    let operation = 'select'
    let insertData = null
    let updateData = null
    let filters = []
    let sortCol = null
    let sortAsc = true
    let isSingle = false

    const query = {
      select(cols) {
        return query
      },
      insert(data) {
        operation = 'insert'
        insertData = data
        return query
      },
      update(data) {
        operation = 'update'
        updateData = data
        return query
      },
      delete() {
        operation = 'delete'
        return query
      },
      eq(col, val) {
        filters.push(item => String(item[col]) === String(val))
        return query
      },
      neq(col, val) {
        filters.push(item => String(item[col]) !== String(val))
        return query
      },
      in(col, vals) {
        const arr = (vals || []).map(String)
        filters.push(item => arr.includes(String(item[col])))
        return query
      },
      order(col, opts = {}) {
        sortCol = col
        sortAsc = opts.ascending !== false
        return query
      },
      single() {
        isSingle = true
        return query
      },
      limit(n) {
        return query
      },

      then(resolve, reject) {
        try {
          const list = getStorage(tableName, [])
          let resultData = null

          if (operation === 'insert') {
            const items = Array.isArray(insertData) ? insertData : [insertData]
            const inserted = items.map((it, idx) => ({
              id: it.id || `${tableName.slice(0, 3)}_${Date.now()}_${idx}`,
              created_at: it.created_at || new Date().toISOString(),
              ...it
            }))
            const updatedList = [...list, ...inserted]
            setStorage(tableName, updatedList)
            resultData = Array.isArray(insertData) ? inserted : (isSingle ? inserted[0] : inserted)
          } else if (operation === 'update') {
            const updatedList = list.map(item => {
              const match = filters.every(f => f(item))
              return match ? { ...item, ...updateData } : item
            })
            setStorage(tableName, updatedList)
            resultData = updateData
          } else if (operation === 'delete') {
            const remaining = list.filter(item => !filters.every(f => f(item)))
            setStorage(tableName, remaining)
            resultData = []
          } else {
            // SELECT
            let filtered = list.filter(item => filters.every(f => f(item)))

            if (sortCol) {
              filtered.sort((a, b) => {
                const va = a[sortCol] ?? ''
                const vb = b[sortCol] ?? ''
                return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
              })
            }

            // Hydrate joins
            const residences = getStorage('residences', [])
            const profiles = getStorage('profiles', [])
            const charges = getStorage('charges', [])
            const payments = getStorage('payments', [])

            filtered = filtered.map(item => {
              const enriched = { ...item }
              if (item.residence_id) {
                enriched.residences = residences.find(r => r.id === item.residence_id) || null
              }
              if (item.charge_id) {
                enriched.charges = charges.find(c => c.id === item.charge_id) || null
              }
              if (item.paid_by || item.resident_id) {
                const uid = item.paid_by || item.resident_id
                enriched.profiles = profiles.find(p => p.id === uid) || null
              }
              if (tableName === 'charges') {
                enriched.payments = payments
                  .filter(p => p.charge_id === item.id)
                  .map(p => ({
                    ...p,
                    paid_by: p.paid_by || p.resident_id,
                    profiles: profiles.find(pr => pr.id === (p.paid_by || p.resident_id)) || null
                  }))
              }
              return enriched
            })

            resultData = isSingle ? (filtered[0] || null) : filtered
          }

          resolve({ data: resultData, error: null, count: Array.isArray(resultData) ? resultData.length : 1 })
        } catch (err) {
          resolve({ data: null, error: err })
        }
      }
    }

    return query
  }

  const storage = {
    from(bucketName) {
      return {
        async upload(path, file) {
          return { data: { path }, error: null }
        },
        async createSignedUrl(path, expiry) {
          return {
            data: {
              signedUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80'
            },
            error: null
          }
        },
        getPublicUrl(path) {
          return {
            data: {
              publicUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80'
            }
          }
        },
        async remove(paths) {
          return { data: [], error: null }
        }
      }
    }
  }

  return {
    isMock: true,
    auth,
    from,
    storage
  }
}

const userPref = typeof window !== 'undefined' ? localStorage.getItem('syndic_maroc_database_mode') : null
// If user preferred local or if cloud is not configured, use local
export const activeMode = userPref || (isConfigured ? 'cloud' : 'local')
export const isDemoMode = activeMode === 'local' || !isConfigured

export function switchDatabaseMode(mode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('syndic_maroc_database_mode', mode)
    window.location.href = '/'
  }
}

const mockClient = createMockSupabaseClient()

let cloudClient = null
if (isConfigured && envUrl && envKey) {
  try {
    cloudClient = createClient(envUrl, envKey)
  } catch (err) {
    console.warn('Failed to initialize Supabase cloud client:', err)
    cloudClient = null
  }
}

export const supabase = (activeMode === 'cloud' && cloudClient)
  ? cloudClient
  : mockClient

