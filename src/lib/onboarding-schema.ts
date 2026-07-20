/**
 * Questionnaire d'onboarding client — source unique de vérité.
 *
 * Le formulaire client (src/pages/Onboarding.tsx) et la relecture admin
 * (src/pages/adminOnboarding.tsx) rendent tous les deux ce schéma : ajouter une
 * question ici la fait apparaître des deux côtés, et les réponses déjà stockées
 * ne bougent pas tant que la `key` ne change pas.
 *
 * ⚠️ Ne jamais renommer une `key` déjà en production : les réponses sont
 * indexées dessus dans le blob et deviendraient orphelines. Pour reformuler une
 * question, changer `label` en gardant `key`.
 */

export type OnboardingFieldType = 'text' | 'textarea' | 'select' | 'checkboxes'

export type OnboardingField = {
  key: string
  label: string
  help?: string
  type: OnboardingFieldType
  placeholder?: string
  options?: string[]
  /** Compté dans « l'essentiel » et signalé au client s'il est vide. */
  essential?: boolean
  rows?: number
}

export type OnboardingSection = {
  id: string
  title: string
  icon: string
  intro?: string
  fields: OnboardingField[]
  /** Clés de UPLOAD_SLOTS proposées au bas de cette section. Les documents se
   *  déposent au fil des questions : on demande le BP pendant qu'on parle de
   *  l'entreprise, les créas pendant qu'on parle des campagnes. */
  uploads?: string[]
}

/** Séparateur des valeurs d'un champ `checkboxes` dans la chaîne stockée. */
export const MULTI_SEP = ' • '

