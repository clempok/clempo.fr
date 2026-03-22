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

## Design system
- **Couleur principale** : `#1A1A6B` (bleu foncé, variable `ACCENT`)
- **Background** : `#FFFFFF` (blanc)
- **Background off** : `#F8F8F6` (gris clair pour les blocs)
- **Texte** : `#0A0A0A`
- **Texte muted** : `#71717A`
- **Border** : `rgba(0,0,0,0.06)`
- **Fonts** : Inter (body), Space Grotesk (titres)
- **Radius** : 16px (standard), 24px (grands blocs)

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
