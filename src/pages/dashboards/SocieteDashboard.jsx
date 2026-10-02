import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import ChargesPanel from '../../components/ChargesPanel'
import AnnouncementsPanel from '../../components/AnnouncementsPanel'
import DocumentsPanel from '../../components/DocumentsPanel'
import ResidentsPanel from '../../components/ResidentsPanel'
import VirementForm from '../../components/VirementForm'
import DevisFacturesPanel from '../../components/DevisFacturesPanel'
import NavigationTabs from '../../components/NavigationTabs'

export default function SocieteDashboard() {
  const { profile } = useAuth()
  const { t, lang } = useLanguage()
  const isAr = lang === 'ar'
  const [tab, setTab] = useState('devis')
  const [reloadKey, setReloadKey] = useState(0)

  const isResponsableImmeuble = profile?.role === 'responsable_immeuble'

  const TABS = [
    { key: 'devis', label: isAr ? '📄 عروض الأسعار' : 'Devis' },
    { key: 'facture', label: isAr ? '🧾 الفواتير' : 'Factures' },
    { key: 'annonces', label: isAr ? '📢 الإعلانات' : t('tabs.announcements') || 'Annonces' },
    { key: 'documents', label: isAr ? '📁 الوثائق' : t('tabs.documents') || 'Documents' },
    { key: 'residents', label: isAr ? '👥 السكان' : t('tabs.residents') || 'Résidents' }
  ]

  const residenceName = profile?.residences?.name || 'Résidence Al Andalous'
  const userName = profile?.full_name || 'Société de Service'

  return (
    <div>
      <div className="page-head">
        <h1>{residenceName}</h1>
        <p className="muted">
          {isResponsableImmeuble
            ? (t('societeDashboard.immeubleManagement') || 'Gestion de votre immeuble —')
            : (t('societeDashboard.delegatedManagement') || 'Gestion déléguée —')} {userName}
        </p>
      </div>

      <NavigationTabs
        tabs={TABS}
        activeTab={tab}
        onChangeTab={setTab}
        role="societe"
      />

      {tab === 'charges' && <ChargesPanel canManage={false} />}
      {tab === 'devis' && (
        <>
          <VirementForm
            kind="devis"
            title="Envoyer un devis au syndic"
            submitLabel="Envoyer le devis"
            successText="Devis envoyé au syndic"
            notePlaceholder="Objet (ex: peinture façade)"
            onDone={() => setReloadKey(k => k + 1)}
          />
          <DevisFacturesPanel canManage={false} reloadKey={reloadKey} />
        </>
      )}
      {tab === 'facture' && (
        <>
          <VirementForm
            kind="facture"
            title="Envoyer une facture au syndic"
            submitLabel="Envoyer la facture"
            successText="Facture envoyée au syndic"
            notePlaceholder="Objet (ex: nettoyage octobre)"
            onDone={() => setReloadKey(k => k + 1)}
          />
          <DevisFacturesPanel canManage={false} reloadKey={reloadKey} />
        </>
      )}
      {tab === 'annonces' && <AnnouncementsPanel canManage={false} />}
      {tab === 'documents' && <DocumentsPanel canManage={false} />}
      {tab === 'residents' && <ResidentsPanel filterImmeubleId={isResponsableImmeuble ? profile.immeuble_id : null} />}
    </div>
  )
}
