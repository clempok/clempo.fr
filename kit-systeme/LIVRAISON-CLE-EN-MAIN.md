# Livraison clé en main : le runbook

**Document interne** (ne pas remettre au client). Comment installer le back office
Sales & Marketing chez un client en faisant tout à sa place, sans jamais détenir ce
qu'il ne faut pas détenir. Environ 3 heures de temps client au total, le reste en solo.

Version 1.0, août 2026.

---

## Les principes non négociables

1. **Tout est créé au nom du client dès le premier jour.** Comptes, domaine, repo,
   facturation. Aucun « je crée chez moi et je transfère plus tard » : les transferts
   (Netlify, DNS, vérifications Resend) sont le meilleur moyen de casser quelque chose
   et de rester propriétaire malgré soi.
2. **Délégation révocable, jamais leurs mots de passe personnels.** Invitations
   (GitHub), tokens (Netlify PAT), clés API (Resend, Anthropic). Tout ce qui est
   secret vit dans un coffre partagé, rien ne transite par email ou WhatsApp.
3. **Deux choses ne passent jamais entre tes mains : leur carte bancaire et leur
   LinkedIn.** La carte est tapée par le client en visio (ou carte virtuelle
   plafonnée, voir Cas particuliers). LinkedIn : prendre leurs identifiants est
   contraire aux CGU et une connexion depuis ta machine fait flagger le compte ;
   le rituel tourne sur leur Chrome, c'est la raison d'être du skill.
4. **La récupération de compte appartient au client.** 2FA avec SON téléphone,
   email de récupération chez lui. Pendant le setup, le secret TOTP est dans le
   coffre (vous générez les codes tous les deux) ; à la passation, il ré-enrôle
   sur son téléphone seul.
5. **L'offboarding a une date, fixée au devis.** C'est la preuve de la promesse
   « pas de boîte noire », et l'ouverture naturelle vers le forfait maintenance.

---

## Vue d'ensemble

