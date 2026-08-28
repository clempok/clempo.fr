# Kit de reproduction du back office Sales & Marketing

> **Mode d'emploi (pour l'humain)** : placez ce fichier dans un dossier vide, ouvrez
> Claude Code dans ce dossier, et écrivez : « Lis KIT-REPRODUCTION.md et démarre la
> Phase 0 ». Claude vous posera d'abord un questionnaire de cadrage, proposera un
> périmètre, puis construira le système lot par lot. Comptez plusieurs sessions.

---

## Ta mission (pour Claude)

Tu vas construire un **back office Sales & Marketing complet** pour l'entreprise de
ton interlocuteur, sur le modèle du système en production sur clempo.fr, testé et
éprouvé sur des entreprises qui réalisent plusieurs millions d'euros de chiffre
d'affaires : un site à fort SEO, un CRM avec analytics, des séquences d'emails
automatiques, et un rituel de prospection LinkedIn assisté. Ce fichier est ta source d'architecture : il décrit ce
qui marche, les choix techniques éprouvés, et surtout les pièges déjà rencontrés en
production (Annexe A). Respecte-les.

**Règles de conduite :**

1. **Phase 0 d'abord, toujours.** Ne crée aucun fichier avant d'avoir terminé le
   questionnaire, reformulé le contexte et fait valider le périmètre et le plan de lots.
2. **Construis par lots courts**, chacun déployé et vérifié avant le suivant. Le site
   doit être en ligne dès la fin de la Phase 1.
3. **Les emails démarrent en répétition générale** (dry-run vers l'opérateur). Le
   passage en réel est une décision explicite de l'humain, jamais la tienne.
4. **Aucun secret dans le code.** Pas de mot de passe en dur, pas de fallback de mot de
   passe, pas de clé API commitée. Tout passe par les variables d'environnement Netlify.
5. **Jamais d'URL cassée** : toute URL publiée un jour reçoit une redirection 301 si
   elle change.
6. **Écris le CLAUDE.md du nouveau repo au fil de l'eau** (architecture, conventions,
   checklists), pas à la fin. C'est lui qui rendra le système maintenable.
7. **Typographie des textes français** : pas de tiret cadratin ni demi-cadratin.
   Préférer la virgule, les parenthèses, ou deux phrases.
8. **Adapte, ne copie pas aveuglément.** Le questionnaire décide des modules. Un client
   sans lead magnet n'a pas besoin du moteur NPS ; un client sans mission de conseil n'a
   pas besoin des devis signables.

---

## Phase 0 : questionnaire de cadrage

Pose ces questions **bloc par bloc** (pas les 4 blocs d'un coup), en proposant des
choix quand c'est possible. Note les réponses dans un fichier `CADRAGE.md` à la racine :
il servira de référence pendant toute la construction.

### Bloc 1 : identité et offre

1. Nom de l'entreprise, nom de domaine visé (ou existant), site actuel éventuel.
2. Que vendez-vous, en une phrase ? À qui (métier, taille, secteur des clients visés) ?
3. Les 2 ou 3 offres à mettre en avant, avec leur prix ou fourchette si publiable.
4. Qui est le visage public du système (dirigeant, fondateur) ? URL LinkedIn, email,
   téléphone à afficher.
5. Preuves disponibles : clients références, chiffres, passages médias, témoignages.

### Bloc 2 : cible et acquisition

6. **Cible LinkedIn précise**, en trois listes (elles paramètrent le filtre du skill
   LinkedIn) :
   - (A) les intitulés de poste (ex. pour le secteur du domicile : Directeur, Directrice,
     Fondateur, CEO, Responsable de secteur, Cadre de santé) ;
   - (B) les mots-clés secteur dans le nom d'entreprise ou le headline (ex. SAAD, SSIAD,
     HAD, aide à domicile, maintien à domicile, médico-social, autonomie, CCAS) ;
   - (C) une liste blanche d'entreprises cibles nommées (bypass du filtre secteur).
7. **Lead magnet** : quelle ressource à forte valeur pouvez-vous offrir contre un
   email ? (une base de contacts sectorielle, un benchmark chiffré, un guide, un
   modèle de document). Sous quel format (Google Sheet, PDF, Excel) ?
8. Prise de RDV : un Google Calendar est-il disponible ? Sur quelle adresse ?
   Durée du RDV type ?
9. Volumes attendus au démarrage : combien de leads/mois espérés, combien d'emails/jour
   maximum acceptables ? (dimensionne les plafonds, voir Phase 7)
10. Le message de prospection : y a-t-il déjà un template de DM qui fonctionne ?
    Sinon, en co-rédiger un en Phase 8 (sobre, sans lien commercial au premier contact).

### Bloc 3 : marque et contenu

