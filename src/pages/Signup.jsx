import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const ROLES = [
  { value: 'resident', label: 'Résident', desc: "J'habite dans une résidence gérée par un syndic" },
  { value: 'syndic', label: 'Responsable syndic', desc: 'Je gère une ou plusieurs résidences' },
  { value: 'societe', label: 'Société externe', desc: 'Je gère la résidence pour le compte du syndic' }
]

export default function Signup() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  // resident / societe: rejoindre via code
  const [inviteCode, setInviteCode] = useState('')
  const [apartmentNumber, setApartmentNumber] = useState('')
  // syndic: creer une residence
  const [residenceName, setResidenceName] = useState('')
  const [residenceAddress, setResidenceAddress] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Creer l'utilisateur dans auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      })
      if (signUpError) throw signUpError
      const userId = signUpData.user?.id
      if (!userId) throw new Error('Ma tsawbch l\'compte, 3awd jarreb.')

      let residenceId = null

      if (role === 'syndic') {
        // 2a. Syndic: creer une nouvelle residence, howa li houwa l'proprietaire
        const { data: residence, error: resError } = await supabase
          .from('residences')
          .insert({ name: residenceName, address: residenceAddress, syndic_id: userId })
          .select()
          .single()
        if (resError) throw resError
        residenceId = residence.id
      } else {
        // 2b. Resident / societe: khass ykono 3ndhom invite code sahih
        const { data: residence, error: findError } = await supabase
          .from('residences')
          .select('id')
          .eq('invite_code', inviteCode.trim())
          .single()
        if (findError || !residence) throw new Error("Code d'invitation ghalat. Sowlo l'responsable syndic dyalk 3la code sahih.")
        residenceId = residence.id
      }

      // 3. Creer l'profil
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: fullName,
        role,
        phone,
        residence_id: residenceId,
        apartment_number: role === 'resident' ? apartmentNumber : null
      })
      if (profileError) throw profileError

      navigate('/')
    } catch (err) {
      setError(err.message || 'Chi mochkil wa9e3. 3awd jarreb.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="brand">
          <div className="brand-mark">SM</div>
          <span>Syndic Maroc</span>
        </div>
        <h1>Créer un compte</h1>

        {step === 1 && (
          <>
            <p className="muted">Chno houwa dawrk f'la résidence ?</p>
            <div className="role-grid">
              {ROLES.map(r => (
                <button
                  type="button"
                  key={r.value}
                  className={'role-card' + (role === r.value ? ' selected' : '')}
                  onClick={() => setRole(r.value)}
                >
                  <strong>{r.label}</strong>
                  <span>{r.desc}</span>
                </button>
              ))}
            </div>
            <button className="btn-primary" disabled={!role} onClick={() => setStep(2)}>
              Suivant
            </button>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <label>
              Nom complet
              <input required value={fullName} onChange={e => setFullName(e.target.value)} />
            </label>
            <label>
              Email
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label>
              Mot de passe
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
            </label>
            <label>
              Téléphone
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 XX XX XX XX" />
            </label>

            {role === 'syndic' && (
              <>
                <hr />
                <p className="muted small">Ma3lomat dyal la résidence li ghadi tsayr</p>
                <label>
                  Nom de la résidence
                  <input required value={residenceName} onChange={e => setResidenceName(e.target.value)} placeholder="Résidence Al Yasmine" />
                </label>
                <label>
                  Adresse
                  <input value={residenceAddress} onChange={e => setResidenceAddress(e.target.value)} />
                </label>
              </>
            )}

            {(role === 'resident' || role === 'societe') && (
              <>
                <hr />
                <label>
                  Code d'invitation de la résidence
                  <input required value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Demandez-le au syndic" />
                </label>
                {role === 'resident' && (
                  <label>
                    Numéro d'appartement
                    <input value={apartmentNumber} onChange={e => setApartmentNumber(e.target.value)} placeholder="Ex: Apt 12" />
                  </label>
                )}
              </>
            )}

            {error && <div className="error-box">{error}</div>}

            <div className="row-buttons">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Retour</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Chi lhda9a...' : 'Créer le compte'}
              </button>
            </div>
          </form>
        )}

        <p className="muted small">
          3ndk compte deja ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
