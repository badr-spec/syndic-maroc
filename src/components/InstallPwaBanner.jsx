import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function InstallPwaBanner() {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [selectedDeviceTab, setSelectedDeviceTab] = useState('phone') // 'phone' | 'pc'
  const [copiedLink, setCopiedLink] = useState(false)

  // Device detection
  const [deviceInfo, setDeviceInfo] = useState({
    isIos: false,
    isAndroid: false,
    isPc: false,
    isInApp: false
  })

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (standalone) {
      setIsStandalone(true)
    }

    // 2. Detect device
    const ua = (window.navigator.userAgent || '').toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(ua)
    const androidDevice = /android/.test(ua)
    const pcDevice = !iosDevice && !androidDevice && !/mobile|tablet/i.test(ua)
    const inApp = /fban|fbav|instagram|whatsapp|line|micromessenger|snapchat|threads/i.test(ua)

    setDeviceInfo({
      isIos: iosDevice,
      isAndroid: androidDevice,
      isPc: pcDevice,
      isInApp: inApp
    })

    if (pcDevice) setSelectedDeviceTab('pc')
    else setSelectedDeviceTab('phone')

    // 3. Listen for Chromium beforeinstallprompt
    function handleBeforeInstallPrompt(e) {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 4. Global modal opener for buttons in header / login
    window.__openInstallModal = () => {
      handleInstallClick()
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      delete window.__openInstallModal
    }
  }, [])

  async function handleInstallClick() {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          setShowGuideModal(false)
        }
        setDeferredPrompt(null)
        return
      } catch (e) {
        console.error(e)
      }
    }

    setShowGuideModal(true)
  }

  function handleCopyCurrentUrl() {
    try {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    } catch (e) {}
  }

  // Only render modal when triggered by the user
  if (!showGuideModal) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3500,
      padding: '16px',
      backdropFilter: 'blur(3px)'
    }}>
      <div className="card" style={{
        background: '#ffffff',
        maxWidth: '520px',
        width: '100%',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
        maxHeight: '92vh',
        overflowY: 'auto'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/logo.svg"
              alt="Syndic Maroc"
              style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'contain' }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                {isAr ? 'تثبيت تطبيق سنديك المغرب' : 'Installer Syndic Maroc'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {isAr ? 'تطبيق سريع يشتغل بدون تحميل من المتجر' : 'Accès direct 1-clic depuis votre écran d’accueil'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuideModal(false)}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        {/* Big Direct Action Button (Always visible) */}
        <button
          type="button"
          onClick={() => {
            if (deferredPrompt) {
              deferredPrompt.prompt()
              setShowGuideModal(false)
            } else {
              // Highlight the steps below
              setSelectedDeviceTab('phone')
            }
          }}
          style={{
            width: '100%',
            background: '#047857',
            color: '#ffffff',
            border: 'none',
            padding: '13px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.96rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)'
          }}
        >
          <span>📲</span>
          <span>
            {deferredPrompt
              ? (isAr ? 'تثبيت التطبيق على هذا الهاتف فوراً (نقرة واحدة)' : 'Installer sur ce téléphone immédiatement (1 clic)')
              : (isAr ? 'طريقة تثبيت التطبيق والشعار على الهاتف' : 'Guide d’installation sur votre téléphone')}
          </span>
        </button>

        {/* If opened inside WhatsApp / Instagram browser */}
        {deviceInfo.isInApp && (
          <div style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '0.84rem',
            color: '#92400e'
          }}>
            <strong>⚠️ {isAr ? 'أنت تتصفح من داخل الواتساب' : 'Lien ouvert dans WhatsApp'}</strong>
            <p style={{ margin: '4px 0 8px 0', lineHeight: 1.4 }}>
              {isAr
                ? 'متصفح الواتساب يمنع التثبيت المباشر. اضغط على النقاط الثلاث (⋮) في الأعلى ثم اختر «فتح في المتصفح Chrome أو Safari».'
                : 'Le navigateur WhatsApp bloque l’installation directe. Cliquez sur les 3 points (⋮) en haut puis choisissez « Ouvrir dans Chrome ou Safari ».'}
            </p>
            <button
              type="button"
              onClick={handleCopyCurrentUrl}
              style={{
                background: '#ffffff',
                border: '1px solid #d97706',
                color: '#92400e',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {copiedLink ? '✓ ' + (isAr ? 'تم نسخ الرابط' : 'Lien copié !') : '📋 ' + (isAr ? 'نسخ رابط التطبيق لفتحه في Chrome' : 'Copier le lien pour Chrome / Safari')}
            </button>
          </div>
        )}

        {/* Device Switcher */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setSelectedDeviceTab('phone')}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: selectedDeviceTab === 'phone' ? '#ffffff' : 'transparent',
              color: selectedDeviceTab === 'phone' ? '#047857' : '#64748b',
              boxShadow: selectedDeviceTab === 'phone' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📱 {isAr ? 'الهاتف (أندرويد و آيفون)' : 'Sur Smartphone (Android / iPhone)'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedDeviceTab('pc')}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: selectedDeviceTab === 'pc' ? '#ffffff' : 'transparent',
              color: selectedDeviceTab === 'pc' ? '#047857' : '#64748b',
              boxShadow: selectedDeviceTab === 'pc' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            💻 PC / Mac
          </button>
        </div>

        {/* Phone Guide (Android & iPhone) */}
        {selectedDeviceTab === 'phone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Android */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🤖</span>
                <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>
                  {isAr ? 'التثبيت على هواتف أندرويد (Google Chrome) :' : 'Sur Android (Google Chrome) :'}
                </strong>
              </div>

              {/* Special Note for WhatsApp */}
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '0.78rem',
                color: '#92400e',
                marginBottom: '10px',
                lineHeight: 1.4
              }}>
                <strong>📌 {isAr ? 'إذا فتحت الرابط من الواتساب :' : 'Si vous êtes dans WhatsApp :'}</strong>{' '}
                {isAr
                  ? 'اضغط أولاً على النقاط الثلاث (⋮) ثم «فتح في المتصفح» (Chrome). متصفح الواتساب الداخلي لا يثبت التطبيقات.'
                  : 'Appuyez d’abord sur les 3 points (⋮) puis sur « Ouvrir dans Chrome ». Le navigateur interne de WhatsApp ne permet pas d’installer d’icônes.'}
              </div>

              <ol style={{ margin: 0, paddingInlineStart: '20px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                <li>{isAr ? 'في Google Chrome، اضغط على النقاط الثلاث (⋮) في أعلى يمين الشاشة.' : 'Dans Google Chrome, appuyez sur les 3 points (⋮) en haut à droite.'}</li>
                <li>
                  {isAr ? (
                    <>ستجد خيار <strong>« 📲 تثبيت التطبيق »</strong> (أو « إضافة إلى الشاشة الرئيسية ») يحمل شعار سنديك المغرب.</>
                  ) : (
                    <>Choisissez l’option <strong>« 📲 Installer l’application »</strong> (ou « Ajouter à l’écran d’accueil ») avec le logo Syndic Maroc.</>
                  )}
                </li>
                <li>{isAr ? 'اضغط « تثبيت ». سيظهر تطبيق سنديك المغرب فوراً على شاشة هاتفك الرئيسية.' : 'Appuyez sur « Installer ». L’application Syndic Maroc apparaîtra sur votre écran d’accueil avec son logo.'}</li>
              </ol>
            </div>

            {/* iPhone */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.1rem' }}>🍎</span>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                  {isAr ? 'طريقة التثبيت على هواتف آيفون (Apple Safari) :' : 'Sur iPhone (Safari) :'}
                </strong>
              </div>
              <ol style={{ margin: 0, paddingInlineStart: '20px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                <li>{isAr ? 'في متصفح Safari، اضغط على زر المشاركة ⎋ (المربع بسهم في أسفل الشاشة).' : 'Dans Safari, appuyez sur le bouton Partager ⎋ (carré avec flèche en bas).'}</li>
                <li>{isAr ? 'مرر للأسفل واضغط على «إضافة إلى الشاشة الرئيسية» (Sur l’écran d’accueil ➕).' : 'Faites défiler et touchez « Sur l’écran d’accueil » (➕).'}</li>
                <li>{isAr ? 'اضغط على «إضافة» (Ajouter) في أعلى اليمين.' : 'Appuyez sur « Ajouter » en haut à droite.'}</li>
              </ol>
            </div>
          </div>
        )}

        {/* PC Guide */}
        {selectedDeviceTab === 'pc' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                {isAr ? 'عبر شريط العنوان في Chrome أو Edge :' : 'Via la barre d’adresse de Chrome ou Edge :'}
              </strong>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                {isAr
                  ? 'انقر على أيقونة التثبيت ⊕ الموجودة في أقصى يمين شريط العنوان، ثم اضغط «تثبيت» ليفتح التطبيق في نافذة مستقلة.'
                  : 'Cliquez sur l’icône ⊕ (Installer) située tout à droite dans la barre d’adresse pour l’installer sur votre bureau.'}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowGuideModal(false)}
          style={{
            width: '100%',
            marginTop: '16px',
            background: '#f1f5f9',
            border: 'none',
            color: '#334155',
            padding: '10px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          {isAr ? 'إغلاق' : 'Fermer'}
        </button>
      </div>
    </div>
  )
}
