# Le back office Sales & Marketing complet

**Site + CRM + emails automatiques + prospection LinkedIn : toute la machine d'acquisition B2B, dans un seul dépôt de code. Le tout testé et éprouvé en production sur des entreprises qui réalisent plusieurs millions d'euros de chiffre d'affaires.**

Version 1.1, août 2026. Rédigé par Clément Pouget-Osmont (clempo.fr).
Ce document explique le fonctionnement du back office tel qu'il tourne en production, et tel qu'il est déployé chez les clients.

---

## 1. La logique d'ensemble

Le principe fondateur : plutôt que d'empiler des abonnements SaaS (un CRM type HubSpot, un outil d'emailing type Mailchimp, un Calendly, un outil d'automation LinkedIn, un outil d'analytics), tout est du **code sur mesure hébergé sur Netlify**, piloté et maintenu avec Claude Code.

Trois conséquences :

1. **Coût de fonctionnement quasi nul** (voir le tableau des outils en section 7). Pas de licence par siège, pas de plafond de contacts.
2. **Les données restent chez vous** : contacts, historique, statistiques. Tout est exportable en un fichier JSON.
3. **Le système évolue en langage naturel** : ajouter un champ au CRM, un email à la séquence ou une page au site est une conversation avec Claude Code, pas un ticket chez un éditeur.

Le funnel que le système matérialise et mesure :

```
Contenu LinkedIn (impressions)
        │
        ▼
Visites du site (filtrées des bots)
        │
        ▼
Leads (lead magnets, formulaires, prises de RDV)
        │
        ▼
Opportunités (RDV qualifiés)
        │
        ▼
Clients
```

Chaque étage est compté, chaque taux de passage est affiché semaine par semaine dans le tableau de bord. L'humain garde la main sur trois choses : la **publication de contenu**, la **validation de chaque message sortant** (aucun DM LinkedIn ne part sans accord explicite), et les **rendez-vous**.

Le système se compose de **4 briques** :

| Brique | Ce qu'elle fait | Où elle vit |
|---|---|---|
| 1. Le site | Vitrine, blog SEO, pages de capture (lead magnets), prise de RDV | Code React déployé sur Netlify |
| 2. Le CRM + analytics | Contacts, funnel, scoring, suivi du trafic, tableau de bord | Page `/admin` protégée + base Netlify Blobs |
| 3. Les emails automatiques | Livraison des ressources, relances J+3 / J+7, NPS, rappels RDV, récap quotidien | Fonctions planifiées Netlify + Resend |
| 4. La prospection LinkedIn | Scan quotidien, détection des signaux d'intérêt, DM et invitations validés | Skill Claude Code qui pilote le navigateur |

---

## 2. Brique 1 : le site

### Ce qu'il fait

