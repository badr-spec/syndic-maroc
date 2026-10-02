import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, switchDatabaseMode, activeMode } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'

export default function MarketingPricingPage() {
  const { lang, toggleLang } = useLanguage()
  const isAr = lang === 'ar'
  const navigate = useNavigate()

  const [billingCycle, setBillingCycle] = useState('annual') // 'monthly' | 'annual'
  const [loadingDemo, setLoadingDemo] = useState(false)

  // Direct 1-Click Interactive Demo Login
  async function handleLaunchDemo(email, role) {
    setLoadingDemo(true)
    try {
      if (activeMode !== 'local') {
        localStorage.setItem('syndic_maroc_database_mode', 'local')
      }
      await supabase.auth.signInWithPassword({ email, password: 'demo' })
      navigate('/')
    } catch (err) {
      console.warn('Demo login err:', err)
      navigate('/login')
    } finally {
      setLoadingDemo(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* 1. Header / Navbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/logo.svg"
            alt="Syndic Maroc"
            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'contain' }}
          />
          <div>
            <strong style={{ fontSize: '1.1rem', color: '#064e3b', display: 'block', lineHeight: 1.2 }}>
              SYNDIC MAROC
            </strong>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {isAr ? 'المنصة الرقمية لإدارة الإقامات' : 'Logiciel de gestion de copropriété'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={toggleLang}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {lang === 'fr' ? 'العربية' : 'Français'}
          </button>

          <Link
            to="/login"
            style={{
              textDecoration: 'none',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            {isAr ? 'تسجيل الدخول' : 'Connexion'}
          </Link>

          <button
            type="button"
            onClick={() => handleLaunchDemo('syndic@demo.ma', 'syndic')}
            disabled={loadingDemo}
            style={{
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              padding: '7px 16px',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚡</span>
            <span>{isAr ? 'تجربة الديمو مباشرة' : 'Essayer la Démo'}</span>
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{
        padding: '48px 20px 36px',
        maxWidth: '1080px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '20px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#047857',
          fontSize: '0.78rem',
          fontWeight: 700,
          marginBottom: '16px'
        }}>
          <span>🇲🇦</span>
          <span>{isAr ? 'متوافق 100% مع القانون المغربي 18-00 للملكية المشتركة' : 'Conforme à la Loi Marocaine 18-00 sur la Copropriété'}</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 800,
          color: '#0f172a',
          lineHeight: 1.2,
          margin: '0 0 16px 0',
          letterSpacing: '-0.5px'
        }}>
          {isAr
            ? 'تدبير عصري وشفاف لإقامتك بدون تعقيدات'
            : 'Gérez votre copropriété avec clarté, rigueur et sérénité'}
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
          color: '#475569',
          maxWidth: '740px',
          margin: '0 auto 28px',
          lineHeight: 1.5
        }}>
          {isAr
            ? 'استخلاص المساهمات الشهرية، وصولات رسمية بالختم، متابعة صندوق العمارة، إشعارات الواتساب، والإنذارات القانونية للمتأخرين عن الأداء.'
            : 'Cotisations mensuelles, reçus avec QR code & cachet, suivi de la caisse en temps réel, alertes WhatsApp et mises en demeure Loi 18-00.'}
        </p>

        {/* 1-Click Instant Demo Launch Bar */}
        <div style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          maxWidth: '780px',
          margin: '0 auto 36px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
            {isAr ? '🚀 جرب التطبيق الآن مباشرة بدون إنشاء حساب :' : '🚀 Testez immédiatement l’application sans créer de compte :'}
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleLaunchDemo('syndic@demo.ma', 'syndic')}
              disabled={loadingDemo}
              style={{
                background: '#ffffff',
                border: '1.5px solid #047857',
                color: '#047857',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>🏢</span>
              <span>{isAr ? 'دخول كـ سنديك الإقامة' : 'Espace Syndic (Gestion)'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleLaunchDemo('resident@demo.ma', 'resident')}
              disabled={loadingDemo}
              style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>👥</span>
              <span>{isAr ? 'دخول كـ ساكن / مالك' : 'Espace Copropriétaire'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleLaunchDemo('admin@demo.ma', 'admin')}
              disabled={loadingDemo}
              style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>🛡️</span>
              <span>{isAr ? 'دخول كـ مشرف عام' : 'Espace Super Admin'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Pricing Section (Grille Tarifaire en DH) */}
      <section id="pricing" style={{
        padding: '24px 20px 48px',
        maxWidth: '1140px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
            {isAr ? 'عروض وأسعار الاشتراكات' : 'Formules & Tarifs d’Abonnement'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.94rem', margin: 0 }}>
            {isAr
              ? 'أسعار واضحة ومناسبة للملكيات المشتركة بالمغرب مع إمكانية الأداء السنوي بشيك أو تحويل بنكي'
              : 'Tarifs transparents sans engagement, facturation annuelle ou mensuelle avec reçu comptable'}
          </p>

          {/* Billing Cycle Switch */}
          <div style={{
            display: 'inline-flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '10px',
            marginTop: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                background: billingCycle === 'monthly' ? '#ffffff' : 'transparent',
                color: billingCycle === 'monthly' ? '#0f172a' : '#64748b',
                fontWeight: billingCycle === 'monthly' ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: billingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {isAr ? 'أداء شهري' : 'Mensuel'}
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                background: billingCycle === 'annual' ? '#ffffff' : 'transparent',
                color: billingCycle === 'annual' ? '#047857' : '#64748b',
                fontWeight: billingCycle === 'annual' ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: billingCycle === 'annual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{isAr ? 'أداء سنوي' : 'Annuel'}</span>
              <span style={{
                background: '#dcfce7',
                color: '#16a34a',
                fontSize: '0.7rem',
                padding: '1px 6px',
                borderRadius: '10px',
                fontWeight: 800
              }}>
                {isAr ? 'شهران مجاناً' : '-20%'}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px',
          alignItems: 'stretch'
        }}>
          {/* Plan 1: Gratuit / Découverte */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isAr ? 'عمارة صغيرة' : 'Petite Copropriété'}
              </span>
              <h3 style={{ fontSize: '1.3rem', margin: '4px 0 10px 0', color: '#0f172a' }}>
                {isAr ? 'باقة الانطلاق' : 'Découverte'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>0</span>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>DH / {isAr ? 'دائماً' : 'Gratuit'}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 18px 0', lineHeight: 1.4 }}>
                {isAr
                  ? 'مثالي للإقامات الصغيرة لتجربة تدبير المساهمات بدون أي مقابل.'
                  : 'Parfait pour les petits immeubles pour démarrer sans frais.'}
              </p>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span>{isAr ? 'حتى 8 شقق' : 'Jusqu’à 8 appartements'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span>{isAr ? 'استخلاص المساهمات والوصولات' : 'Gestion des charges & reçus'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span>{isAr ? 'متابعة رصيد الصندوق' : 'Bilan de caisse simple'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                  <span>✕</span>
                  <span>{isAr ? 'إنذارات قانونية Loi 18-00' : 'Mises en demeure formelles'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                  <span>✕</span>
                  <span>{isAr ? 'رسائل الواتساب التلقائية' : 'Relances WhatsApp auto'}</span>
                </div>
              </div>
            </div>

            <Link
              to="/signup"
              style={{
                marginTop: '20px',
                textAlign: 'center',
                textDecoration: 'none',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                padding: '9px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.84rem'
              }}
            >
              {isAr ? 'بدء الاستخدام مجاناً' : 'Démarrer gratuitement'}
            </Link>
          </div>

          {/* Plan 2: Immeuble Standard (RECOMMENDED / STAR) */}
          <div style={{
            background: '#ffffff',
            border: '2px solid #047857',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            boxShadow: '0 4px 15px rgba(4, 120, 87, 0.12)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#047857',
              color: '#ffffff',
              padding: '2px 12px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              ★ {isAr ? 'الأكثر طلباً بالمغرب' : 'LE PLUS POPULAIRE'}
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isAr ? 'عمارة سكنية' : 'Immeuble Standard'}
              </span>
              <h3 style={{ fontSize: '1.3rem', margin: '4px 0 10px 0', color: '#0f172a' }}>
                {isAr ? 'باقة الإقامة' : 'Formule Résidence'}
              </h3>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#047857' }}>
                  {billingCycle === 'annual' ? '158' : '199'}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  DH / {isAr ? 'شهر' : 'mois'}
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                {billingCycle === 'annual' ? (isAr ? '1 900 درهم سنوياً (شهران مجاناً)' : '1 900 DH / an (2 mois offerts)') : (isAr ? 'فاتورة شهرية' : 'Facturation mensuelle')}
              </span>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span><strong>{isAr ? 'حتى 30 شقة' : 'Jusqu’à 30 appartements'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span>{isAr ? 'جميع الأقسام الـ 13 (مرآب، عدادات، حجوزات)' : 'Toutes les rubriques (parking, compteurs)'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span>{isAr ? 'تنبيهات وتذكير الواتساب بضغطة زر' : 'Rappels WhatsApp en 1 clic'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span>{isAr ? 'إنذارات قانونية رسمية (Loi 18-00)' : 'Mises en demeure Loi 18-00'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span>{isAr ? 'ملصق المدخل A4 بـ QR Code' : 'Affiche Hall avec QR Code'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchDemo('syndic@demo.ma', 'syndic')}
              style={{
                marginTop: '20px',
                textAlign: 'center',
                background: '#047857',
                border: 'none',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              {isAr ? 'تجربة الباقة لمدة 30 يوم مجاناً' : 'Essai 30 jours sans engagement'}
            </button>
          </div>

          {/* Plan 3: Grande Résidence / Complexe */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isAr ? 'مجمع سكني كبير' : 'Complexe & Lotissement'}
              </span>
              <h3 style={{ fontSize: '1.3rem', margin: '4px 0 10px 0', color: '#0f172a' }}>
                {isAr ? 'باقة البريميوم' : 'Complexe & Blocs'}
              </h3>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
                  {billingCycle === 'annual' ? '325' : '399'}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  DH / {isAr ? 'شهر' : 'mois'}
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '12px' }}>
                {billingCycle === 'annual' ? (isAr ? '3 900 درهم سنوياً' : '3 900 DH / an') : (isAr ? 'فاتورة شهرية' : 'Facturation mensuelle')}
              </span>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span>{isAr ? 'حتى 80 شقة وعدة عمارات' : 'Jusqu’à 80 appts & multi-blocs'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span>{isAr ? 'حسابات متعددة لأعضاء المكتب' : 'Multi-comptes pour le bureau'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span>{isAr ? 'إدارة شركات الصيانة والفواتير' : 'Suivi prestataires & factures'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                  <span>{isAr ? 'دعم هاتفي وواتساب مخصص 7/7' : 'Support prioritaire WhatsApp 7j/7'}</span>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/212600000000?text=Bonjour,%20je%20souhaite%20des%20informations%20sur%20l%20abonnement%20Syndic%20Maroc%20Complexe"
              target="_blank"
              rel="noreferrer"
              style={{
                marginTop: '20px',
                textAlign: 'center',
                textDecoration: 'none',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                padding: '9px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.84rem'
              }}
            >
              {isAr ? 'طلب اشتراك عبر الواتساب' : 'Contacter pour commander'}
            </a>
          </div>
        </div>
      </section>

      {/* 4. Payment Methods & Trust in Morocco */}
      <section style={{
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        padding: '36px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '8px' }}>
            {isAr ? 'وسائل أداء مرنة ومناسبة لحساب العمارة' : 'Moyens de Paiement Adaptés à la Copropriété'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px 0' }}>
            {isAr
              ? 'نقبل التحويل البنكي لحساب العمارة (RIB CIH, Attijariwafa, Bank of Africa)، الشيك السنوي، أو البطاقة البنكية المغربية مع فاتورة قانونية.'
              : 'Virement bancaire direct (RIB CIH, Attijariwafa, BOA, BCP), chèque annuel au nom de la copropriété ou carte CMI avec facture acquittée.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            <span>🏦 Virement Bancaire (RIB)</span>
            <span>📝 Chèque Annuel</span>
            <span>💳 Carte Bancaire CMI</span>
            <span>🧾 Facture & Reçu Comptable</span>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer style={{
        padding: '24px 20px',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: '#64748b'
      }}>
        <p style={{ margin: '0 0 6px 0' }}>
          © {new Date().getFullYear()} Syndic Maroc. {isAr ? 'جميع الحقوق محفوظة' : 'Tous droits réservés'}.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
          <Link to="/login" style={{ color: '#047857', textDecoration: 'none', fontWeight: 600 }}>
            {isAr ? 'فضاء الدخول' : 'Espace Connexion'}
          </Link>
          <span>·</span>
          <Link to="/signup" style={{ color: '#047857', textDecoration: 'none', fontWeight: 600 }}>
            {isAr ? 'تسجيل عمارة جديدة' : 'Inscrire une copropriété'}
          </Link>
        </div>
      </footer>
    </div>
  )
}
