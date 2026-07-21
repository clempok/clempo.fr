# Clempo.fr — Site personnel de Clément Pouget-Osmont

## Projet
Site vitrine + blog de Clément Pouget-Osmont, freelance Healthcare Marketing Director.
URL : **https://www.clempo.fr**

## Stack technique
- **Framework** : React 19 + TypeScript 5.9
- **Build** : Vite 8
- **Styling** : Tailwind CSS 4 + CSS custom (index.css)
- **Routing** : React Router DOM 7 (3 routes)
- **Icons** : Lucide React
- **Hébergement** : Netlify (site ID : `266ec893-0de7-4f86-9559-e80fa4a1e3d7`)
- **Fonctions serverless** : Netlify Functions (Resend pour l'envoi d'email)

## Déploiement
```bash
cd "/Users/clemos/Desktop/clempo-fr"
npm run build
netlify deploy --prod --dir=dist --site=266ec893-0de7-4f86-9559-e80fa4a1e3d7 --auth=nfp_9Cc7Fse9W6KMC4EQCXdttnirJi1hMVro6096
```

## Workflow Git
**Repo solo (un seul mainteneur). Le workflow standard est `commit + push direct sur main`** — pas de PR, pas de feature branch. Netlify auto-deploy à chaque push sur main. Pas besoin de demander permission ni d'ouvrir de PR : c'est la convention assumée du projet. Rollback en 1 clic via le dashboard Netlify si besoin.

⚠️ **NE PAS confondre** avec le projet Sofia Design Studio (site ID : `d836dda9-1795-4220-868f-380f4d2034d4`, dossier `/Users/clemos/Desktop/Claude - Design/`). Ce sont deux projets distincts.

## Architecture
```
src/
├── App.tsx                    # Router principal (3 routes)
├── index.css                  # Styles globaux, animations, loader, cursor
├── main.tsx                   # Point d'entrée React
├── components/
│   ├── Background.tsx         # Blobs décoratifs animés
│   ├── Footer.tsx             # Pied de page avec contact
│   ├── LiquidCursor.tsx       # Curseur custom (desktop uniquement)
│   └── Navbar.tsx             # Navigation (FR/EN switch, liens)
├── contexts/
│   └── LangContext.tsx        # Contexte i18n (français/anglais)
├── data/
│   └── articles.ts            # 15 articles (contenu HTML inline)
├── i18n/
│   └── translations.ts       # Traductions FR/EN pour toute l'UI
└── pages/
    ├── Home.tsx               # Page d'accueil (hero, about, accompagnements, media, articles, brochure)
    ├── Articles.tsx           # Liste des articles (2 sections)
    └── ArticlePage.tsx        # Page article individuelle
```

## Routes
| Path | Composant | Description |
|------|-----------|-------------|
| `/` | `Home` | Landing page complète |
| `/articles` | `Articles` | Liste articles en 2 sections |
| `/articles/:slug` | `ArticlePage` | Article individuel |

## Pages et sections clés

### Home (`/`)
1. **Hero** — Nom, titre "Healthcare Marketing Director", CTAs
2. **Marquee clients** — Défilement logos clients (Doctolib, Kiro, etc.)
3. **À propos** — "I'm not a marketer" + photo + 3 paragraphes
4. **Accompagnements** — 3 blocs (Early Stage, Scaleup, ETI/Grand groupe) + CTA "Voyons ce que je peux faire pour vous"
5. **Médias** — 3 interventions (Silicon Carne, Asian HHM, ComptaSanté)
6. **Articles teaser** — 3 derniers articles + lien vers /articles
7. **Brochure** — Formulaire de téléchargement PDF (Netlify Forms + Resend)

### Articles (`/articles`)
- 2 sections distinctes :
  - **"Analyses des systèmes de santé"** — articles dont le slug commence par `systeme-sante`
  - **"Conseils marketing appliqués à la santé"** — tous les autres articles

## Design system — Brand Book 2026 « ClearSharpHealthcare »