11. Charte graphique existante (couleurs, typos, logo) ou à créer ? Si à créer,
    demander 3 adjectifs de positionnement et 2 ou 3 sites admirés.
12. Langue(s) du site : FR seul ou FR + EN ?
13. Ton éditorial : expert, institutionnel, direct ? Vouvoiement ou tutoiement ?
14. Y a-t-il du contenu existant à reprendre (articles, plaquette, posts LinkedIn) ?

### Bloc 4 : périmètre et opérations

15. **Modules à inclure** (proposer la liste, cocher) :
    - [ ] Site vitrine + pages offres (socle, toujours inclus)
    - [ ] Blog SEO
    - [ ] Lead magnet(s) avec capture d'email
    - [ ] Prise de RDV maison (Google Calendar)
    - [ ] CRM + analytics + funnel (socle, toujours inclus)
    - [ ] Emails automatiques (livraison, nurture, NPS, rappels, digest)
    - [ ] Skill de prospection LinkedIn
    - [ ] Devis en ligne signables
    - [ ] Portails d'onboarding client
    - [ ] Enrichissement Dropcontact
    - [ ] Classification IA des sociétés
    - [ ] Miroir Notion
16. Qui opère au quotidien (valide les DM, lit le digest, fait les RDV) ? Cette
    personne a-t-elle Claude Code + Chrome + l'extension Claude in Chrome ?
17. Comptes existants : GitHub, Netlify, Resend, Anthropic ? Sinon, lister ce que
    l'humain doit créer (voir Annexe C), toi tu ne crées jamais de comptes.
18. Contraintes du secteur : mentions légales spécifiques, règles de communication
    (santé, médico-social, finance), RGPD (registre de traitement existant ?).

### Sortie de la Phase 0

Avant tout code, produis et fais valider :

1. **La reformulation** : « Voici ce que j'ai compris de votre activité et de votre
   cible » (10 lignes max).
2. **Le périmètre retenu** : modules inclus / exclus, avec une phrase de justification
   par exclusion.
3. **Le plan de lots** : l'ordre des Phases 1 à 9 adapté au périmètre, avec ce qui
   sera visible en ligne à la fin de chaque lot.
4. **La liste des actions humaines préalables** : comptes à créer, domaine à acheter,
   DNS à déléguer, accès à fournir (voir Annexe C).

---

## Phase 1 : fondations

**Stack imposée** (éprouvée, ne pas substituer sans raison forte) :

- React 19 + TypeScript, Vite, Tailwind CSS 4, React Router 7, react-helmet-async,
  lucide-react pour les icônes.
- Hébergement Netlify : site statique + fonctions serverless + Netlify Blobs (stockage)
  + Netlify Forms (formulaires) + fonctions planifiées (crons).
- Emails : Resend, appelé en `fetch` direct (pas de SDK nécessaire).
- Repo GitHub, déploiement automatique sur push de la branche principale.

**À faire :**

1. Scaffold Vite + React + TS, Tailwind, Router. Arborescence :

```
src/
├── App.tsx              # Router client + constante SITE_SEGMENTS
├── entry-server.tsx     # Router SSR (prérendu), à tenir synchro avec App.tsx
├── index.css            # Tokens de charte dans :root, styles globaux
├── components/          # SEO.tsx (Helmet), Navbar, Footer, formulaires
├── pages/               # Une page = un fichier
├── lib/                 # Constantes partagées côté front
├── data/                # Articles (contenu inline), données
netlify/
├── functions/           # Une fonction = un fichier ; modules partagés préfixés _
scripts/
├── prerender.js         # Prérendu statique post-build
public/
├── sitemap.xml, robots.txt, _redirects, images
```

2. Tokens de charte dans `:root` de `index.css` (couleurs, 2 ou 3 fontes, radius),
   selon le Bloc 3. Petit nombre de classes utilitaires (bouton primaire, carte,
   eyebrow) plutôt que des styles dispersés.
3. `netlify.toml` : build (`npm run build`), publish `dist`, functions
   `netlify/functions`, SPA fallback `/* → /index.html 200`, redirection 301 forcée
   du domaine non canonique vers le canonique (choisir www ou apex une fois pour
   toutes), headers de sécurité (X-Frame-Options, nosniff, Referrer-Policy), cache
   long sur `/assets/*`.
4. Script de build complet :
   `tsc -b && vite build && vite build --ssr src/entry-server.tsx --outDir dist/server && node scripts/prerender.js`
5. `prerender.js` : rend chaque route publique en HTML via le bundle SSR, remonte les
   balises Helmet dans le `<head>` et **retire du template les balises statiques
   qu'elles remplacent, y compris `og:image`** (les scrapers de liens retiennent la
   première occurrence).
