import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const MOROCCAN_BANKS = [
  { code: '007', name: 'Attijariwafa bank', logo: '🦁' },
  { code: '101', name: 'Banque Populaire (BCP)', logo: '🐎' },
  { code: '230', name: 'CIH Bank', logo: '💳' },
  { code: '011', name: 'Bank of Africa (BMCE)', logo: '🌍' },
  { code: '022', name: 'Société Générale Maroc', logo: '🔴' },
  { code: '021', name: 'Crédit du Maroc', logo: '🟢' },
  { code: '225', name: 'Crédit Agricole du Maroc', logo: '🌾' },
  { code: '050', name: 'CFG Bank', logo: '🏛️' },
  { code: '350', name: 'Al Barid Bank', logo: '✉️' }
]

export default function ParametresBanqueModal({ residence, onSave, onClose }) {
  const [beneficiaire, setBeneficiaire] = useState(
    residence?.beneficiaire || `Syndicat des Copropriétaires ${residence?.name || 'Résidence'}`
  )
  const [rib, setRib] = useState(residence?.rib || '007780000123456789012345')
  const [selectedBank, setSelectedBank] = useState(() => {
    const raw = (residence?.rib || '').replace(/[^0-9]/g, '')
    const prefix = raw.slice(0, 3)
    const match = MOROCCAN_BANKS.find(b => b.code === prefix)
    return match ? match.name : 'Attijariwafa bank'
  })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Auto-detect bank from first 3 digits
  function handleRibChange(val) {
    const digits = val.replace(/[^0-9]/g, '')
    setRib(digits.slice(0, 24))
    if (digits.length >= 3) {
      const code = digits.slice(0, 3)
      const found = MOROCCAN_BANKS.find(b => b.code === code)
      if (found) setSelectedBank(found.name)
    }
  }

  function handleSelectBank(bankName) {
    setSelectedBank(bankName)
    const bank = MOROCCAN_BANKS.find(b => b.name === bankName)
    if (bank) {
      const currentDigits = rib.replace(/[^0-9]/g, '')
      const rest = currentDigits.slice(3)
      setRib(bank.code + rest)
    }
  }

  // Format 24-digit RIB: 007 780 0001234567890123 45
  function formatRib(raw) {
    const clean = (raw || '').replace(/[^0-9]/g, '')
    if (clean.length <= 3) return clean
    if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`
    if (clean.length <= 22) return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 22)} ${clean.slice(22, 24)}`
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const cleanRib = rib.replace(/[^0-9]/g, '')
      const { error } = await supabase
        .from('residences')
        .update({
          beneficiaire: beneficiaire.trim(),
          rib: cleanRib
        })
        .eq('id', residence.id)

      if (error) throw error

      if (onSave) onSave({ ...residence, beneficiaire, rib: cleanRib })
      onClose()
    } catch (err) {
      alert(err.message || 'Erreur lors de l’enregistrement')
    } finally {
      setSaving(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(rib.replace(/[^0-9]/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Free high-contrast QR code for instant Moroccan mobile banking scanning
  const qrData = `RIB:${rib.replace(/[^0-9]/g, '')};BENEF:${encodeURIComponent(beneficiaire)}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div className="card" style={{
        background: '#ffffff',
        maxWidth: '540px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '14px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>
              🏦 Coordonnées Bancaires & RIB Officiel
            </h3>
            <p className="muted small" style={{ margin: '2px 0 0 0' }}>
              Informations affichées aux copropriétaires pour le règlement de leurs cotisations
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Moroccan Bank Selector */}
          <div>
            <label className="small" style={{ fontWeight: 700 }}>Banque de la copropriété</label>
            <select
              value={selectedBank}
              onChange={e => handleSelectBank(e.target.value)}
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
            >
              {MOROCCAN_BANKS.map(b => (
                <option key={b.code} value={b.name}>
                  {b.logo} {b.name} (Code: {b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Beneficiary */}
          <div>
            <label className="small" style={{ fontWeight: 700 }}>Nom du Bénéficiaire (Intitulé du compte) *</label>
            <input
              type="text"
              required
              placeholder="Ex: Syndicat des Copropriétaires Résidence Al Andalous"
              value={beneficiaire}
              onChange={e => setBeneficiaire(e.target.value)}
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
            />
          </div>

          {/* 24-digit Moroccan RIB */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="small" style={{ fontWeight: 700 }}>
                Relevé d'Identité Bancaire (RIB - 24 chiffres) *
              </label>
              <span className="small muted" style={{ fontSize: '0.75rem' }}>
                {rib.replace(/[^0-9]/g, '').length} / 24 chiffres
              </span>
            </div>
            <input
              type="text"
              required
              placeholder="007 780 0001234567890123 45"
              value={formatRib(rib)}
              onChange={e => handleRibChange(e.target.value)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '1px'
              }}
            />
          </div>

          {/* Interactive Moroccan Bank Card Preview */}
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '18px',
            boxShadow: '0 4px 10px rgba(6,78,59,0.3)',
            marginTop: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                {selectedBank}
              </span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                RIB MAROC
              </span>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '0.72rem', opacity: 0.8, display: 'block' }}>BÉNÉFICIAIRE</span>
              <strong style={{ fontSize: '0.95rem' }}>{beneficiaire || 'Nom du syndicat'}</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', opacity: 0.8, display: 'block' }}>RIB DU COMPTE</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, letterSpacing: '1px' }}>
                  {formatRib(rib)}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    background: '#ffffff',
                    color: '#064e3b',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {copied ? '✓ Copié' : 'Copier'}
                </button>
              </div>
            </div>
          </div>

          {/* QR Code section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '12px'
          }}>
            <img
              src={qrUrl}
              alt="QR Code RIB"
              style={{ width: '80px', height: '80px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>
                📱 QR Code Virement Mobile
              </strong>
              <p className="muted small" style={{ margin: '2px 0 0 0', fontSize: '0.78rem' }}>
                Scannable depuis les applications bancaires pour pré-remplir les données de virement.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ background: '#047857', borderColor: '#047857' }}
            >
              {saving ? 'Enregistrement...' : '💾 Sauvegarder les coordonnées'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