- **Vitrine** : présentation de l'offre, preuves (clients, médias, chiffres), appels à l'action vers la prise de RDV.
- **Blog SEO** : des articles de fond qui captent du trafic Google sur les mots-clés du secteur.
- **Pages lead magnet** : une ressource à forte valeur (une base de données, un benchmark, un guide) offerte contre un email. C'est le principal convertisseur de trafic en leads.
- **Prise de RDV maison** : un calendrier connecté à Google Calendar. Le visiteur choisit un créneau, l'événement se crée avec un lien visio, un rappel automatique part la veille. Pas de Calendly.
- En option : **devis en ligne signables** (le prospect consulte, signe à l'écran, reçoit le PDF) et **portails d'onboarding client** (questionnaire de démarrage de mission avec dépôt de fichiers).

### Comment ça marche techniquement

- **React + TypeScript + Vite + Tailwind CSS** : une application web moderne, rapide, à la charte graphique du client.
- **Prérendu statique** : au moment du build, chaque page publique est transformée en HTML complet. C'est indispensable pour le SEO (Google et les IA lisent le contenu sans exécuter de JavaScript) et pour les aperçus de liens LinkedIn/WhatsApp.
- **Déploiement continu** : le code vit sur **GitHub**. Chaque modification poussée sur la branche principale déclenche automatiquement un build et une mise en ligne sur **Netlify** (2 à 3 minutes). Retour arrière en un clic si besoin.
- **SEO outillé** : balises title/description calibrées, données structurées Schema.org, sitemap, redirections 301 systématiques quand une URL change (une URL cassée sans redirection perd son référencement).

---

## 3. Brique 2 : le CRM + analytics

### Ce qu'il fait

Une seule page, `/admin`, protégée par mot de passe, avec des onglets :

- **Analytics** : visites par jour, sources de trafic, pages vues, et le **funnel marketing** (impressions LinkedIn, visites, leads, opportunités, clients, avec les taux de passage) par semaine ou par mois.
- **CRM** : sociétés et contacts, avec un funnel à 6 statuts : `Non qualifié`, `Prospect`, `Lead`, `Opportunité`, `Client`, `Lost`. Un contact ne redescend jamais de statut (sauf passage en Lost). Chaque changement de statut est horodaté : c'est cet historique qui alimente le funnel.
- **Scoring automatique** sur 100 : taille d'entreprise, localisation, secteur, niveau hiérarchique du contact, engagement (visites du site). Permet de prioriser les relances.
- **Contenus** : performance de chaque lead magnet (téléchargements, satisfaction, conversion en opportunités).
- **Tâches** : rappels et to-do rattachés aux sociétés.

### Comment ça marche techniquement

- **Stockage : Netlify Blobs**, la base clé-valeur incluse dans Netlify. Pas de base de données à administrer, pas de serveur. Les données sont des fichiers JSON versionnables et exportables.
- **Suivi du trafic maison** : chaque page émet un signal de visite (avec dédoublonnage par session et normalisation de la source). Côté serveur, un **filtre anti-bot** rejette les fausses visites avant tout enregistrement : user-agent suspect, origine invalide, absence d'en-têtes de vrai navigateur, plus de 40 visites par jour depuis la même adresse (anonymisée par hachage). Sans ce filtre, les statistiques sont inutilisables : sur clempo.fr, jusqu'à 600 fausses visites « Google » par semaine avant sa mise en place.
- **Rattachement visiteur → contact** : au premier formulaire soumis, un cookie est posé. Les visites suivantes de cette personne sont rattachées à sa fiche CRM : on voit qui revient, quand, sur quelles pages. Signal d'achat précieux.
- **Enrichissement** (option) : un clic envoie le contact à **Dropcontact**, qui retrouve email professionnel, téléphone et poste, dans le respect du RGPD.
- **Classification par IA** (option) : l'API Claude d'Anthropic classe automatiquement chaque société (taille, secteur, localisation) pour alimenter le scoring.
- **Miroir Notion** (option) : le CRM se synchronise vers des bases Notion toutes les 15 minutes, pour ceux qui préfèrent y lire leurs données.

---

## 4. Brique 3 : les emails automatiques

### Ce qu'ils font

| Email | Quand | À qui |
|---|---|---|
| Livraison de la ressource | Immédiatement après le formulaire | Le lead |
| Relance J+3 (les autres ressources) | 3 jours après le 1er téléchargement | Le lead |
| Relance J+7 (présentation des offres) | 7 jours après | Le lead |
| Question de satisfaction (note sur 10, cliquable dans l'email) | Le lendemain d'un téléchargement | Le lead |
| Rappel de RDV | La veille du rendez-vous | Le lead |
| Récap quotidien (téléchargements, visites de contacts connus, notes reçues) | Chaque matin | Vous |
| Alerte RDV pris | En temps réel | Vous |

Les relances s'arrêtent d'elles-mêmes dès qu'un contact devient Opportunité ou Client (on ne relance pas quelqu'un avec qui on est déjà en discussion), et respectent la désinscription en un clic.

### Comment ça marche techniquement

- **Resend** est le transporteur : une API d'envoi d'emails moderne, avec le domaine du client authentifié (SPF, DKIM, DMARC) pour une délivrabilité propre. Les emails partent de `noreply@votredomaine.fr` avec l'adresse du dirigeant en réponse.
- **Des fonctions planifiées Netlify** (crons) tournent chaque matin dans un ordre précis : récap, rappels RDV, relances, satisfaction. Il n'y a pas de « file d'attente » : chaque cron recalcule qui est éligible dans sa fenêtre (J+1 à J+7, J+3 à J+10, J+7 à J+14), ce qui rend le système insensible aux pannes ponctuelles.
- **Plafonds d'envoi configurables** : le quota gratuit de Resend est de 100 emails par jour. Chaque cron a un plafond réglable par variable d'environnement, et un **mode répétition générale** (les emails partent vers vous au lieu des leads) activé par défaut à la mise en service.
- **Mesure maison des ouvertures et clics** : pixel invisible et réécriture des liens, sans outil tiers, visible dans l'admin.
- **Templates éditables** depuis l'admin, avec variables (prénom, ressource téléchargée, liens).
- **Conformité** : lien de désinscription dans chaque email + en-tête de désinscription en un clic (standard RFC 8058). L'opt-out est global et immédiat.

---

## 5. Brique 4 : la prospection LinkedIn

### Ce qu'elle fait

Chaque matin, en 10 minutes, l'opérateur lance un rituel dans Claude Code :

1. **Relevé des impressions** du profil (7 jours glissants), poussées dans le funnel du tableau de bord.
2. **Scan de trois sources de signaux** : les nouvelles connexions, les visiteurs du profil, les réactions au dernier post.
3. **Filtrage sur la cible** : niveau hiérarchique (dirigeants, C-levels) croisé avec les mots-clés du secteur, définis sur mesure pour chaque client.
4. **Mise à jour du CRM** : les profils dans la cible sont créés ou promus en Lead, avec enrichissement automatique.
5. **Proposition d'une liste d'actions** : DM aux relations de 1er niveau, invitations aux 2e niveaux. **Rien ne part sans validation** : l'opérateur répond « envoie 1, 3 et 4, saute le 2 » et seulement alors les messages partent.

### Comment ça marche techniquement

- Ce n'est **pas un SaaS d'automation** (les outils qui se branchent sur LinkedIn en masse font bannir des comptes). C'est un **skill Claude Code** : un fichier d'instructions qui pilote le **vrai navigateur Chrome de l'opérateur**, connecté à son propre LinkedIn, via l'extension Claude in Chrome. Vu de LinkedIn, c'est une navigation humaine.
- **Garde-fous stricts, non négociables** : maximum 10 DM et 10 invitations par jour, 30 à 60 secondes aléatoires entre chaque action, arrêt immédiat si l'interface LinkedIn change.
- **Anti-redondance à deux étages** : un fichier d'état local mémorise tout ce qui a été proposé, envoyé ou refusé (aucune re-proposition pendant 7 jours), et avant chaque DM le skill **vérifie la conversation LinkedIn existante** : si un échange a déjà eu lieu dans l'année, il saute la personne. Zéro double message, même si vous avez écrit à la personne manuellement.
- **Le message est le vôtre** : le template de DM est rédigé avec vous, validé par vous, et reste volontairement sobre (pas de lien commercial dans le premier message).

---

## 6. Le parcours d'un lead, de bout en bout

Ce que fait le système quand une personne télécharge une ressource :

1. Elle remplit le formulaire de la page lead magnet (prénom, nom, email, société). Le fichier se débloque immédiatement à l'écran.
2. **Netlify Forms** capte la soumission et déclenche une fonction serveur qui, en un seul passage : enregistre l'événement dans les statistiques, **crée la fiche CRM au statut Lead** (ou promeut la fiche existante), programme la question de satisfaction du lendemain, et envoie l'email de livraison.
3. Un cookie rattache désormais ses visites futures à sa fiche : vous voyez quand elle revient sur la page Offres.
4. Le lendemain, elle reçoit la question de satisfaction (note en un clic). À J+3, les autres ressources. À J+7, la présentation de vos offres.
5. Chaque matin à l'heure du café, le récap quotidien vous liste les nouveaux téléchargements, les contacts connus revenus sur le site et les notes reçues.
6. Si elle prend RDV, l'événement Google Calendar se crée avec un lien visio, vous êtes notifié en temps réel, elle reçoit un rappel la veille, et deux tâches de suivi apparaissent dans le CRM.
7. Vous la passez en `Opportunité` après le RDV : les relances automatiques s'arrêtent, le funnel s'incrémente.

En parallèle, côté LinkedIn : si elle visite votre profil ou like votre dernier post, le scan du matin la repère, la croise avec le CRM et vous propose le bon geste (DM ou invitation).

---

## 7. Les outils nécessaires

Le système s'appuie sur peu de comptes, tous au nom du client :

| Outil | Rôle dans le système | Plan | Ordre de grandeur |
|---|---|---|---|
| **GitHub** | Héberge le code, l'historique complet, et déclenche les déploiements | Free | 0 € |
| **Netlify** | Hébergement du site, fonctions serveur, base de données (Blobs), formulaires, tâches planifiées | Free au départ, Pro si le trafic monte | 0 à ~19 $/mois |
| **Nom de domaine** | L'adresse du site et des emails | | ~12 €/an |
| **Resend** | L'envoi des emails (transactionnels et relances) | Free : 100/jour. Payant au-delà | 0 à ~20 $/mois |
| **Claude Code** (Anthropic) | Construction et évolution du système, et pilotage du rituel LinkedIn | Abonnement Pro ou Max | 20 à 200 $/mois |
| **Extension Claude in Chrome** | Permet à Claude de piloter le navigateur pour LinkedIn | Incluse | 0 € |
| **Clé API Anthropic** | Fonctions IA côté serveur : classification des sociétés, génération de questionnaires | À l'usage | Quelques €/mois |

Et en option selon les modules retenus :

| Outil | Rôle | Ordre de grandeur |
|---|---|---|
| **Google Cloud** (gratuit) | Calendar pour la prise de RDV, Search Console pour le suivi SEO, Sheets pour les exports | 0 € |
| **Dropcontact** | Enrichissement RGPD des contacts (email pro, téléphone, poste) | ~25 €/mois |
| **Notion** | Miroir de lecture du CRM | 0 à 10 €/mois |

Total de fonctionnement typique hors Claude : **moins de 30 € par mois**. L'équivalent SaaS (CRM + emailing + scheduling + automation LinkedIn + analytics) dépasse couramment 400 € par mois, avec vos données chez cinq éditeurs différents.

---

## 8. Le quotidien de l'opérateur

Le système automatise l'exécution, pas la stratégie. Ce qu'il reste à faire :

**Chaque matin (10 à 15 minutes)**
- Lire le récap quotidien reçu par email.
- Lancer le rituel LinkedIn dans Claude Code, valider ou écarter les DM et invitations proposés.

**Chaque semaine**
- Publier du contenu LinkedIn (c'est le carburant du haut de funnel).
- Regarder le funnel dans l'admin : où ça coince, où ça convertit.
- Le lundi, le relevé automatique des positions Google tombe dans l'onglet SEO.

**Au fil de l'eau**
- Faire les RDV, passer les fiches en `Opportunité` / `Client` (deux clics).
- Demander des évolutions à Claude Code en langage naturel.

---

## 9. Garde-fous et limites assumées

- **Aucun message ne part sans validation humaine.** Ni DM, ni invitation. Les emails automatiques, eux, suivent des templates que vous avez validés, avec des plafonds journaliers.
- **Quota email** : 100 emails/jour en plan gratuit Resend. Le système répartit ce budget entre les familles d'emails via des plafonds réglables ; si votre volume dépasse, le passage au plan payant est une variable d'environnement à changer.
- **LinkedIn** : les caps (10 DM, 10 invitations par jour) sont volontairement bas. C'est le prix de la durabilité du compte.
- **Un seul opérateur à la fois** dans l'admin : le système est conçu pour une TPE/PME, pas pour une équipe commerciale de 20 personnes qui écrivent en même temps.
- **RGPD** : données minimales (identité professionnelle et engagement), désinscription en un clic, enrichissement via un fournisseur conforme (Dropcontact), données hébergées chez vous et exportables. La déclaration de conformité globale reste de la responsabilité de l'entreprise.

---

## 10. Ce que contient la livraison

1. **Le dépôt GitHub** complet, à votre nom, avec le site, le CRM, les emails et la documentation technique interne (le fichier CLAUDE.md qui permet à Claude Code de maintenir le système).
2. **Les comptes configurés** : Netlify, Resend (domaine authentifié), et les variables d'environnement documentées.
3. **Le skill LinkedIn** paramétré pour votre cible et votre message.
4. **Le kit de reproduction** (`KIT-REPRODUCTION.md`) : le fichier qui permet à Claude Code de reconstruire ou d'étendre le système, avec le questionnaire de cadrage. C'est votre assurance d'indépendance : le back office n'est pas une boîte noire.
5. **Une passation** : démonstration du rituel quotidien, remise des accès, et la checklist d'exploitation.

---

*Document rédigé par Clément Pouget-Osmont. Contact : clement.pougetosmont@gmail.com, https://www.clempo.fr*