⚠️ Space Grotesk et le bleu `#1A1A6B` appartiennent à l'ancienne charte. Ils ne
sont plus chargés dans `index.html` : ne pas les réintroduire. Les tokens vivent
dans `:root` de `src/index.css`, les pages récentes (`InfluenceursSante`,
`DecideursHospitaliers`, `QuotePage`, `Onboarding`) sont la référence.

- **Ink** `#0A0A0B` (couleur principale, souvent nommée `ACCENT` en local)
- **Paper** `#EDEBE4` (fond de page) · **Paper soft** `#F4F4F2` (blocs, champs)
- **Signal** `#00D68F` (accent vert) · **Signal deep** `#009E68` (sur fond clair)
- **Steel** `#6B6F7A` (texte secondaire) · **Border** `rgba(10,10,11,0.08)`
- **Fonts** : Inter (`--font-sans`, corps), Instrument Serif (`--font-serif`,
  titres en graisse 400), JetBrains Mono (`--font-mono`, eyebrows et chiffres)
- **Radius** : 4px (`--cb-radius`), 8px (`--cb-radius-md`). Charte anguleuse,
  pas de pilules ni de coins à 16/24px.
- Classes utilitaires prêtes : `.cb-btn--primary/signal/ghost`, `.cb-card`,
  `.cb-eyebrow`, `.cb-reveal`, `.cb-wordmark`

Les variables « legacy » (`--accent`, `--bg-off`, `--radius`) subsistent pour
`/articles` et `/booking`, pas encore migrés.

## 15 articles
8 analyses systèmes de santé (États-Unis, Canada/Mexique, Europe, Asie, Moyen-Orient, Afrique, Amérique du Sud, Australie/NZ) + 7 articles marketing santé.

Chaque article a : `slug`, `title`, `excerpt`, `category`, `date`, `readingTime`, `metaDescription`, `heroImage`, `content` (HTML).

## Traductions
Fichier `src/i18n/translations.ts` avec clés FR et EN. Utiliser `t('section', 'key')` via le hook `useLang()`.

Sections de traduction : `nav`, `hero`, `about`, `articles_section`, `articles_page`, `media`, `brochure`, `article_page`, `footer`.

## Fichiers publics importants
- `/public/CPO-Services-2026.pdf` — Brochure services (générée par `generate_brochure.py`)
- `/public/media-*.jpeg` — Images des interventions médias
- `/public/sitemap.xml`, `/public/robots.txt` — SEO

## Netlify Functions
- `netlify/functions/submission-created.ts` — Envoi d'email via Resend quand le formulaire brochure est soumis
- Variable d'env requise : `RESEND_API_KEY` (configurée dans Netlify)
- Email destinataire : `clement.pougetosmont@gmail.com`

## Onboarding client (`clempo.fr/<slug>` + onglet Admin)