6. Repo GitHub créé par l'humain, lié à Netlify, premier deploy d'une page « en
   construction » à la charte. Vérifier le domaine + HTTPS + la redirection canonique.
7. Démarrer le `CLAUDE.md` du repo : stack, commandes, convention de déploiement,
   et la **checklist « ajouter une page »** (Annexe B).

---

## Phase 2 : site public + SEO

1. **Pages du socle** : Home (hero, preuves, offres, CTA RDV), page(s) offre
   détaillée(s) pensées pour les mots-clés transactionnels du secteur, mentions
   légales + politique de confidentialité.
2. **Blog** si retenu : les articles vivent dans `src/data/articles.ts` (objets avec
   slug, title, excerpt, metaDescription, date, contenu HTML inline). Une page liste,
   une page article.
3. **Composant `<SEO>`** utilisé par chaque page : title < 60 caractères, meta
   description 120 à 155, canonical absolu sur le domaine canonique, Schema.org
   JSON-LD (ProfessionalService sur la home, Article sur les articles, FAQPage si FAQ).
4. `sitemap.xml` exhaustif, `robots.txt` avec la ligne Sitemap et `Disallow: /admin`.
5. Soumission à Google Search Console (action humaine, la guider).

⚠️ À chaque page ajoutée, dérouler la checklist « ajouter une page » (Annexe B) :
la route existe dans **deux routeurs** (client et SSR) plus le prerender et le sitemap.
L'oubli du routeur SSR ne casse rien à l'écran mais supprime le SEO de la page.

---

## Phase 3 : socle serverless (fonctions + stockage + admin)

**Patterns à respecter dans `netlify/functions/` :**

- Modules partagés **préfixés `_`** (`_crm.ts`, `_analytics.ts`, ...) : jamais exposés
  en HTTP, importés par les endpoints. Les fonctions ne peuvent **pas** importer depuis
  `src/` : une constante nécessaire des deux côtés (catalogue de ressources, tailles de
  chunk) existe en deux copies, back et front, avec un commentaire croisé « tenir
  synchro avec <chemin> » dans chacune.
- **Netlify Blobs** : un store par domaine fonctionnel, un blob JSON `data` par store
  comme document principal.

| Store | Contenu |
|---|---|
| `analytics` | Visites/jour, sources, pages, événements de lead |
| `analytics-bots` | Journal des visites rejetées + compteurs de rate-limit |
| `crm` | Sociétés, contacts, tâches |
| `email-templates` | Templates éditables |
| `email-tracking` | Envois + événements open/click |
| (selon modules) | `quotes`, `onboarding`, `seo`, `secrets` |

- **Écriture = read-modify-write sans verrou.** C'est assumé pour un système
  mono-opérateur, à deux conditions : décaler les horaires des crons qui écrivent sur
  le même store, et ne jamais faire d'I/O avant les validations (voir le filtre
  anti-bot, Phase 4).
- **Auth admin** : endpoints `admin-*` protégés par `Authorization: Bearer
  <ADMIN_PASSWORD>`, helper unique dans un module partagé. **Aucun fallback en dur** :
  si la variable n'est pas définie, la fonction répond 500 avec un message explicite.
  Prévoir un second mot de passe optionnel révocable (`ADMIN_PASSWORD_2`) pour un
  collaborateur.
