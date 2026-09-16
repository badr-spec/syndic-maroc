import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'

export default function Signup() {
  const { t } = useLanguage()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [apartmentNumber, setApartmentNumber] = useState('')
  const [residenceName, setResidenceName] = useState('')
  const [residenceAddress, setResidenceAddress] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const ROLES = [
    { value: 'resident', ...t('signup.roles.resident') },
    { value: 'syndic', ...t('signup.roles.syndic') },
    { value: 'societe', ...t('signup.roles.societe') }
  ]

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError
      const userId = signUpData.user?.id
      if (!userId) throw new Error(t('signup.errorAccount'))

      let residenceId = null

      if (role === 'syndic') {
        const { data: residence, error: resError } = await supabase
          .from('residences')
          .insert({ name: residenceName, address: residenceAddress, syndic_id: userId })
          .select()
          .single()
        if (resError) throw resError
        residenceId = residence.id
      } else {
        const { data: residence, error: findError } = await supabase
          .from('residences')
          .select('id')
          .eq('invite_code', inviteCode.trim())
          .single()
        if (findError || !residence) throw new Error(t('signup.errorCode'))
        residenceId = residence.id
      }

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
      setError(err.message || t('signup.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="brand">
          <div className="brand-mark">SM</div>
          <span>{t('brand')}</span>
        </div>
        <h1>{t('signup.title')}</h1>

        {step === 1 && (
          <>
            <p className="muted">{t('signup.roleQuestion')}</p>
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
              {t('signup.next')}
            </button>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <label>
              {t('signup.fullName')}
              <input required value={fullName} onChange={e => setFullName(e.target.value)} />
            </label>
            <label>
              {t('signup.email')}
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label>
              {t('signup.password')}
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
            </label>
            <label>
              {t('signup.phone')}
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('signup.phonePlaceholder')} />
            </label>

            {role === 'syndic' && (
              <>
                <hr />
                <p className="muted small">{t('signup.residenceInfo')}</p>
                <label>
                  {t('signup.residenceName')}
                  <input required value={residenceName} onChange={e => setResidenceName(e.target.value)} placeholder={t('signup.residenceNamePlaceholder')} />
                </label>
                <label>
                  {t('signup.address')}
                  <input value={residenceAddress} onChange={e => setResidenceAddress(e.target.value)} />
                </label>
              </>
            )}

            {(role === 'resident' || role === 'societe') && (
              <>
                <hr />
                <label>
                  {t('signup.inviteCode')}
                  <input required value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder={t('signup.inviteCodePlaceholder')} />
                </label>
                {role === 'resident' && (
                  <label>
                    {t('signup.apartmentNumber')}
                    <input value={apartmentNumber} onChange={e => setApartmentNumber(e.target.value)} placeholder={t('signup.apartmentPlaceholder')} />
                  </label>
                )}
              </>
            )}

            {error && <div className="error-box">{error}</div>}

            <div className="row-buttons">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>{t('signup.back')}</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? t('signup.loading') : t('signup.submit')}
              </button>
            </div>
          </form>
        )}

        <p className="muted small">
          {t('signup.alreadyAccount')} <Link to="/login">{t('signup.loginLink')}</Link>
        </p>
      </div>
    </div>
  )
}