Portail que le client remplit après signature : questionnaire en 9 sections,
chacune terminée par ses propres emplacements de dépôt (le BP se dépose pendant
qu'on parle de l'entreprise, les créas pendant qu'on parle des campagnes). Un
espace par client, créé depuis `/admin` → **Onboarding**.

| Fichier | Rôle |
|---------|------|
| `src/lib/onboarding-schema.ts` | **Source unique** des questions et des slots d'upload |
| `src/lib/onboarding-files.ts` | Découpage / recollage des fichiers |
| `src/pages/Onboarding.tsx` | Page client (route attrape-tout `/:slug`) |
| `src/pages/adminOnboarding.tsx` | Onglet admin |
| `netlify/functions/_onboarding.ts` | Types, store Blobs, code d'accès, anti brute-force |
| `netlify/functions/onboarding.ts` | API publique (code requis à chaque appel) |
| `netlify/functions/admin-onboarding.ts` | API admin (Bearer `ADMIN_PASSWORD`) — dont `set-schema` / `reset-schema` |
| `netlify/functions/admin-onboarding-generate-background.ts` | Génère un questionnaire sur mesure via Claude (`ANTHROPIC_API_KEY`). **Fonction background** : Claude > 10 s = 504 en synchrone. Écrit le résultat sous `gen/<clientId>` ; l'admin poste puis poll `generation-status`. |

**Questionnaire sur mesure** : un client peut porter son propre `schema`
(`OnboardingClient.schema`) au lieu du standard. Généré depuis son contexte
(devis signé, enjeux) puis retouché dans l'admin → onglet Onboarding → fiche
client → **Personnaliser**. `resolveSections(schema)` renvoie le schéma du
client ou `ONBOARDING_SECTIONS` à défaut ; la page client et l'admin passent
tous deux par là. Le front (source unique du standard) envoie `ONBOARDING_SECTIONS`
à la fonction de génération ; la sortie de l'IA **et** l'éditeur admin passent
par `sanitizeSchema` (dans `_onboarding.ts`) avant stockage, pour qu'un schéma
malformé ne casse jamais la page client. Modèle Claude : `claude-sonnet-4-6`
(mêmes en-têtes que `admin-classify-company.ts`).

La génération produit aussi `contextSummary` (« Ce que j'ai compris de votre
projet », affiché en tête de la page client) et `prefill` (brouillons de réponses
seedés dans `client.answers`, uniquement pour les champs **texte** — jamais les
listes — via `prefillableKeys`). `set-schema` ne seed que les réponses vides et
mémorise `client.prefilledKeys` (pastille « à vérifier » côté client). Dès que le
client édite un champ pré-rempli, le save public retire sa clé de `prefilledKeys`.
`ensureContextField` garantit le champ d'ajustement du contexte en tête de la 1re
section. Voir [[reference_netlify_function_timeout_llm]] (mémoire) pour le pattern
background + poll.

**Accès client** : code à 6 caractères généré à la création, mémorisé en
localStorage côté client. 15 échecs en 15 min → 429 sur ce slug.

**Fichiers** : une fonction Netlify plafonne à ~6 Mo par requête *et* par
réponse. Le navigateur découpe donc en morceaux de 3 Mo (`CHUNK_BYTES`, à garder
identique des deux côtés) et les recolle au téléchargement. Plafond 100 Mo.

**Ajouter une question** : éditer `ONBOARDING_SECTIONS` dans
`src/lib/onboarding-schema.ts`. Ne **jamais** renommer une `key` déjà en prod —
les réponses sont indexées dessus et deviendraient orphelines ; reformuler
`label` à la place. Même règle pour les `key` de `UPLOAD_SLOTS` : un fichier
porte la clé de son emplacement, la renommer le rend invisible dans l'admin.
Une section propose les emplacements listés dans son champ `uploads`.

⚠️ `netlify dev` lit et **écrit les blobs de production**. Tester l'onboarding
en local crée de vrais espaces client : utiliser un slug jetable et le
supprimer, jamais toucher à un espace réel.

**Routing** : `/:slug` est un attrape-tout placé en dernier dans `App.tsx`.
Tout nouveau segment de premier niveau doit être ajouté à `SITE_SEGMENTS`
(`App.tsx`) **et** à `RESERVED_SLUGS` (`_onboarding.ts`), sinon la vraie page
masque l'onboarding et la création de slug n'est pas refusée.

## Liens externes utilisés dans le site
- **Calendrier RDV** : `https://app.lemcal.com/@clementpougetosmont/30minutes`
- **LinkedIn** : `https://www.linkedin.com/in/clementpougetosmont/`
- **Email** : `clement.pougetosmont@gmail.com`

## Instructions pour les modifications courantes

### Ajouter un article
1. Ouvrir `src/data/articles.ts`
2. Ajouter un objet article au tableau `articles` avec tous les champs requis
3. Le slug détermine la section : `systeme-sante-*` → section santé, sinon → section marketing
4. Build + deploy

### Modifier les textes de l'UI
1. Ouvrir `src/i18n/translations.ts`
2. Modifier les clés FR et EN correspondantes
3. Build + deploy

### Modifier le design/layout
1. Styles inline dans les composants React (Home.tsx principalement)
2. Animations et styles globaux dans `src/index.css`
3. Variables CSS dans `:root` de index.css

---
---

# 🔍 SEO — Audit et recommandations (mis à jour le 2 avril 2026)

> Score SEO estimé : **55/100** (progression : 12 → 38 → 55)
> Objectif : ranker en page 1 sur "marketing santé" et variantes

---

## 🎯 Mots-clés cibles

| Mot-clé | Volume est. | Page cible | Statut |
|---------|-------------|------------|--------|
| marketing santé | 720/mois | `/` + article pilier à créer | ⬜ Article à créer |
| consultant marketing santé | 170/mois | `/consultant-marketing-sante` | ⬜ Page à créer |
| freelance marketing santé | 50/mois | `/consultant-marketing-sante` | ⬜ Page à créer |
| marketing digital santé | 320/mois | `/articles/guide-marketing-digital-sante` | ⬜ Article à créer |
| marketing healthtech | 90/mois | `/` | ✅ Existant |
| stratégie marketing pharma | 110/mois | `/articles/strategie-marketing-pharma` | ⬜ Article à créer |
| SEO santé | 90/mois | `/articles/seo-healthtech` | ⬜ Article à créer |
| CMO freelance santé | 30/mois | `/consultant-marketing-sante` | ⬜ Page à créer |
| système de santé USA | 260/mois | `/articles/systeme-sante-etats-unis` | ✅ Existant |
| système de santé Europe | 210/mois | `/articles/systeme-sante-europe` | ✅ Existant |
| lead generation santé | 40/mois | `/articles/generer-leads-ia-healthtech-2025` | ✅ Existant |
| outils marketing santé | 30/mois | `/articles/17-outils-generer-leads-startup-sante` | ✅ Existant |

---

## 🔴 Corrections prioritaires (P0 — CRITIQUE)

### Conflit de domaine canonique www / non-www
- Google indexe des pages sur `clempo.fr` ET `www.clempo.fr` → l'autorité est divisée en deux
- Les anciennes URLs (`/les-systemes-de-sante-en-europe`, `/le-systeme-de-sante-des-etats-unis`) sont encore indexées sur `clempo.fr` sans www
- **Action** : Forcer `www.clempo.fr` comme canonique. Ajouter `<link rel="canonical">` sur chaque page.
- **Où agir** : DNS Netlify + `public/_redirects` ou `netlify.toml`

### Anciennes URLs zombies encore indexées
Ajouter ces redirections 301 dans `public/_redirects` :
```
/les-systemes-de-sante-en-europe      /articles/systeme-sante-europe       301
/le-systeme-de-sante-des-etats-unis   /articles/systeme-sante-etats-unis   301
/systeme-sante-monde                  /articles                            301
/systemes-sante-incription            /articles/systeme-sante-europe       301
/a-propos                             /#about                              301
```

---

## 🟡 Améliorations importantes (P1 — ÉLEVÉ)

### Titles et meta-descriptions à optimiser
- **Page `/`** : Title actuel trop long (77 car., Google tronque à ~60)
  - **Recommandé** : `Expert Marketing Santé Freelance — Clempo | HealthTech & MedTech` (62 car.)
  - **Meta desc** : `Clément Pouget-Osmont, directeur marketing santé freelance. 12 ans d'expérience dont 5 chez Doctolib. Part-Time CMO et coaching pour startups santé.` (155 car.)
  - **Où** : balise `<title>` et `<meta name="description">` dans `index.html` ou via React Helmet dans `Home.tsx`
- **Page `/articles`** : Title trop long aussi
  - **Recommandé** : `Blog Marketing Santé & Systèmes de Santé Monde — Clempo` (55 car.)
- **Articles individuels** : Titles et meta-desc déjà bons ✅ (vérifier via `metaDescription` dans `articles.ts`)

### Créer la page transactionnelle `/consultant-marketing-sante`
C'est le chaînon manquant pour ranker sur les mots-clés business. À implémenter :
1. Créer `src/pages/ConsultantMarketingSante.tsx`
2. Ajouter la route dans `App.tsx` : `<Route path="/consultant-marketing-sante" element={<ConsultantMarketingSante />} />`
3. Ajouter les traductions dans `translations.ts`
4. Contenu requis :
   - **H1** : "Consultant Marketing Santé Freelance"
   - Détail des 3 offres (Early Stage, Scaleup, ETI/Grand groupe)
   - Liste des clients avec résultats chiffrés
   - Témoignages
   - FAQ SEO ("Qu'est-ce qu'un consultant marketing santé ?", "Combien coûte un CMO freelance ?")
   - CTA Lemcal
   - 1 500-2 000 mots minimum

---

## 🔵 Fondation SEO (P2 — MOYEN)

### Données structurées Schema.org
Injecter en JSON-LD dans le `<head>` (via un composant React `<SEOHead>` ou directement dans `index.html`).

**Homepage — ProfessionalService :**
```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Clempo — Marketing Santé",
  "description": "Consultant marketing santé freelance spécialisé HealthTech, MedTech & Pharma",
  "url": "https://www.clempo.fr",
  "founder": {
    "@type": "Person",
    "name": "Clément Pouget-Osmont",
    "jobTitle": "Healthcare Marketing Director",
    "url": "https://www.linkedin.com/in/clementpougetosmont/"
  },
  "areaServed": "FR",
  "address": { "@type": "PostalAddress", "addressLocality": "Saint-Ouen-sur-Seine", "addressCountry": "FR" }
}
```

**Chaque article — Article :**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "TITRE",
  "author": { "@type": "Person", "name": "Clément Pouget-Osmont" },
  "datePublished": "DATE",
  "image": "URL_IMAGE",
  "description": "META_DESCRIPTION"
}
```

**Articles avec FAQ — FAQPage :**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } }
  ]
}
```