- **Timeout : 10 secondes** par fonction synchrone. Tout appel long (LLM, API
  d'enrichissement, sync externe) suit le pattern **background + poll** : une fonction
  suffixée `-background` (budget 15 min) écrit son résultat dans un blob
  `gen/<jobId>`, et le front interroge un endpoint de statut.
- **Corps de requête et de réponse : ~6 Mo max.** Tout transfert de fichier passe par
  un chunking à 3 Mo, avec la même constante des deux côtés.

**Page `/admin`** : une seule page React, mot de passe demandé à l'entrée et gardé en
`sessionStorage`, onglets (Analytics, CRM, Contenus, Emails, + modules). Route exclue
du prerender, du sitemap et du tracking.

---

## Phase 4 : analytics (suivi du trafic)

**Côté client**, un composant `VisitTracker` monté dans `App.tsx` :

- Envoie `POST /.netlify/functions/track-visit` avec `{date, path, src, ref}`
  (`keepalive: true`).
- `src` : paramètre `?src=` posé sur tous les CTA internes et les liens publiés
  (LinkedIn, signature email), via un helper unique `bookingUrl(src)`.
- `ref` : referrer normalisé (regrouper les variantes de Google, séparer Google Search
  de Gmail pour pouvoir croiser avec Search Console), résolu une fois par session.
- Dédoublonnage par `sessionStorage` (clé jour + path + src).
- N'émet rien sur `/admin`, sur les espaces privés, ni depuis un navigateur automatisé
  (`navigator.webdriver`, UA contenant Claude/Anthropic/headless).

**Côté serveur** (`track-visit.ts`), le **filtre anti-bot passe en premier, avant toute
lecture du store** (raison : ne pas payer d'I/O pour du spam, et ne pas corrompre les
stats). Rejet sur les en-têtes uniquement, le body étant forgeable :

| Rejet | Règle |
|---|---|
| UA absent, < 20 caractères, sans `Mozilla/`, ou contenant bot/crawler/headless | User-Agent |
| Origin (fallback Referer) hors du domaine du site | Origine |
| En-tête `Accept-Language` absent | Vrai navigateur ? |
| Plus de 40 visites/jour depuis la même IP | Rate-limit, IP hachée avec sel, clé par jour, fail-open |

Les rejets sont comptés dans `analytics-bots` (rétention 60 jours, échantillon d'UA)
et affichés dans l'admin : c'est la preuve que le filtre travaille. Sans ce filtre,
les stats sont inutilisables (constaté en production : 600 fausses visites « google »
par semaine).

**Onglet Analytics de l'admin** : visites/jour, top sources, top pages, et le
**funnel par période** (semaine ISO ou mois) : Impressions LinkedIn → Visites → Leads
→ Opportunités → Clients, avec les taux de passage. Les impressions sont **saisies**
(manuellement dans une cellule, ou poussées par le skill LinkedIn via
`POST admin-data {action:'set_linkedin_impressions'}`) ; les étages Leads et suivants
viennent de l'historique de statuts du CRM (Phase 5).

---

## Phase 5 : CRM

**Modèle de données** (module `_crm.ts`), à adapter aux réponses du Bloc 2 :

```ts
export const CRM_STATUSES = ['Non qualifié','Prospect','Lead','Opportunité','Client','Lost'] as const;
// Priorité : Non qualifié 0 · Prospect 1 · Lead 2 · Opportunité 3 · Client 4 · Lost -1
// Règle : un statut ne redescend JAMAIS (sauf passage explicite en Lost).

interface CrmCompany {
  id: string; name: string; status: CrmStatus;
  contacts: CrmContact[]; tasks: CrmTask[]; notes: string;
  size?: 'Startup'|'Scaleup'|'ETI'|'Grand groupe';   // axes de scoring : à adapter
  location?: string; sector?: string;                 // au secteur du client
  origin?: 'LinkedIn'|'Outbound'|'Réseau'|'Lead Magnet';
  statusHistory: { status: CrmStatus; at: string }[]; // SOURCE DU FUNNEL analytics
  createdAt: string; updatedAt: string;
}

interface CrmContact {
  id: string; email: string; firstName: string; lastName: string;
  source: string; notes: string; linkedIn?: string; phone?: string; jobTitle?: string;
  language: 'FR'|'EN';
  visits: { ts: string; path: string }[];        // 50 max, rattachées par cookie
  npsResponses: CrmNpsResponse[];                // 1 entrée par téléchargement
  emailOptOut?: boolean;
  nurture?: { step3SentAt?: string; step7SentAt?: string;
              step3DryRun?: boolean; step7DryRun?: boolean };
  createdAt: string; updatedAt: string;
}
```

**Fonctions** :

- `admin-crm.ts` : GET (tout le CRM) + POST par actions
  (`create-company`, `update-company`, `create-contact`, `update-contact`,
  `delete-*`, `create-task`, ...). C'est l'API qu'utilisera aussi le skill LinkedIn.
- `upsertContact(email, fields, status)` dans `_crm.ts` : la primitive utilisée par
  tous les points d'entrée (formulaires, booking, skill). Elle déduplique par email,
  ne dégrade jamais un champ rempli, ne rétrograde jamais un statut, et pousse dans
  `statusHistory` à chaque promotion.
- **Scoring /100** : taille + localisation + secteur + niveau hiérarchique du contact
  + engagement (visites, source). Les barèmes sortent du Bloc 2 du questionnaire.

**Options selon périmètre** :

- **Dropcontact** : à la création d'un contact, `autoEnrich: true` fait un submit seul
  (l'API répond en asynchrone, le poll dépasserait les 10 s) et stocke le
  `request_id` ; une action `resolve-pending-enrichments` collecte tous les résultats
  en attente en une passe. Ne jamais écraser une donnée existante.
- **Classification IA** : une fonction admin qui envoie nom + notes de la société à
  l'API Anthropic (modèle Sonnet courant) et renvoie `{size, sector, location,
  confidence}`. Clé `ANTHROPIC_API_KEY` côté Netlify uniquement.

**Onglet CRM de l'admin** : tableau des sociétés (tri, filtres, recherche), fiche avec
contacts, statut cliquable, tâches, score, boutons Enrichir / Classifier.

---

## Phase 6 : capture de leads

**Lead magnet** (le convertisseur principal) :

1. Une page dédiée à la charte : promesse chiffrée, aperçu de la ressource,
   formulaire (prénom, nom, email, société, ± téléphone).
2. Soumission en `POST /` `application/x-www-form-urlencoded` avec
   `form-name=<slug>` : c'est **Netlify Forms** qui capte (prévoir le `<form
   data-netlify hidden>` de déclaration dans le HTML ; Netlify le consomme au deploy,
   c'est normal qu'il disparaisse en prod).
3. Déblocage **immédiat** côté client (état React ou `localStorage`), sans email
   d'activation : le lien vers la ressource s'affiche à l'écran. La ressource gated ne
   doit pas figurer dans le HTML prérendu.
4. Le front pose le cookie `cid = btoa(email)` (365 jours) : les visites suivantes
   sont rattachées au contact via un `track-crm-visit`.

**La fonction `submission-created.ts`** (nom imposé par Netlify, déclenchée à chaque
soumission de formulaire) fait le dispatch par `form_name` et, pour un lead magnet :

1. `recordEvent({type: slug})` dans `analytics` (l'union `LeadEvent` type ce champ).
2. `upsertContact(..., 'Lead')` avec `origin: 'Lead Magnet'` : crée ou promeut, et
   alimente le funnel via `statusHistory`.
3. Arme le NPS J+1 (`addPendingNps`) : c'est aussi le journal des téléchargements.
4. Envoie l'email de livraison (template `resource-delivery`, Phase 7).
5. **Pas d'alerte email unitaire** : tout remonte dans le digest du matin (économie
   du quota Resend). Seule la prise de RDV notifie en temps réel.

**Booking maison** (si retenu) : `get-busy-slots` lit les créneaux occupés Google
Calendar (OAuth refresh token), le front affiche les libres, `book-meeting` crée
l'événement avec `sendUpdates=all` + lien Meet, upsert le contact, ajoute 2 tâches de
suivi au CRM et notifie l'opérateur. Tous les CTA du site pointent vers `/booking?src=...`.

⚠️ Chaque nouveau lead magnet suit la checklist de l'Annexe B (14 points de contact,
dont deux pièges silencieux : le matcher par défaut du catalogue d'emails et l'union
`LeadEvent` dupliquée).

---

## Phase 7 : emails automatiques

**Transporteur : Resend.** L'humain vérifie le domaine (SPF + DKIM + DMARC, guider la
pose des DNS). From : `Prénom Nom <noreply@domaine.fr>`, reply-to : l'adresse réelle
de l'opérateur. Appels en `fetch` direct sur `https://api.resend.com/emails`.

**Templates** stockés dans le store `email-templates`, éditables depuis l'admin
(onglet Emails), avec variables `{{firstName}}`, `{{resourceLabel}}`,
`{{resourceLinksHtml}}`. Un bouton « Test » envoie le rendu à l'opérateur. FR/EN si
bilingue (la langue du contact est détectée : email en `.fr` ou prénom avec
diacritiques → FR).

**Les crons** (fonctions planifiées, `schedule('30 9 * * *', handler)` dans le code de
la fonction ; horaires en UTC, les décaler entre eux pour composer les plafonds) :

| Ordre | Cron (UTC) | Fonction | Rôle |
|---|---|---|---|
| 1 | `0 7 * * *` | digest quotidien | Récap 24 h à l'opérateur : téléchargements, visites de contacts connus, notes NPS |
| 2 | `0 8 * * *` | rappels RDV | Rappel J-1 aux RDV de demain (heure de Paris) |
| 3 | `30 9 * * *` | nurture | J+3 (autres ressources) et J+7 (les offres) après 1er téléchargement |
| 4 | `0 10 * * *` | NPS | Question de satisfaction J+1, note 0 à 10 cliquable dans l'email |

**Le mécanisme clé : des fenêtres d'éligibilité, pas une file d'attente.** Chaque cron
recalcule à chaud qui est éligible : NPS entre J+1 et J+7, nurture step 3 entre J+3 et
J+10, step 7 entre J+7 et J+14. Un cron raté se rattrape tout seul au run suivant.
Un onglet admin « Programmés » peut projeter les prochains envois en rejouant la même
logique (si tu le construis, factorise les constantes de fenêtres dans un module
partagé, ne les duplique pas).

**Plafonds et interrupteurs** (variables d'environnement Netlify) :

| Variable | Rôle | Défaut conseillé |
|---|---|---|
| `NURTURE_MAX_SENDS` | Envois nurture max par run | 30 |
| `NPS_MAX_SENDS` | Envois NPS max par run | 40 |
| `REMINDER_MAX_SENDS` | Rappels RDV max par run | 20 |
| `NURTURE_LIVE`, `NPS_LIVE`, `REMINDER_LIVE` | ≠ '1' ⇒ **dry-run** : tout part chez l'opérateur, flaggé pour ré-envoi réel plus tard | absent au lancement |

Le quota Resend gratuit est de **100 emails/jour tous usages confondus** : la somme
des plafonds doit garder ~25 emails/jour de marge pour les transactionnels
(livraisons, devis, notifications). Si le backlog d'un cron gonfle (pic de
téléchargements), rééquilibrer les plafonds entre crons avant d'augmenter le plan.

**Exclusions systématiques du nurture** : statuts `Opportunité`, `Client`, `Lost`
(on ne relance pas quelqu'un avec qui on parle déjà), `emailOptOut`, et dédup par
email au sein d'un run.

**Tracking maison** (`_email-tracking.ts`) : à l'envoi, réécrire chaque lien vers
`/email-click?id=<sendId>&l=<index>` (redirection par **index** vers une liste
d'URLs stockées, jamais d'URL en paramètre : pas d'open redirect) et ajouter un pixel
`/email-open?id=`. Stocker les événements en blobs vides dont la **clé** porte
l'information (`evt:<sendId>:<ts>:o`), l'agrégation est un simple listing de clés.
Ne jamais tracker les dry-runs.

**Désinscription** : lien en pied de chaque email de séquence + en-tête
`List-Unsubscribe` one-click (RFC 8058). Token HMAC signé par un secret serveur
(`SIGNING_SECRET`), jamais l'email en clair dans l'URL. L'opt-out s'applique à tous
les contacts partageant l'email.

**NPS** : l'email contient les notes 0 à 10 sous forme de liens signés ;
`nps-respond` vérifie le token, écrit le score, redirige vers une page de
remerciement avec champ commentaire. Les scores agrégés par ressource alimentent
l'onglet Contenus.

---

## Phase 8 : skill de prospection LinkedIn

Ce module n'est **pas du code déployé** : c'est un fichier d'instructions
`.claude/skills/linkedin-sync/SKILL.md` dans le repo, que l'opérateur lance chaque
matin via `/linkedin-sync` dans Claude Code. Il pilote le vrai Chrome de l'opérateur
(extension Claude in Chrome, LinkedIn connecté). Génère-le à partir de cette
spécification, paramétré par le Bloc 2 du questionnaire.

**Architecture en 2 phases, séparées par une validation humaine :**

**PHASE 1, SCAN & REPORT (aucun envoi) :**

1. Relever les impressions 7 jours sur `linkedin.com/analytics/creator/content/` et
   les pousser au funnel : `POST admin-data {action:'set_linkedin_impressions',
   dateKey, value}` avec le Bearer admin (lu depuis `.claude/secrets/admin-password.txt`,
   gitignoré).
2. Scanner 3 sources de signaux : **nouvelles connexions** (≤ 24 h), **visiteurs du
   profil** (≤ 24 h), **réactions au dernier post** (plafond 60 réacteurs, et un
   registre `postScans` pour ne jamais rescanner les mêmes personnes).
3. Filtrer : match si (A) titre dans la liste des postes cibles ET ((B) mot-clé
   secteur dans l'entreprise ou le headline OU (C) entreprise en liste blanche).
4. Écrire au CRM via `admin-crm` : créer en `Lead` (origin `Outbound`, email
   placeholder `<slug>@linkedin.placeholder`, `autoEnrich: true` si Dropcontact) ou
   promouvoir ; **ne rien faire si le statut est déjà ≥ Opportunité**.
5. Classer les actions : 1er degré → candidat **DM** ; 2e/3e degré → candidat
   **invitation sans note** + inscription en watchlist. Détecter les invitations
   acceptées (watchlist → 1er degré) : elles deviennent des candidats DM.
6. **Anti-redondance à deux étages, obligatoire** :
   - state file `.claude/state/linkedin-sync.json` (gitignoré) : `dmSent`,
     `proposed` (aucune re-proposition pendant 7 jours, quelle que soit la décision),
     `watchlist`, `postScans`, `dailyCounters` ;
   - **thread-check** : avant de proposer un DM, ouvrir la conversation LinkedIn du
     profil ; si un échange existe depuis moins d'un an → auto-skip (et l'inscrire
     dans `dmSent` rétroactivement). L'opérateur écrit aussi des messages à la main,
     ce check est ce qui évite les doublons embarrassants.
7. Présenter le récap dans le chat : actions CRM faites, DM proposés numérotés avec
   le message exact, invitations proposées, watchlist, rejets. Terminer par :
   « Réponds avec les numéros à envoyer ». **Ne rien envoyer à ce stade.**

**PHASE 2, OUTREACH (après la réponse de l'humain uniquement) :**

- Exécuter les seuls DM/invitations approuvés, un par un, avec vérification visuelle
  (screenshot) avant chaque clic d'envoi.
- **Caps stricts : 10 DM/jour et 10 invitations/jour** (compteurs dans le state
  file), **30 à 60 secondes aléatoires entre chaque action**. Le surplus attend demain.
- Invitations : toujours « sans note ». Si le bouton affiche déjà « En attente »,
  auto-skip et consigner.
- Mettre à jour le state file après chaque action, puis afficher le récap final.

**Règles de sécurité du skill** (à recopier telles quelles) : jamais d'envoi sans
validation explicite ; jamais dépasser les caps ; jamais rétrograder un statut CRM ni
écraser un champ rempli ; en cas d'UI LinkedIn inattendue, abort de l'action, log, on
passe à la suivante ; Chrome non connecté = arrêt total.

**Template de DM** : co-rédigé et validé en Phase 0/8. Structure qui fonctionne :
4 blocs courts séparés par des lignes vides (salutation prénom, une phrase de
contexte, une question ou proposition douce, signature), **sans lien** dans le
premier message.

---

## Phase 9 : recette, go-live, passation

**Recette (sur la prod, avec un email jetable de l'opérateur) :**

- [ ] Formulaire lead magnet : soumission → déblocage à l'écran → fiche CRM en Lead
      → événement analytics → email de livraison reçu.
- [ ] Cookie posé : une visite ultérieure apparaît sur la fiche contact.
- [ ] Filtre anti-bot : un `curl` sans en-têtes est rejeté et compté.
- [ ] Crons en dry-run : les 4 emails du cycle arrivent chez l'opérateur sur 8 jours
      (ou en forçant les dates en base pour accélérer).
- [ ] Booking : créneau → événement Calendar + Meet + notification + rappel J-1 (dry-run).
- [ ] Désinscription one-click : opt-out posé, plus aucun nurture.
- [ ] Redirections : domaine non canonique → canonique, anciennes URLs → 301.
- [ ] Lighthouse et aperçu de lien LinkedIn (og:image unique et correcte).
- [ ] Skill LinkedIn : une PHASE 1 complète à blanc, state file relu, zéro envoi.
- [ ] Sitemap soumis dans Search Console.

**Go-live des emails** : passer les `*_LIVE` à `1` un par un, sur décision humaine,
en commençant par le NPS (le moins risqué), et re-déployer (les variables ne prennent
effet qu'au déploiement suivant).

**Passation** : finaliser le `CLAUDE.md` (architecture, conventions, checklists de
l'Annexe B, plafonds, horaires des crons) ; remettre la liste des accès (Annexe C) ;
dérouler une matinée type avec l'opérateur (digest + `/linkedin-sync`).

---

## Annexe A : les pièges connus (appris en production)

À lire avant de coder, et à recopier dans le CLAUDE.md du nouveau repo.

1. **Timeout 10 s des fonctions synchrones.** Tout appel LLM ou API lente part en
   fonction `-background` (15 min) qui écrit son résultat dans un blob, avec un
   endpoint de poll. Un appel Claude en synchrone = 504 aléatoires.
2. **~6 Mo max par requête ET par réponse de fonction.** Fichiers en chunks de 3 Mo,
   constante identique côté navigateur et côté serveur.
3. **`netlify dev` lit et écrit les blobs de PRODUCTION.** Tout test local qui écrit
   touche les vraies données : utiliser des enregistrements jetables et les supprimer.
4. **Les fonctions ne peuvent pas importer depuis `src/`.** Toute constante partagée
   existe en double (back + front) : la documenter dans les deux fichiers et dans le
   CLAUDE.md, sinon elles divergent en silence.
5. **Les routeurs jumeaux.** La liste des routes existe dans `App.tsx` (client),
   `entry-server.tsx` (SSR), `prerender.js` et `sitemap.xml`. Une page ajoutée dans le
   seul `App.tsx` fonctionne à l'écran mais n'a aucun SEO. D'où la checklist Annexe B.
6. **Le matcher par défaut du catalogue de ressources.** Si le catalogue d'emails a
   une entrée attrape-tout (`slugs: s => !liste.includes(s)`), tout nouveau lead
   magnet doit être ajouté à sa liste d'exclusion ET inséré avant elle dans le
   tableau, sinon il est silencieusement absorbé et le mail J+3 propose la mauvaise
   ressource.
7. **Les unions de types dupliquées** (ex. `LeadEvent` côté fonctions et côté admin).
   Typer les `Record<LeadEvent['type'], ...>` de l'UI pour que le compilateur force la
   mise à jour de la copie.
8. **Ne jamais renommer une `key` déjà en production** (réponses de questionnaire,
   slots d'upload, slugs d'événement) : les données sont indexées dessus et
   deviennent orphelines. Reformuler le `label`, jamais la `key`.
9. **Quota Resend 100/j** : plafonds par cron + fenêtres d'éligibilité + pas
   d'alertes unitaires (tout dans le digest). Somme des plafonds ≤ 75.
10. **Le filtre anti-bot se place AVANT toute I/O** et ne juge que les en-têtes
    (le body est forgeable). Effet de bord assumé : les previews Netlify et localhost
    ne comptent pas de visites (Origin hors domaine).
11. **Read-modify-write sans verrou** : décaler les horaires des crons qui écrivent
    le même store ; jamais deux écritures concurrentes volontaires.
12. **Jamais d'URL cassée sans 301** (`public/_redirects`), et un seul domaine
    canonique forcé dès le premier jour.
13. **Pas de fallback de mot de passe en dur dans le code.** (Oui, ça s'est vu.)
14. **Toute copie de `SITE_SEGMENTS`** (edge function, slugs réservés d'un module à
    catch-all) est à lister dans la checklist « ajouter une page ».
15. **Skill LinkedIn** : les extensions Chrome tierces de type lemlist interceptent
    les clics et cassent le pilotage ; les faire désactiver avant la PHASE 2. Et si
    deux Chrome sont ouverts, vérifier que le MCP est branché sur celui qui est
    connecté à LinkedIn.
16. **Dry-run d'abord, toujours**, pour tout ce qui envoie des emails en masse. Le
    flag dry-run doit être posé sur l'enregistrement pour que l'envoi réel puisse
    repartir plus tard.

## Annexe B : les deux checklists à maintenir dans le CLAUDE.md du repo

**Ajouter une page publique :**

1. `src/pages/<Page>.tsx` + route dans `App.tsx` + segment dans `SITE_SEGMENTS`
2. Route dans `entry-server.tsx` (SSR)
3. Route dans `scripts/prerender.js`
4. `public/sitemap.xml`
5. Toute copie de `SITE_SEGMENTS` (edge function, `RESERVED_SLUGS` d'un catch-all)
6. Composant `<SEO>` complet (title, description, canonical, JSON-LD, og:image)

**Ajouter un lead magnet :**

1. Constantes en double : `netlify/functions/_<slug>.ts` + `src/lib/<slug>.ts`
2. Page + formulaire + aperçu de la ressource (3 composants)
3. Checklist « ajouter une page » ci-dessus
4. Branche dans `submission-created.ts` (dispatch par `form_name`)
5. Union `LeadEvent` : la source ET ses copies (admin, digest)
6. Catalogue d'emails : nouvelle entrée AVANT l'attrape-tout + slug ajouté à la
   liste d'exclusion de l'attrape-tout + URL d'accès à la ressource
7. Sections du digest quotidien
8. Visuels : og:image 1200×630 dédiée, visuel de post 1080×1080
9. Redirection 301 si la page remplace une URL existante

## Annexe C : comptes et variables d'environnement

**Comptes à créer par l'humain** (jamais par toi) : GitHub, Netlify, Resend
(+ vérification DNS du domaine), Anthropic (clé API si modules IA), et selon
périmètre : Google Cloud (OAuth Calendar, service account Search Console/Sheets),
Dropcontact, Notion.

**Variables d'environnement Netlify** (référence, à adapter au périmètre) :

| Variable | Rôle |
|---|---|
| `ADMIN_PASSWORD` (+ `ADMIN_PASSWORD_2` optionnel) | Auth de l'admin et des APIs |
| `RESEND_API_KEY` | Envoi d'emails |
| `SIGNING_SECRET` | HMAC des tokens NPS + désinscription |
| `NURTURE_MAX_SENDS`, `NPS_MAX_SENDS`, `REMINDER_MAX_SENDS` | Plafonds par cron |
| `NURTURE_LIVE`, `NPS_LIVE`, `REMINDER_LIVE` | Interrupteurs dry-run/réel |
| `ANTHROPIC_API_KEY` | Modules IA serveur |
| `DROPCONTACT_API_KEY` | Enrichissement |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` | Booking Calendar |
| `GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY` | Positions Search Console |
| `NOTION_TOKEN`, `NOTION_DB_*` | Miroir Notion |

Un JSON de service account trop gros pour une variable (limite 4 Ko) se stocke dans
un store Blobs `secrets` via une fonction admin d'upload one-shot.

**Secrets locaux côté opérateur** : `.claude/secrets/admin-password.txt` (pour le
skill LinkedIn) et `.claude/state/` (state files), tous deux dans le `.gitignore`.

---

*Kit issu du système en production sur clempo.fr. Auteur : Clément Pouget-Osmont,
clement.pougetosmont@gmail.com. Version 1.1, août 2026.*
