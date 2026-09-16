export const translations = {
  fr: {
    brand: 'Syndic Maroc',
    common: {
      logout: 'Déconnexion',
      loading: 'Chargement...',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      confirmDelete: 'Voulez-vous vraiment supprimer ?',
      none: 'Aucun élément pour le moment.'
    },
    roles: {
      admin: 'Administrateur',
      resident: 'Résident',
      syndic: 'Responsable syndic',
      societe: 'Société externe'
    },
    login: {
      title: 'Se connecter',
      subtitle: 'Connectez-vous pour gérer votre résidence',
      email: 'Email',
      password: 'Mot de passe',
      emailPlaceholder: 'votre@email.com',
      submit: 'Se connecter',
      loading: 'Chargement...',
      error: "L'email ou le mot de passe est incorrect. Réessayez.",
      noAccount: "Vous n'avez pas de compte ?",
      signupLink: 'Créer un compte'
    },
    signup: {
      title: 'Créer un compte',
      roleQuestion: 'Quel est votre rôle dans la résidence ?',
      roles: {
        resident: { label: 'Résident', desc: "J'habite dans une résidence gérée par un syndic" },
        syndic: { label: 'Responsable syndic', desc: 'Je gère une ou plusieurs résidences' },
        societe: { label: 'Société externe', desc: 'Je gère la résidence pour le compte du syndic' }
      },
      next: 'Suivant',
      back: 'Retour',
      fullName: 'Nom complet',
      email: 'Email',
      password: 'Mot de passe',
      phone: 'Téléphone',
      phonePlaceholder: '06 XX XX XX XX',
      residenceInfo: 'Informations sur la résidence que vous allez gérer',
      residenceName: 'Nom de la résidence',
      residenceNamePlaceholder: 'Résidence Al Yasmine',
      address: 'Adresse',
      inviteCode: "Code d'invitation de la résidence",
      inviteCodePlaceholder: 'Demandez-le au syndic',
      apartmentNumber: "Numéro d'appartement",
      apartmentPlaceholder: 'Ex: Apt 12',
      submit: 'Créer le compte',
      loading: 'Chargement...',
      errorAccount: 'Impossible de créer le compte, réessayez.',
      errorCode: "Code d'invitation incorrect. Demandez le bon code à votre syndic.",
      errorGeneric: 'Une erreur est survenue. Réessayez.',
      alreadyAccount: 'Vous avez déjà un compte ?',
      loginLink: 'Se connecter'
    },
    completeInscription: {
      title: "Terminer l'inscription",
      subtitle: 'Choisissez votre mot de passe pour accéder à votre compte.',
      passwordPlaceholder: 'Nouveau mot de passe',
      submit: 'Confirmer',
      saving: 'Enregistrement...'
    },
    admin: {
      createSyndic: 'Créer un syndic',
      subtitle: 'Le syndic recevra un email pour créer son mot de passe et accéder à son compte.',
      fullNamePlaceholder: 'Nom complet du syndic',
      emailPlaceholder: 'email@exemple.com',
      residenceNamePlaceholder: 'Nom de la résidence',
      submit: 'Créer le syndic',
      sending: 'Envoi en cours...',
      success: 'Invitation envoyée au syndic avec succès !',
      networkError: 'Erreur réseau, réessayez.'
    },
    tabs: {
      charges: 'Charges & paiements',
      announcements: 'Annonces',
      documents: 'Documents',
      residents: 'Résidents',
      myCharges: 'Mes charges'
    },
    syndicDashboard: {
      managementSpace: 'Espace de gestion —'
    },
    societeDashboard: {
      delegatedManagement: 'Gestion déléguée —'
    },
    residentDashboard: {
      hello: 'Bonjour,',
      apt: 'Apt'
    },
    charges: {
      status: { pending: 'En attente', paid: 'Payé', late: 'En retard' },
      createTitle: 'Créer un appel de fonds',
      titlePlaceholder: 'Titre (ex: Charges Janvier 2027)',
      amountPlaceholder: 'Montant (DH)',
      descriptionPlaceholder: 'Description (optionnel)',
      create: 'Créer',
      creating: 'Création...',
      none: "Aucune charge pour l'instant.",
      dueDate: 'Échéance :',
      markPaid: 'Marquer comme payé',
      tableResident: 'Résident',
      tableApartment: 'Appartement',
      tableStatus: 'Statut'
    },
    announcements: {
      publishTitle: 'Publier une annonce',
      titlePlaceholder: 'Titre',
      contentPlaceholder: 'Message pour les résidents...',
      publish: 'Publier',
      publishing: 'Publication...',
      none: "Aucune annonce pour l'instant.",
      confirmDelete: 'Voulez-vous vraiment supprimer cette annonce ?'
    },
    documents: {
      addTitle: 'Ajouter un document',
      categories: {
        general: 'Général',
        pv: 'Procès-verbal',
        reglement: 'Règlement intérieur',
        facture: 'Facture',
        contrat: 'Contrat'
      },
      uploading: 'Téléversement...',
      none: "Aucun document pour l'instant.",
      download: 'Télécharger',
      confirmDelete: 'Voulez-vous vraiment supprimer ce document ?'
    },
    residents: {
      inviteTitle: 'Inviter un résident par email',
      inviteSubtitle: 'Le résident recevra un email pour créer son mot de passe et accéder à son compte.',
      emailPlaceholder: 'email@exemple.com',
      apartmentPlaceholder: "N° appartement",
      send: "Envoyer l'invitation",
      sending: 'Envoi...',
      success: 'Invitation envoyée avec succès !',
      networkError: 'Erreur réseau, réessayez.',
      codeTitle: "Code d'invitation de la résidence",
      codeSubtitle: "Partagez ce code avec la société externe pour qu'elle puisse créer son compte et rejoindre la résidence.",
      copy: 'Copier',
      copied: 'Copié !',
      membersTitle: 'Membres',
      tableName: 'Nom',
      tableRole: 'Rôle',
      tableApartment: 'Appartement',
      tablePhone: 'Téléphone'
    }
  },
  ar: {
    brand: 'سنديك المغرب',
    common: {
      logout: 'تسجيل الخروج',
      loading: 'جارٍ التحميل...',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      confirmDelete: 'هل تريد حقًا الحذف؟',
      none: 'لا يوجد أي عنصر حاليًا.'
    },
    roles: {
      admin: 'مدير',
      resident: 'ساكن',
      syndic: 'مسؤول السنديك',
      societe: 'شركة خارجية'
    },
    login: {
      title: 'تسجيل الدخول',
      subtitle: 'سجّل الدخول لإدارة الإقامة الخاصة بك',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      emailPlaceholder: 'بريدك@الإلكتروني.com',
      submit: 'تسجيل الدخول',
      loading: 'جارٍ التحميل...',
      error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مجددًا.',
      noAccount: 'ليس لديك حساب؟',
      signupLink: 'إنشاء حساب'
    },
    signup: {
      title: 'إنشاء حساب',
      roleQuestion: 'ما هو دورك في الإقامة؟',
      roles: {
        resident: { label: 'ساكن', desc: 'أسكن في إقامة يديرها سنديك' },
        syndic: { label: 'مسؤول السنديك', desc: 'أدير إقامة واحدة أو أكثر' },
        societe: { label: 'شركة خارجية', desc: 'أدير الإقامة نيابة عن السنديك' }
      },
      next: 'التالي',
      back: 'رجوع',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      phone: 'الهاتف',
      phonePlaceholder: '06 XX XX XX XX',
      residenceInfo: 'معلومات عن الإقامة التي ستديرها',
      residenceName: 'اسم الإقامة',
      residenceNamePlaceholder: 'إقامة الياسمين',
      address: 'العنوان',
      inviteCode: 'رمز دعوة الإقامة',
      inviteCodePlaceholder: 'اطلبه من السنديك',
      apartmentNumber: 'رقم الشقة',
      apartmentPlaceholder: 'مثال: شقة 12',
      submit: 'إنشاء الحساب',
      loading: 'جارٍ التحميل...',
      errorAccount: 'تعذر إنشاء الحساب، حاول مجددًا.',
      errorCode: 'رمز الدعوة غير صحيح. اطلب الرمز الصحيح من السنديك.',
      errorGeneric: 'حدث خطأ. حاول مجددًا.',
      alreadyAccount: 'لديك حساب بالفعل؟',
      loginLink: 'تسجيل الدخول'
    },
    completeInscription: {
      title: 'إتمام التسجيل',
      subtitle: 'اختر كلمة المرور للوصول إلى حسابك.',
      passwordPlaceholder: 'كلمة المرور الجديدة',
      submit: 'تأكيد',
      saving: 'جارٍ الحفظ...'
    },
    admin: {
      createSyndic: 'إنشاء سنديك',
      subtitle: 'سيتلقى السنديك بريدًا إلكترونيًا لإنشاء كلمة المرور والوصول إلى حسابه.',
      fullNamePlaceholder: 'الاسم الكامل للسنديك',
      emailPlaceholder: 'بريد@إلكتروني.com',
      residenceNamePlaceholder: 'اسم الإقامة',
      submit: 'إنشاء السنديك',
      sending: 'جارٍ الإرسال...',
      success: 'تم إرسال الدعوة إلى السنديك بنجاح!',
      networkError: 'خطأ في الشبكة، حاول مجددًا.'
    },
    tabs: {
      charges: 'المصاريف والمدفوعات',
      announcements: 'الإعلانات',
      documents: 'الوثائق',
      residents: 'السكان',
      myCharges: 'مصاريفي'
    },
    syndicDashboard: {
      managementSpace: 'فضاء الإدارة —'
    },
    societeDashboard: {
      delegatedManagement: 'إدارة مفوضة —'
    },
    residentDashboard: {
      hello: 'مرحبًا،',
      apt: 'شقة'
    },
    charges: {
      status: { pending: 'قيد الانتظار', paid: 'مدفوع', late: 'متأخر' },
      createTitle: 'إنشاء طلب دفع',
      titlePlaceholder: 'العنوان (مثال: مصاريف يناير 2027)',
      amountPlaceholder: 'المبلغ (درهم)',
      descriptionPlaceholder: 'وصف (اختياري)',
      create: 'إنشاء',
      creating: 'جارٍ الإنشاء...',
      none: 'لا توجد أي مصاريف حاليًا.',
      dueDate: 'تاريخ الاستحقاق:',
      markPaid: 'تحديد كمدفوع',
      tableResident: 'الساكن',
      tableApartment: 'الشقة',
      tableStatus: 'الحالة'
    },
    announcements: {
      publishTitle: 'نشر إعلان',
      titlePlaceholder: 'العنوان',
      contentPlaceholder: 'رسالة للسكان...',
      publish: 'نشر',
      publishing: 'جارٍ النشر...',
      none: 'لا توجد أي إعلانات حاليًا.',
      confirmDelete: 'هل تريد حقًا حذف هذا الإعلان؟'
    },
    documents: {
      addTitle: 'إضافة وثيقة',
      categories: {
        general: 'عام',
        pv: 'محضر اجتماع',
        reglement: 'النظام الداخلي',
        facture: 'فاتورة',
        contrat: 'عقد'
      },
      uploading: 'جارٍ الرفع...',
      none: 'لا توجد أي وثائق حاليًا.',
      download: 'تحميل',
      confirmDelete: 'هل تريد حقًا حذف هذه الوثيقة؟'
    },
    residents: {
      inviteTitle: 'دعوة ساكن عبر البريد الإلكتروني',
      inviteSubtitle: 'سيتلقى الساكن بريدًا إلكترونيًا لإنشاء كلمة المرور والوصول إلى حسابه.',
      emailPlaceholder: 'بريد@إلكتروني.com',
      apartmentPlaceholder: 'رقم الشقة',
      send: 'إرسال الدعوة',
      sending: 'جارٍ الإرسال...',
      success: 'تم إرسال الدعوة بنجاح!',
      networkError: 'خطأ في الشبكة، حاول مجددًا.',
      codeTitle: 'رمز دعوة الإقامة',
      codeSubtitle: 'شارك هذا الرمز مع الشركة الخارجية حتى تتمكن من إنشاء حسابها والانضمام إلى الإقامة.',
      copy: 'نسخ',
      copied: 'تم النسخ!',
      membersTitle: 'الأعضاء',
      tableName: 'الاسم',
      tableRole: 'الدور',
      tableApartment: 'الشقة',
      tablePhone: 'الهاتف'
    }
  }
}