### Maillage interne
Dans `src/data/articles.ts`, pour chaque article existant, enrichir le champ `content` avec :
- 2-3 liens `<a href="/articles/autre-slug">` vers d'autres articles pertinents
- Un lien vers `/consultant-marketing-sante` (quand elle existera) dans l'intro ou conclusion

### Sitemap et robots.txt
- Mettre à jour `/public/sitemap.xml` pour lister TOUTES les URLs (15 articles + `/` + `/articles` + future `/consultant-marketing-sante`)
- Vérifier `/public/robots.txt` contient `Sitemap: https://www.clempo.fr/sitemap.xml`

---

## 🟢 Articles à créer (P3)

| Article | Slug | Mots-clés |
|---------|------|-----------|
| Le guide complet du marketing digital en santé (2026) | `guide-marketing-digital-sante` | marketing digital santé, marketing santé |
| SEO pour startups santé : comment ranker quand on vend aux médecins | `seo-healthtech` | SEO santé, référencement santé |
| Stratégie marketing pharma 2026 | `strategie-marketing-pharma` | marketing pharma |
| Marketing MedTech : comment vendre un dispositif médical | `marketing-medtech` | marketing medtech |
| Comment l'IA transforme le marketing en santé | `ia-marketing-sante` | IA santé marketing |