| Quand | Quoi | Durée | Qui |
|---|---|---|---|
| À la signature | Questionnaire de cadrage (Phase 0 du kit) | async ou 45 min | Client + toi |
| J-7 | Email de préparation envoyé | 5 min | Toi |
| J0 | **Session 1 : Fondations** (comptes, coffre, paiements) | 45-60 min | Client au clavier, toi qui guides |
| J+1 à J+7 | **Build asynchrone** (site, CRM, emails, skill) | 2-4 jours | Toi seul |
| ~J+7 | **Session 2 : Branchements Google + recette** | 30-45 min | Client + toi |
| ~J+10 | **Session 3 : Passation** (poste de l'opérateur) | 1h-1h30 | Opérateur + toi |
| J+30 (défaut) | **Offboarding** ou bascule en maintenance | 30 min | Toi |

---

## L'email de préparation (à envoyer à J-7)

Objet : **Préparation de notre session d'installation (45 min)**

> Bonjour <Prénom>,
>
> Nous installons votre back office <date> à <heure>. La session dure 45 minutes à
> une heure, en visio avec partage d'écran : je vous guide, c'est vous qui créez les
> comptes (tout sera à votre nom dès le départ, c'est voulu).
>
> À préparer avant la session :
>
> 1. **Le nom de domaine** : votre choix, plus une alternative si le premier est pris.
> 2. **Une adresse email de service** du type ops@votredomaine.fr (je vous aide à la
>    créer si besoin). Elle servira d'identifiant pour tous les outils : rien ne sera
>    rattaché à une boîte personnelle.
> 3. **Votre carte bancaire pro** : trois petits paiements pendant la session, environ
>    12 € pour le domaine (annuel), 5 € de crédit d'API, et l'abonnement Claude de la
>    personne qui opérera (à partir de ~20 $/mois). Tout le reste démarre en gratuit.
> 4. **Votre téléphone** : les validations en deux étapes se feront avec votre numéro,
>    pas le mien.
> 5. **La personne qui opérera au quotidien** (10 minutes par matin) : son nom, et
>    idéalement sa présence sur les 15 dernières minutes.
> 6. Si ce n'est pas déjà fait : vos réponses au questionnaire de cadrage, et votre
>    logo + charte graphique si vous en avez.
>
> À <date>,
> Clément

---

## Session 1 : Fondations (45-60 min, visio, le client au clavier)

Règle du jeu annoncée en ouverture : « c'est vous qui tapez, moi je guide ; à la fin,
tout vous appartient et j'ai exactement les accès qu'il me faut, listés dans une
fiche que nous révoquerons ensemble à la fin de la mission ».

| Min | Étape | Détail | Au coffre |
|---|---|---|---|
| 0-5 | Cadre | Dérouler la fiche d'accès vierge : voilà ce qu'on crée et pourquoi | |
| 5-12 | **ops@client.fr** | Alias ou boîte dédiée sur leur messagerie. C'est l'email d'inscription de TOUS les outils | mot de passe |
| 12-18 | **Coffre partagé** | Bitwarden : organisation gratuite à 2 utilisateurs, collection « Setup <Client> ». Le client t'invite | |
| 18-25 | **GitHub** | Organisation au nom du client (compte sur ops@), invitation de ton compte en admin du repo (ou owner de l'org le temps du build, à rétrograder à l'offboarding) | mot de passe + TOTP |
| 25-32 | **Netlify** | Compte sur ops@, équipe au nom du client. Le client génère un **Personal Access Token** pour toi | mot de passe + PAT |
| 32-38 | **Resend** | Compte sur ops@, création d'une clé API | mot de passe + clé |
| 38-45 | **Console Anthropic** | Compte sur ops@, carte du client, ~5 € de crédit, clé API | mot de passe + clé |
| 45-52 | **Nom de domaine** | Achat (carte du client), au registrar de leur choix ou directement chez Netlify. Délégation DNS vers Netlify si registrar externe | accès registrar |
| 52-60 | **2FA + tour final** | 2FA activée partout avec le téléphone du client, secrets TOTP au coffre. Relecture de la fiche d'accès : tout est vert ? | secrets TOTP |

**Sortie de session** : la fiche d'accès est complète, tu peux tout faire sans eux.
Si un point a raté (registrar récalcitrant, vérification en attente), le noter dans
la fiche avec la relance prévue, ne pas déborder la session.

---

## Le build asynchrone (toi seul, J+1 à J+7)

Sur ta machine, avec ton Claude Code :

- [ ] Dossier vide + `KIT-REPRODUCTION.md` + le `CADRAGE.md` issu du questionnaire ;
      dérouler les Phases 1 à 7 du kit (le kit est la référence, ce runbook n'en
      duplique pas le contenu).
- [ ] Repo poussé dans l'org GitHub du client, Netlify lié (PAT), domaine + HTTPS +
      redirection canonique en place.
- [ ] DNS Resend posés (SPF, DKIM, DMARC) : si le DNS est chez Netlify tu le fais
      seul, sinon petite relance au client avec les 3 enregistrements à copier.
- [ ] Variables d'environnement posées, **tous les crons d'emails en dry-run**
      (aucune variable `*_LIVE`).
- [ ] `ADMIN_PASSWORD` généré, stocké au coffre.
- [ ] CRM seedé si le client a fourni une base existante (export CSV).
- [ ] `SKILL.md` LinkedIn adapté : cibles (A)/(B)/(C) et template de DM issus du
      cadrage, caps 10/10.
- [ ] Recette solo : lead de test bout en bout, dry-runs reçus, filtre anti-bot
      vérifié, aperçu de lien LinkedIn correct.
- [ ] Le fond du contenu : rappel au client de ce qu'il doit fournir (matière du
      lead magnet, premiers sujets d'articles). Le build n'attend pas après, mais
      la Session 3 est plus vendeuse si un lead magnet réel est déjà en ligne.

---

## Session 2 : Branchements Google + recette (30-45 min)

Les seuls éléments impossibles par délégation : les consentements OAuth se donnent
depuis le compte Google du client.

- [ ] **Calendar** (si booking retenu) : consentement OAuth depuis leur compte,
      récupération du refresh token, posé en variable Netlify. RDV de test créé et
      supprimé ensemble.
- [ ] **Search Console** : propriété du domaine vérifiée (enregistrement DNS), et
      service account ajouté si le module positions SEO est retenu.
- [ ] **Recette à deux** : le client fait le parcours complet en jouant le lead
      (formulaire, déblocage, email de livraison en dry-run, fiche CRM créée, visite
      rattachée).
- [ ] **Validation du fond** : templates d'emails relus et amendés par le client,
      template de DM validé mot à mot. Rien ne passera en réel sans ce oui.

---

## Session 3 : Passation (1h-1h30, sur le poste de l'opérateur)

- [ ] Claude Code installé et connecté sur **leur** abonnement ; extension Claude in
      Chrome installée ; LinkedIn de l'opérateur connecté dans ce Chrome.
- [ ] Repo cloné, `.claude/secrets/admin-password.txt` posé (depuis le coffre),
      vérification que `secrets/` et `state/` sont bien gitignorés.
- [ ] **Premier `/linkedin-sync` ensemble** : PHASE 1 complète, lecture du récap,
      validation d'un ou deux DMs réels si l'opérateur est à l'aise.
- [ ] Tour de l'admin : funnel, CRM (changer un statut), onglet Contenus, templates.
- [ ] **Go-live des emails** : passage des `*_LIVE` à `1` un par un, sur décision
      explicite du client, redéploiement à chaque fois. Commencer par le NPS.
- [ ] Remise : `LE-SYSTEME-EXPLIQUE.md` (ou le lien de la page), la fiche d'accès à
      jour, le rythme d'exploitation (matin 10 min, hebdo funnel).
- [ ] **Fixer la date d'offboarding** (défaut : J+30) et proposer l'alternative
      maintenance.

---

## L'offboarding (à la date fixée)

- [ ] Rotation d'`ADMIN_PASSWORD` par le client (tu perds l'accès à l'admin).
- [ ] PAT Netlify révoqué.
- [ ] Ton compte retiré de l'org GitHub (ou rétrogradé selon le contrat).
- [ ] Client change le mot de passe d'ops@ et ré-enrôle la 2FA sur son seul téléphone.
- [ ] Tu quittes le coffre partagé (le client garde l'organisation Bitwarden).
- [ ] Email de clôture : inventaire de ce qui a été révoqué, de ce qui reste (rien,
      ou la liste du contrat de maintenance), et rappel de où tout se trouve.

**Option maintenance** (à proposer en Session 3) : tu conserves GitHub + coffre,
avec une cadence type revue mensuelle du funnel + évolutions à la demande +
mise à jour du skill quand LinkedIn change son interface. Tout le reste est
révoqué quand même : la maintenance n'est pas une raison de garder l'admin.

---

## La fiche d'accès (à copier pour chaque client)

```
FICHE D'ACCÈS · <Client> · ouverte le <date>, offboarding prévu le <date>

| Outil       | Compte (email) | Créé le | Accès Clément     | Révoqué le |
|-------------|----------------|---------|-------------------|------------|
| ops@        | ops@client.fr  |         | mdp via coffre    |            |
| Coffre      | (organisation) |         | membre            |            |
| GitHub      | ops@client.fr  |         | admin repo        |            |
| Netlify     | ops@client.fr  |         | PAT               |            |
| Resend      | ops@client.fr  |         | clé API (coffre)  |            |
| Anthropic   | ops@client.fr  |         | clé API (coffre)  |            |
| Registrar   | ops@client.fr  |         | délégué à Netlify |            |
| Google      | compte client  |         | aucun (OAuth posé)|            |
| LinkedIn    | opérateur      |         | AUCUN, JAMAIS     |    n/a     |
| Admin site  | /admin         |         | ADMIN_PASSWORD    |            |
```

La fiche vit dans le coffre partagé. Une ligne = un accès = une case « révoqué le »
à remplir. Rien d'autre ne doit exister : si un accès n'est pas sur la fiche, c'est
qu'il n'aurait pas dû être donné.

---

## Cas particuliers

- **Le client n'a même pas une heure.** Il crée une **carte virtuelle plafonnée**
  (Qonto, Shine : plafond ~50 €/mois, libellée « outils marketing ») et la dépose
  lui-même dans le coffre. Tu crées alors les comptes sur ops@ avec cette carte.
  Le numéro ne vit nulle part ailleurs que dans le coffre, et le client peut couper
  la carte en un clic. C'est le plan B, pas le défaut : la Session 1 reste meilleure
  (le client comprend ce qu'il possède).
- **Le client a déjà GitHub / Netlify / Google Workspace.** Tant mieux : invitations
  classiques sur l'existant, pas de doublon. Vérifier juste que le repo atterrit dans
  une org (pas le compte perso d'un salarié qui peut partir).
- **Le client veut que tu opères le rituel LinkedIn quelque temps.** Le rituel doit
  tourner depuis leur machine et leur LinkedIn, donc l'accompagnement se fait en
  visio : 2 sessions par semaine pendant 2-3 semaines où l'opérateur pilote et tu
  coaches. Jamais leurs identifiants, même « pour dépanner ».
- **Plusieurs décideurs.** Un seul interlocuteur possède ops@ et le coffre. Les
  autres reçoivent des invitations nominales là où c'est utile (GitHub, Netlify Pro).
- **Contrat.** Trois clauses à ne pas oublier : le **mandat** (liste des accès
  consentis, celle de la fiche), la **sous-traitance RGPD** (article 28 : tu
  manipules leur CRM et leurs leads), et la **date d'offboarding** avec ce qui est
  révoqué. La fiche d'accès annexée au contrat fait les trois à la fois.

---

## Le budget annoncé en Session 1

| Paiement | Montant | Fréquence |
|---|---|---|
| Nom de domaine | ~12 € | annuel |
| Crédit API Anthropic | 5 € | recharge à l'usage (quelques €/mois) |
| Abonnement Claude (opérateur) | 20 à 200 $ | mensuel |
| GitHub, Netlify, Resend, Google | 0 € | gratuits au départ |
| Plus tard, selon usage | Netlify Pro 19 $, Resend 20 $, Dropcontact ~25 € | si les volumes montent |

---

*Runbook interne Clempo. Auteur : Clément Pouget-Osmont. Version 1.0, août 2026.*