export const ONBOARDING_SECTIONS: OnboardingSection[] = [
  {
    id: 'entreprise',
    title: 'L’entreprise',
    icon: '🏢',
    uploads: ['bp'],
    intro: 'Le contexte général. Rien de confidentiel ici, juste de quoi se situer.',
    fields: [
      {
        key: 'pitch', type: 'textarea', rows: 4, essential: true,
        label: 'En trois phrases, que fait votre entreprise ?',
        help: 'Comme si vous l’expliquiez à quelqu’un qui ne connaît rien à votre secteur.',
      },
      { key: 'website', type: 'text', label: 'Site web', placeholder: 'https://' },
      {
        key: 'stade', type: 'select', label: 'Stade de développement',
        options: ['Pre-seed', 'Seed', 'Série A', 'Série B ou plus', 'Bootstrappé / rentable', 'ETI ou grand groupe'],
      },
      { key: 'creation', type: 'text', label: 'Année de création', placeholder: '2021' },
      {
        key: 'effectif', type: 'select', label: 'Effectif total',
        options: ['1 à 5', '6 à 20', '21 à 50', '51 à 200', 'Plus de 200'],
      },
      {
        key: 'financement', type: 'text',
        label: 'Montant levé à date',
        help: 'Et auprès de qui, si c’est public.',
      },
      { key: 'ca', type: 'text', label: 'CA ou ARR actuel' },
      {
        key: 'equipe_dirigeante', type: 'textarea', rows: 3,
        label: 'Qui dirige l’entreprise ?',
        help: 'Noms, rôles, parcours en deux mots.',
      },
    ],
  },
  {
    id: 'objectifs',
    title: 'Objectifs business',
    icon: '🎯',
    uploads: ['strategie'],
    intro: 'C’est la section qui oriente tout le reste de la mission. Prenez-y le temps qu’il faut.',
    fields: [
      {
        key: 'objectif_12m', type: 'textarea', rows: 4, essential: true,
        label: 'Quel est l’objectif business des 12 prochains mois ?',
        help: 'Chiffré si possible : ARR, nombre de clients, parts de marché, levée à préparer.',
      },
      {
        key: 'kpi', type: 'textarea', rows: 3, essential: true,
        label: 'Le KPI numéro un sur lequel vous êtes jugé',
        help: 'Celui que vous regardez en premier le lundi matin.',
      },
      {
        key: 'succes_mission', type: 'textarea', rows: 4, essential: true,
        label: 'Dans six mois, à quoi ressemble une mission réussie de mon côté ?',
        help: 'Soyez concret : ce que vous devez pouvoir montrer, à qui, et avec quels chiffres.',
      },
      {
        key: 'blocage', type: 'textarea', rows: 3, essential: true,
        label: 'Aujourd’hui, qu’est-ce qui vous bloque le plus ?',
      },
      {
        key: 'echeances', type: 'textarea', rows: 3,
        label: 'Échéances et contraintes de calendrier',
        help: 'Levée, lancement produit, salon, board, renouvellement de contrat cadre…',
      },
      {
        key: 'budget_marketing', type: 'text',
        label: 'Budget marketing disponible',
        help: 'Annuel ou mensuel, hors prestations. Un ordre de grandeur suffit.',
      },
    ],
  },
  {
    id: 'produit',
    title: 'Le produit',
    icon: '🧩',
    uploads: ['video', 'produit'],
    intro: 'Je dois pouvoir le pitcher aussi bien que vous avant de commencer à en parler à votre marché.',
    fields: [
      {
        key: 'fonctionnement', type: 'textarea', rows: 5, essential: true,
        label: 'Comment fonctionne le produit, concrètement ?',
        help: 'Le parcours de bout en bout : premier contact, installation, usage quotidien, qui fait quoi.',
      },
      {
        key: 'valeur', type: 'textarea', rows: 4, essential: true,
        label: 'Quel problème résolvez-vous, et qu’est-ce que ça change pour l’utilisateur ?',
        help: 'Avant / après, si possible chiffré : temps gagné, euros, actes, taux de remplissage.',
      },
      {
        key: 'differenciateurs', type: 'textarea', rows: 4, essential: true,
        label: 'Vos trois différenciateurs réels',
        help: 'Ceux que vos clients citent spontanément.',
      },
      {
        key: 'pricing', type: 'textarea', rows: 3,
        label: 'Modèle économique et tarification',
        help: 'Abonnement, à l’acte, par utilisateur, setup fee, engagement…',
      },
      { key: 'roadmap', type: 'textarea', rows: 3, label: 'Ce qui arrive dans les six prochains mois' },
      {
        key: 'demo', type: 'textarea', rows: 2,
        label: 'Lien de démo ou accès à un environnement de test',
        help: 'Identifiants si nécessaire. Vous pouvez aussi me les transmettre autrement.',
      },
      {
        key: 'reglementaire', type: 'textarea', rows: 3,
        label: 'Contraintes réglementaires',
        help: 'Dispositif médical, marquage CE, HDS, RGPD, données de santé, publicité, remboursement.',
      },
    ],
  },
  {
    id: 'cibles',
    title: 'Cibles et marché',
    icon: '👥',
    uploads: ['marche'],
    intro: 'En santé, celui qui décide, celui qui utilise et celui qui paie sont rarement la même personne.',
    fields: [
      {
        key: 'icp', type: 'textarea', rows: 4, essential: true,
        label: 'Votre client idéal, décrit précisément',
        help: 'Type de structure, taille, spécialité, équipement, géographie. Le plus précis possible.',
      },
      {
        key: 'decideur', type: 'textarea', rows: 4, essential: true,
        label: 'Qui décide, qui utilise, qui paie ?',
        help: 'Et qui peut bloquer la décision sans en être à l’origine.',
      },
      { key: 'segments', type: 'textarea', rows: 3, label: 'Autres segments visés, par ordre de priorité' },
      { key: 'geo', type: 'text', label: 'Marchés géographiques', placeholder: 'France, DACH, Benelux…' },
      { key: 'cycle_vente', type: 'text', label: 'Durée moyenne d’un cycle de vente' },
      { key: 'panier', type: 'text', label: 'Panier moyen et durée de vie client' },
      {
        key: 'objections', type: 'textarea', rows: 3, essential: true,
        label: 'Les trois objections que vous entendez le plus',
      },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing : ce qui a été fait',
    icon: '📣',
    uploads: ['creas', 'contenus'],
    intro: 'Y compris ce qui a échoué. C’est souvent l’information la plus utile de tout ce questionnaire.',
    fields: [
      {
        key: 'canaux_actifs', type: 'checkboxes',
        label: 'Canaux actifs aujourd’hui',
        options: [
          'SEO', 'Google Ads', 'LinkedIn organique', 'LinkedIn Ads', 'Meta Ads',
          'Emailing / nurture', 'Blog / content', 'Newsletter', 'Webinars',
          'Salons et congrès', 'Relations presse', 'Partenariats', 'Influence',
          'Outbound / cold email', 'Phoning', 'Bouche-à-oreille', 'Aucun',
        ],
      },
      {
        key: 'ce_qui_marche', type: 'textarea', rows: 4, essential: true,
        label: 'Ce qui a le mieux marché jusqu’ici, et pourquoi selon vous',
      },
      {
        key: 'ce_qui_a_rate', type: 'textarea', rows: 4, essential: true,
        label: 'Ce qui a été tenté et n’a pas marché',
        help: 'Sans filtre : ça m’évite de vous reproposer une idée que vous avez déjà enterrée.',
      },
      {
        key: 'positionnement', type: 'textarea', rows: 3, essential: true,
        label: 'Votre positionnement et votre message actuels',
        help: 'La phrase exacte que vous utilisez quand on vous demande ce que vous faites.',
      },
      {
        key: 'marque', type: 'select',
        label: 'État de la marque',
        options: [
          'Solide, à jour', 'Correcte mais vieillissante',
          'Incohérente d’un support à l’autre', 'À refaire entièrement', 'Inexistante',
        ],
      },
      {
        key: 'contenus', type: 'textarea', rows: 3,
        label: 'Contenus existants réutilisables',
        help: 'Cas clients, études, données propriétaires, témoignages, publications scientifiques.',
      },
      {
        key: 'stack', type: 'textarea', rows: 3,
        label: 'Stack et outils marketing',
        help: 'CRM, marketing automation, analytics, SEO, design, outils de prospection.',
      },
      { key: 'agences', type: 'textarea', rows: 2, label: 'Agences ou freelances qui interviennent aujourd’hui' },
    ],
  },
  {
    id: 'acquisition',
    title: 'Acquisition et chiffres',
    icon: '📈',
    uploads: ['data'],
    intro: 'Des ordres de grandeur suffisent. Mettez « je ne sais pas » quand c’est le cas, c’est une réponse utile.',
    fields: [
      {
        key: 'sources_leads', type: 'textarea', rows: 4, essential: true,
        label: 'D’où viennent vos leads aujourd’hui, et en quelles proportions ?',
      },
      {
        key: 'volumes', type: 'textarea', rows: 3,
        label: 'Volumes mensuels',
        help: 'Visites, leads, démos réalisées, signatures.',
      },
      { key: 'conversion', type: 'textarea', rows: 3, label: 'Taux de conversion connus, étape par étape' },
      { key: 'cac', type: 'text', label: 'Coût d’acquisition client, si vous le suivez' },
      {
        key: 'analytics', type: 'textarea', rows: 3,
        label: 'Ce qui est tracké aujourd’hui, et où',
        help: 'GA4, Search Console, CRM, tableaux de bord internes. Précisez qui y a accès.',
      },
    ],
  },
  {
    id: 'concurrence',
    title: 'Concurrence',
    icon: '⚔️',
    uploads: ['concurrence'],
    fields: [
      {
        key: 'concurrents', type: 'textarea', rows: 4, essential: true,
        label: 'Vos trois concurrents principaux',
        help: 'Nom, et en une ligne ce qu’ils font mieux que vous.',
      },
      { key: 'gagne', type: 'textarea', rows: 3, essential: true, label: 'Quand vous gagnez contre eux, pourquoi ?' },
      { key: 'perd', type: 'textarea', rows: 3, essential: true, label: 'Quand vous perdez, pourquoi ?' },
      {
        key: 'statu_quo', type: 'textarea', rows: 3,
        label: 'Contre quoi vous battez-vous vraiment ?',
        help: 'Souvent ni un concurrent ni un produit : le statu quo, un tableur, ou « on verra l’an prochain ».',
      },
      { key: 'veille', type: 'textarea', rows: 3, label: 'Ce que font vos concurrents en marketing et qui vous inquiète' },
    ],
  },
  {
    id: 'equipe',
    title: 'Équipe sales et marketing',
    icon: '🧑‍💼',
    uploads: ['presentations'],
    intro: 'Pour savoir avec qui je travaille au quotidien, et qui je dois rencontrer en premier.',
    fields: [
      {
        key: 'compo_marketing', type: 'textarea', rows: 4, essential: true,
        label: 'Qui compose l’équipe marketing ?',
        help: 'Noms, rôles, ancienneté, temps plein ou partiel, niveau de séniorité.',
      },
      {
        key: 'compo_sales', type: 'textarea', rows: 4, essential: true,
        label: 'Qui compose l’équipe commerciale ?',
      },
      {
        key: 'qui_fait_quoi', type: 'textarea', rows: 3,
        label: 'Qui fait quoi, concrètement ?',
        help: 'Et surtout : qu’est-ce que personne ne fait aujourd’hui alors qu’il faudrait ?',
      },
      { key: 'process_vente', type: 'textarea', rows: 4, label: 'Votre processus de vente, étape par étape' },
      { key: 'crm', type: 'text', label: 'CRM utilisé', placeholder: 'HubSpot, Pipedrive, Salesforce, aucun…' },
      {
        key: 'interlocuteurs', type: 'textarea', rows: 3, essential: true,
        label: 'Qui dois-je rencontrer en priorité ?',
        help: 'Nom, rôle, email. Trois personnes suffisent pour démarrer.',
      },
      { key: 'recrutements', type: 'textarea', rows: 2, label: 'Recrutements prévus sur les 12 prochains mois' },
    ],
  },
  {
    id: 'divers',
    title: 'Pour finir',
    icon: '💬',
    uploads: ['autres'],
    fields: [
      {
        key: 'sensibles', type: 'textarea', rows: 3,
        label: 'Sujets sensibles ou zones à ne pas toucher',
        help: 'Sujet politique en interne, personne à ménager, décision récente à ne pas rouvrir.',
      },
      { key: 'attentes', type: 'textarea', rows: 4, essential: true, label: 'Ce que vous attendez de moi, très concrètement' },
      {
        key: 'deja_dit', type: 'textarea', rows: 3,
        label: 'Ce qu’on vous a déjà conseillé et que vous ne voulez pas réentendre',
      },
      { key: 'autre', type: 'textarea', rows: 4, label: 'Autre chose que je devrais savoir ?' },
    ],
  },
]

/* ──────────────────────────────────────────────────────────────────────────
   Documents
   ────────────────────────────────────────────────────────────────────────── */

export type UploadSlot = {
  key: string
  label: string
  help?: string
  accept?: string
}

export const UPLOAD_SLOTS: UploadSlot[] = [
  {
    key: 'bp',
    label: 'Business plan et deck investisseurs',
    help: 'La version la plus à jour, même imparfaite.',
  },
  {
    key: 'strategie',
    label: 'Plan stratégique, budget, présentation board',
    help: 'Ce sur quoi vous êtes engagé auprès de vos actionnaires.',
  },
  {
    key: 'video',
    label: 'Vidéo produit ou démo',
    help: 'Jusqu’à 100 Mo. Un Loom ou un YouTube non répertorié fait aussi l’affaire.',
  },
  {
    key: 'produit',
    label: 'Documentation produit',
    help: 'Captures d’écran, manuel, spécifications, notice réglementaire.',
  },
  {
    key: 'marche',
    label: 'Études de marché et personas',
    help: 'Segmentation, interviews clients, rapports sectoriels.',
  },
  {
    key: 'creas',
    label: 'Créations de campagnes passées',
    help: 'Visuels, bannières, landing pages, emails, plaquettes.',
  },
  {
    key: 'contenus',
    label: 'Contenus et cas clients',
    help: 'Livres blancs, témoignages, publications, études.',
  },
  {
    key: 'data',
    label: 'Exports de données',
    help: 'Extraction CRM, rapport analytics, chiffres de ventes, résultats de campagnes.',
  },
  {
    key: 'concurrence',
    label: 'Analyses concurrentielles',
    help: 'Battlecards, benchmarks, comparatifs — même vieux d’un an.',
  },
  {
    key: 'presentations',
    label: 'Deck commercial et process de vente',
    help: 'Ce que vos commerciaux montrent en rendez-vous, playbook, organigramme.',
  },
  {
    key: 'autres',
    label: 'Autres documents utiles',
    help: 'Tout ce qui n’entrait dans aucune case précédente.',
  },
]

/** Emplacements de dépôt d'une section, résolus depuis leurs clés. */
export function slotsForSection(section: OnboardingSection): UploadSlot[] {
  return (section.uploads || [])
    .map(key => UPLOAD_SLOTS.find(s => s.key === key))
    .filter((s): s is UploadSlot => Boolean(s))
}

/* ──────────────────────────────────────────────────────────────────────────
   Progression
   ────────────────────────────────────────────────────────────────────────── */

export const ALL_FIELDS: OnboardingField[] = ONBOARDING_SECTIONS.flatMap(s => s.fields)
export const ESSENTIAL_FIELDS: OnboardingField[] = ALL_FIELDS.filter(f => f.essential)

export function isFilled(answers: Record<string, string>, key: string): boolean {
  const v = answers?.[key]
  return typeof v === 'string' && v.trim().length > 0
}

export function sectionProgress(answers: Record<string, string>, section: OnboardingSection) {
  const filled = section.fields.filter(f => isFilled(answers, f.key)).length
  return { filled, total: section.fields.length, done: filled === section.fields.length }
}

/**
 * Deux mesures volontairement distinctes :
 *  - `percent` (tous les champs) sert la barre de progression du client
 *  - `essential` dit à Clément si le dossier est exploitable, même incomplet
 */
export function overallProgress(answers: Record<string, string>) {
  const filled = ALL_FIELDS.filter(f => isFilled(answers, f.key)).length
  const essentialFilled = ESSENTIAL_FIELDS.filter(f => isFilled(answers, f.key)).length
  return {
    filled,
    total: ALL_FIELDS.length,
    percent: ALL_FIELDS.length ? Math.round((filled / ALL_FIELDS.length) * 100) : 0,
    essentialFilled,
    essentialTotal: ESSENTIAL_FIELDS.length,
  }
}

/** Export texte de tout le dossier — pour coller dans une note, un brief ou un chat. */
export function answersToMarkdown(
  companyName: string,
  answers: Record<string, string>,
  files: { slot: string; name: string; size: number }[] = [],
): string {
  const out: string[] = [`# Onboarding — ${companyName}`, '']
  for (const section of ONBOARDING_SECTIONS) {
    const answered = section.fields.filter(f => isFilled(answers, f.key))
    if (!answered.length) continue
    out.push(`## ${section.title}`, '')
    for (const f of answered) {
      out.push(`**${f.label}**`, '', answers[f.key].trim(), '')
    }
  }
  if (files.length) {
    out.push('## Documents', '')
    for (const slot of UPLOAD_SLOTS) {
      const inSlot = files.filter(f => f.slot === slot.key)
      if (!inSlot.length) continue
      out.push(`**${slot.label}**`, '')
      for (const f of inSlot) out.push(`- ${f.name} (${Math.round(f.size / 1024)} Ko)`)
      out.push('')
    }
  }
  return out.join('\n')
}