Ajouter dans `src/data/articles.ts` au format existant. Ces articles NE commencent PAS par `systeme-sante` donc ils iront dans la section "Conseils marketing" de `/articles`.

---

## ✅ Checklist SEO pour chaque nouvelle page

```
□ Title < 60 caractères, contient le mot-clé cible
□ Meta description 120-155 caractères, contient le mot-clé
□ H1 unique, contient le mot-clé principal
□ <link rel="canonical" href="https://www.clempo.fr/[path]">
□ Au moins 1 image avec alt text descriptif
□ Liens internes : 2+ vers d'autres pages du site
□ CTA Lemcal en bas de page
□ Schema.org JSON-LD (Article + FAQPage si FAQ)
□ URL slug court et descriptif
□ Auteur "Clément Pouget-Osmont" + date
□ Ajouté au sitemap.xml
□ Pas de casse d'URL sans redirection 301 dans public/_redirects
```

## ⚠️ Règles SEO obligatoires pour Claude Code

1. **Ne JAMAIS supprimer ou renommer une URL** sans ajouter une redirection 301 dans `public/_redirects`
2. **Toujours utiliser `www.clempo.fr`** comme domaine canonique
3. **Toujours mettre à jour `public/sitemap.xml`** après ajout de pages
4. **Les slugs d'articles marketing** ne commencent PAS par `systeme-sante` (sinon ils sont classés dans la mauvaise section)
5. **Ton des articles** : expert, accessible, direct, pas corporate. Vouvoiement. Style "insider santé".
6. **CTA standard** : lien Lemcal `https://app.lemcal.com/@clementpougetosmont/30minutes`

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
