// Liste des spécialités médicales pour les pages "Parts de marché logiciels"
// Pour ajouter une spécialité : déposer les fichiers dans public/data/specialites/
// (slug.json, slug.csv, slug.xlsx) et ajouter une entrée ci-dessous.

export interface TopPlayer {
  rank: number
  name: string       // Nom du progiciel
  editor: string     // Éditeur
  share: string      // Part de marché en % (ex: "23,2%")
  note?: string      // Note rapide (ex: "leader depuis 2024")
}

export interface Specialite {
  slug: string
  name: string                  // Nom court (ex: "Médecins Généralistes")
  shortName: string             // Forme courte/profession (ex: "médecin généraliste")
  hero: string                  // Phrase d'accroche pour la page
  metaTitle: string             // Title SEO ciblé (60 char max idéal)
  metaDescription: string       // Meta description (155 char max)
  source?: string               // Source des données
  asOf: string                  // Mois de référence du Top (ex: "mars 2026")
  topPlayers: TopPlayer[]       // Top 5 du dernier mois (pour FAQ Schema + texte)
  // Sections de contenu SEO — rendues comme paragraphes HTML sur la page
  marketAnalysis: string        // Analyse du marché (HTML)
  trends: string                // Grandes tendances 2019-2026 (HTML)
  faq: { q: string; a: string }[]  // FAQ pour le SERP
}

export const specialites: Specialite[] = [
  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'medecins-generalistes',
    name: 'Médecins Généralistes',
    shortName: 'médecin généraliste',
    hero: 'Évolution des parts de marché des logiciels de gestion de cabinet utilisés par les médecins généralistes français.',
    metaTitle: 'Logiciel médecin généraliste le plus utilisé en France (2026)',
    metaDescription: "Quel logiciel médical est le plus utilisé par les généralistes en France ? Doctolib (23%), Weda (14%), Medistory (10%), HelloDoc (8%). Classement à jour, données GIE SESAM-Vitale.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Doctolib', editor: 'Doctolib', share: '23,2%', note: 'leader depuis fin 2024' },
      { rank: 2, name: 'Weda', editor: 'Vidal France', share: '14,0%', note: 'logiciel cloud' },
      { rank: 3, name: 'Medistory', editor: 'Prokov Editions', share: '10,1%', note: 'historiquement Mac' },
      { rank: 4, name: 'HelloDoc', editor: 'Imagine Editions', share: '8,1%', note: "leader historique jusqu'en 2023" },
      { rank: 5, name: 'Stellair Integral', editor: 'Olaqin', share: '7,3%' },
    ],
    marketAnalysis: `<p>Le logiciel le plus utilisé par les médecins généralistes français est <strong>Doctolib</strong>, qui équipe environ <strong>23,2%</strong> des cabinets en mars 2026 (mesuré sur les feuilles de soins électroniques télétransmises au GIE SESAM-Vitale). Doctolib a pris la première place fin 2024 en passant devant <strong>Weda</strong> (édité par Vidal France) qui détient désormais 14,0% du marché.</p>
<p>Le top 5 des logiciels médecin généraliste les plus utilisés en France se complète par <strong>Medistory</strong> (Prokov Editions, 10,1% — l'historique référence Mac), <strong>HelloDoc</strong> (Imagine Editions, 8,1%) et <strong>Stellair Integral</strong> (Olaqin, 7,3%). Ensemble, ces cinq solutions couvrent près de 63% du marché — le reste étant fragmenté entre une vingtaine d'éditeurs (CGM eVitale, Dr Santé, Crossway, Intellio, MonLogicielMedical.com…).</p>
<p>Côté éditeurs, le marché est partagé entre <strong>Doctolib</strong> (23%), <strong>Cegedim Santé</strong> (Crossway, MonLogicielMedical.com, MEDICLICK — ~16% cumulés), <strong>Imagine Editions</strong> (HelloDoc + CGM eVitale, ~15%), <strong>Vidal France</strong> (Weda, 14%) et <strong>Olaqin</strong> (Stellair, 7%). À noter que Doctolib s'est imposé sans rachat — uniquement via une stratégie d'intégration logicielle native à sa plateforme de prise de RDV.</p>`,
    trends: `<p>En 7 ans, le marché du logiciel médecin généraliste a été <strong>complètement bouleversé</strong>. Le leader historique <strong>HelloDoc</strong> est passé de 18,4% à 8,1% (-10 points). Plus spectaculaire encore, <strong>AxiSanté</strong> (CompuGroup Medical) est passé de 16% en 2019 à moins de 0,2% en 2026 — un effondrement total après l'annonce d'arrêt de support en 2024 et la migration des utilisateurs vers d'autres solutions du groupe.</p>
<p>Les grands gagnants : <strong>Doctolib</strong> (de 0% à 23,2% en 5 ans), <strong>Weda</strong> (de 0% à 14% — porté par son modèle SaaS cloud), <strong>Stellair Integral</strong> d'Olaqin (de 0% à 7,3%) et <strong>CGM eVitale</strong> qui a récupéré une partie des utilisateurs AxiSanté (de 0,1% à 6,8%).</p>
<p>La tendance de fond est claire : <strong>cloud > on-premise</strong>, <strong>intégration RDV/téléconsultation > logiciel pur</strong>, et <strong>UX moderne > legacy Windows</strong>. Les éditeurs qui n'ont pas migré vers le SaaS dans les délais ont perdu massivement.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel médical le plus utilisé par les généralistes en France ?',
        a: "Doctolib est le logiciel le plus utilisé par les médecins généralistes français en 2026, avec 23,2% des télétransmissions. Il est suivi par Weda (14,0%), Medistory (10,1%), HelloDoc (8,1%) et Stellair Integral (7,3%).",
      },
      {
        q: 'Pourquoi AxiSanté a-t-il disparu du classement ?',
        a: "AxiSanté (édité par CompuGroup Medical) était leader avec 16% de parts de marché en 2019. L'éditeur a annoncé l'arrêt progressif du produit, et les utilisateurs ont migré majoritairement vers CGM eVitale (autre produit du groupe) ou vers les concurrents comme Doctolib et Weda.",
      },
      {
        q: 'Quelle est la part de marché de Doctolib dans le logiciel médecin ?',
        a: "Doctolib représente 23,2% des télétransmissions des médecins généralistes en France en mars 2026, ce qui en fait le numéro 1 du marché. La société a démarré son logiciel de gestion de cabinet en 2020 et a gagné plus de 23 points de parts de marché en 6 ans.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'dentistes',
    name: 'Dentistes',
    shortName: 'dentiste',
    hero: 'Évolution des parts de marché des logiciels de gestion de cabinet utilisés par les chirurgiens-dentistes français.',
    metaTitle: 'Logiciel dentaire le plus utilisé en France (2026) — Logos_w, Julie',
    metaDescription: "Quel logiciel dentaire est le plus utilisé en France ? Logos_w (45%) a pris la 1re place à Julie (20%), suivi par CS Trophy, WeClever, Veasy. Données GIE SESAM-Vitale.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Logos_w', editor: 'Imagex', share: '45,3%', note: 'leader depuis 2023' },
      { rank: 2, name: 'Julie', editor: 'Julie Solutions (groupe Imagex depuis 2026)', share: '20,2%', note: 'leader historique, racheté à Henry Schein One' },
      { rank: 3, name: 'CS Trophy Gestion', editor: 'Carestream Dental', share: '7,1%' },
      { rank: 4, name: 'WeClever Dental', editor: 'Dentalvia-Medilor', share: '5,0%' },
      { rank: 5, name: 'Veasy', editor: 'Visiodent', share: '4,2%', note: 'nouvelle gamme cloud Visiodent' },
    ],
    marketAnalysis: `<p>Le logiciel dentaire le plus utilisé en France est <strong>Logos_w</strong>, édité par <strong>Imagex</strong> (Liffré), qui représente <strong>45,3%</strong> des télétransmissions en mars 2026 — soit près d'un cabinet dentaire sur deux. Il a doublé Julie en 2023 et son avance ne cesse de se creuser.</p>
<p>Le numéro 2 historique reste <strong>Julie</strong> (Julie Solutions, plus de 20 000 utilisateurs revendiqués) avec 20,2% des cabinets — soit 12 points de moins qu'en 2019 (il était alors à 32%). Fait majeur du marché : <strong>Imagex a racheté Julie Solutions à Henry Schein One en 2026</strong>, créant de fait un groupe combiné qui pèse ~65% du parc dentaire français en télétransmission. Le top 5 du marché est complété par <strong>CS Trophy Gestion</strong> (Carestream Dental, 7,1%), <strong>WeClever Dental</strong> (Dentalvia-Medilor, 5,0%) et <strong>Veasy</strong> (la solution cloud de Visiodent, 4,2% — au niveau du groupe Visiodent, ce sont 10 000 dentistes et 500 centres de santé qui sont équipés tous produits confondus).</p>
<p>Le marché du logiciel dentaire est l'un des plus concentrés de la santé libérale française : le top 3 capte 72% des cabinets, et le top 5 plus de 82%. C'est aussi un marché où les éditeurs sont historiquement intégrés à la chaîne dentaire (imagerie, fauteuil, gestion) — ce qui crée des coûts de migration élevés et une forte fidélité.</p>
<p>Le marché dentaire français se lit en réalité sur <strong>trois couches</strong> : (1) la gestion de cabinet et de centre, dominée par les éditeurs français historiques (Logos_w, Julie, Veasy, Visiodent, Maevi) ; (2) l'imagerie 2D/3D et la planification (Planmeca Romexis, Carestream CS Imaging, DEXIS DTX Studio, Owandy, QuickVision) ; (3) la CAO/FAO et l'ERP de laboratoire, où dominent des acteurs internationaux (<strong>3Shape</strong>, <strong>exocad</strong>, <strong>Dental Wings</strong>, <strong>Dentsply Sirona inLab</strong>) face à des ERP français (Prothesis, Prothea, Logidents). La donnée GIE SESAM-Vitale n'éclaire que la première couche.</p>`,
    trends: `<p>La grande inversion du marché s'est jouée entre 2022 et 2024. <strong>Julie</strong>, leader incontesté avec 32% des cabinets en 2019, a perdu près de 12 points en 7 ans. Pendant ce temps, <strong>Logos_w</strong> est passé de 18% à 45,3% — soit +27 points et un doublement de sa base utilisateurs. Avec le rachat de Julie par Imagex en 2026, le marché bascule d'une compétition à deux têtes vers une consolidation explicite : un acteur unique dépasse désormais les 65% du parc de ville.</p>
<p>Côté Visiodent, l'historique <strong>Visiodent Ligne 100</strong> (13% en 2019) s'est effondré à 3,8%, partiellement compensé par la migration vers la nouvelle gamme cloud <strong>Veasy</strong> (4,2% en télétransmission, 7 000 praticiens et 300 centres équipés au niveau produit). Le groupe a perdu en parts cumulées sur la ville mais s'est repositionné sur le segment <strong>centres et multi-sites</strong>, où il revendique 500 centres équipés tous produits confondus.</p>
<p>Trois tendances de fond restructurent le marché : <strong>(1) consolidation du LGC</strong> (Imagex + Julie, montée de Veasy sur les centres) ; <strong>(2) imagerie 3D et IA</strong> — Planmeca Romexis, Carestream CS 3D Imaging, DEXIS DTX Studio Clinic (145 000 utilisateurs dans le monde) et l'IA française <strong>Allisone</strong> (CE annoncé) deviennent la norme pour le diagnostic et la pédagogie patient ; <strong>(3) écosystèmes ouverts cabinet-laboratoire</strong> via 3Shape Unite, Medit Link et exocad, qui captent une part croissante des flux numériques (scan intra-oral, CBCT, fichiers STL/DICOM) en parallèle du LGC principal.</p>
<p>Le cadre réglementaire français (HDS, INS depuis 2021, SESAM-Vitale, ADRi, Addendum 8, Mon espace santé/DMP, MSSanté, vague Ségur en cours) forme une barrière à l'entrée majeure : les nouveaux entrants ne peuvent plus attaquer frontalement le LGC, ils doivent passer par un wedge (cloud multi-sites, IA, intégration labo, conformité documentaire).</p>`,
    faq: [
      {
        q: 'Quel est le logiciel dentaire le plus utilisé en France ?',
        a: "Logos_w (édité par Imagex) est le logiciel dentaire le plus utilisé par les chirurgiens-dentistes français en 2026, avec 45,3% des télétransmissions — devant Julie (20,2%), CS Trophy Gestion (7,1%), WeClever Dental (5,0%) et Veasy (4,2%).",
      },
      {
        q: 'Julie est-il toujours utilisé par les dentistes ?',
        a: "Oui, Julie reste le numéro 2 du marché dentaire français avec 20,2% des cabinets en mars 2026, et plus de 20 000 utilisateurs revendiqués. Sa part a fortement reculé depuis 2019 (où il représentait 32% du marché), au profit principalement de Logos_w. Julie Solutions a été rachetée par Imagex (éditeur de Logos_w) à Henry Schein One en 2026 — les deux produits cohabitent désormais sous le même groupe.",
      },
      {
        q: 'Quels sont les principaux éditeurs de logiciels dentaires en France ?',
        a: "Sur la gestion de cabinet : Imagex (qui édite désormais Logos_w ET Julie suite au rachat de 2026), Visiodent / Veasy, Carestream Dental (CS Trophy), Dentalvia-Medilor (WeClever) et Maevi Systèmes. Sur l'imagerie 2D/3D : Planmeca (Romexis), Carestream (CS Imaging), DEXIS (DTX Studio), Owandy. Sur la CAO/FAO et le laboratoire : 3Shape, exocad (groupe Align), Dental Wings, Dentsply Sirona (inLab) en international, et Prothesis, Prothea, Logidents côté ERP français.",
      },
      {
        q: "Quelle est la place de Doctolib chez les chirurgiens-dentistes ?",
        a: "Doctolib n'est pas un logiciel de gestion de cabinet (LGC) dentaire complet : il ne fait ni télétransmission SESAM-Vitale, ni dossier patient dentaire, ni schéma dentaire. Son offre Pro Dentiste (139 € TTC/mois/soignant) couvre l'agenda, l'acquisition patient, la messagerie sécurisée et la coordination — en complément du LGC métier, pas en remplacement.",
      },
      {
        q: "Quelle est la place de la CAO/FAO dentaire en France ?",
        a: "La CAO/FAO et le scan intra-oral sont dominés par des acteurs internationaux : 3Shape (Copenhague, TRIOS + Dental System + Unite), exocad (Allemagne, filiale Align), Dental Wings (Montréal, bureaux à Lyon) et Dentsply Sirona (inLab). Ces logiciels équipent à la fois les cabinets numérisés et les laboratoires de prothèses, en interopérabilité avec les LGC français via STL/DICOM et des passerelles labo dédiées.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'infirmiers',
    name: 'Infirmiers',
    shortName: 'infirmier libéral',
    hero: 'Évolution des parts de marché des logiciels métier utilisés par les infirmiers libéraux français.',
    metaTitle: 'Logiciel infirmier libéral le plus utilisé en France (2026)',
    metaDescription: "Quel logiciel infirmier est le plus utilisé en France ? Agathe YOU (CBA, 33%), Albus AIR (Sofia, 17%), Simply-Vitale (Cegedim, 12%), Vega (Epsilog, 11%). Classement à jour.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Agathe YOU (E.Motion)', editor: 'CBA Informatique Libérale', share: '33,2%', note: 'leader incontesté' },
      { rank: 2, name: 'Albus AIR', editor: 'Sofia Développement', share: '17,1%', note: 'gamme cloud' },
      { rank: 3, name: 'Simply-Vitale', editor: 'Cegedim Santé', share: '12,3%' },
      { rank: 4, name: 'Vega', editor: 'Epsilog', share: '10,6%' },
      { rank: 5, name: 'Soins 2000', editor: "Logisur'M", share: '9,4%' },
    ],
    marketAnalysis: `<p>Le logiciel infirmier libéral le plus utilisé en France est <strong>Agathe YOU</strong> (gamme E.Motion), édité par <strong>CBA Informatique Libérale</strong>, avec <strong>33,2%</strong> des télétransmissions IDEL en mars 2026 — soit un infirmier libéral sur trois. C'est le seul progiciel à dépasser les 30% de parts de marché.</p>
<p>Le top 5 du marché IDEL est complété par <strong>Albus AIR</strong> (Sofia Développement, 17,1% — la nouvelle gamme cloud du groupe), <strong>Simply-Vitale</strong> (Cegedim Santé, 12,3%), <strong>Vega</strong> (Epsilog, 10,6%) et <strong>Soins 2000</strong> (Logisur'M, 9,4%). Ces 5 solutions couvrent à elles seules 82,5% du marché — le reste se partage entre une douzaine d'éditeurs plus marginaux.</p>
<p>Le marché du logiciel infirmier libéral est structuré autour de deux acteurs dominants : <strong>CBA Informatique Libérale</strong> (33% via Agathe YOU) et <strong>Sofia Développement</strong> (~22% en cumulant Albus AIR, Topaze AIR, et reliquat Topaze classique). Les besoins métier sont très spécifiques (tournées, dépendance, AIS/AMI) ce qui favorise les éditeurs spécialisés sur l'IDEL versus les éditeurs généralistes.</p>`,
    trends: `<p>Le marché infirmier connaît une <strong>migration générationnelle massive</strong> initiée par les éditeurs eux-mêmes. CBA a basculé sa base "AGATHE" historique (16% en 2019) vers <strong>Agathe YOU</strong> qui passe de 11% à 33,2% (+22 points). Sofia a opéré la même bascule sur sa gamme : <strong>ALBUS classique</strong> (4,2% → 0%), <strong>TOPAZE classique</strong> (4,4% → 0,5%) et <strong>INFIMAX</strong> ont tous été progressivement migrés vers les versions <strong>AIR</strong> (cloud).</p>
<p>Cette transformation reflète un mouvement de fond : <strong>du logiciel installé en local au SaaS cloud</strong>, avec applications mobiles natives pour les tournées. Les infirmiers libéraux étant fortement mobiles, l'argument cloud + mobile-first est devenu déterminant.</p>
<p>À noter : <strong>Simply-Vitale</strong> (Cegedim) progresse régulièrement (de 8,3% à 12,3%) et capte une partie des utilisateurs déçus des migrations forcées chez les concurrents.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel infirmier libéral le plus utilisé en France ?',
        a: "Agathe YOU (édité par CBA Informatique Libérale) est le logiciel infirmier libéral le plus utilisé en France en 2026, avec 33,2% des télétransmissions IDEL. Il est suivi par Albus AIR (17,1%), Simply-Vitale (12,3%), Vega (10,6%) et Soins 2000 (9,4%).",
      },
      {
        q: "Quelle est la différence entre Agathe et Agathe YOU ?",
        a: "Agathe est l'ancien logiciel installé en local de CBA Informatique Libérale. Agathe YOU (gamme E.Motion) est la nouvelle version cloud avec application mobile native. CBA a progressivement migré sa base utilisateurs d'Agathe vers Agathe YOU entre 2019 et 2024.",
      },
      {
        q: 'Quels sont les éditeurs majeurs de logiciels infirmiers en France ?',
        a: "Les éditeurs dominants sont CBA Informatique Libérale (Agathe YOU), Sofia Développement (Albus AIR, Topaze AIR), Cegedim Santé (Simply-Vitale), Epsilog (Vega) et Logisur'M (Soins 2000). À eux cinq, ils couvrent plus de 80% du marché IDEL.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'kines',
    name: 'Kinésithérapeutes',
    shortName: 'kiné',
    hero: 'Évolution des parts de marché des logiciels métier utilisés par les masseurs-kinésithérapeutes français.',
    metaTitle: 'Logiciel kiné le plus utilisé en France (2026) — Vega, Doctolib',
    metaDescription: "Quel logiciel kiné est le plus utilisé en France ? Vega (Epsilog, 42%), Medi+4000 (Cegedim, 20%), Doctolib (15%), Maiia Gestion (11%). Classement à jour, GIE SESAM-Vitale.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Vega', editor: 'Epsilog', share: '42,0%', note: 'leader stable' },
      { rank: 2, name: 'Medi+4000', editor: 'Cegedim Santé', share: '19,5%', note: 'forte érosion' },
      { rank: 3, name: 'Doctolib', editor: 'Doctolib', share: '14,9%', note: 'entrée 2021' },
      { rank: 4, name: 'Maiia Gestion', editor: 'Cegedim Santé', share: '10,7%', note: 'lancement 2024' },
      { rank: 5, name: 'Topaze AIR', editor: 'Sofia Développement', share: '3,6%' },
    ],
    marketAnalysis: `<p>Le logiciel kiné le plus utilisé en France est <strong>Vega</strong>, édité par <strong>Epsilog</strong>, avec <strong>42,0%</strong> des télétransmissions en mars 2026 — soit plus de 4 cabinets de masseurs-kinésithérapeutes sur 10. Il s'agit du leader historique du marché et il a même progressé légèrement sur la période (+2,5 points depuis 2019).</p>
<p>Le top 5 est complété par <strong>Medi+4000</strong> (Cegedim Santé, 19,5%), <strong>Doctolib</strong> (14,9% — entré sur le marché kiné en 2021), <strong>Maiia Gestion</strong> (Cegedim Santé, 10,7% — lancé en 2024) et <strong>Topaze AIR</strong> (Sofia Développement, 3,6%). Ces cinq solutions couvrent 90,7% du marché kiné — c'est l'un des marchés les plus concentrés du paysage libéral.</p>
<p>Côté éditeurs, deux acteurs structurent le marché : <strong>Epsilog</strong> (42% à eux seuls avec Vega) et <strong>Cegedim Santé</strong> (~30% en cumulant Medi+4000 et Maiia Gestion). <strong>Doctolib</strong> est le challenger qui monte : son intégration native avec la prise de RDV est un avantage compétitif fort sur cette spécialité où la file active patient est très importante.</p>`,
    trends: `<p>La grande tendance du marché kiné, c'est l'<strong>érosion de Medi+4000</strong> (Cegedim) qui est passé de 39,4% à 19,5% en 7 ans — soit la moitié de sa base. Cegedim a tenté de récupérer ces utilisateurs avec sa nouvelle solution <strong>Maiia Gestion</strong> (lancée en 2024), qui capte déjà 10,7% du marché — soit quasiment la perte cumulée du groupe.</p>
<p>L'autre grand mouvement, c'est l'arrivée de <strong>Doctolib</strong> sur le marché kiné en 2021. La plateforme de prise de RDV a lancé une fonction logiciel de gestion intégrée et a capté <strong>14,9% du marché en 5 ans</strong> — un rythme de pénétration record. La logique : un kiné qui prend déjà ses RDV sur Doctolib n'a plus de friction à utiliser le module gestion intégré.</p>
<p>Les autres solutions historiques (Kinemax, Topaze classique) ont massivement perdu, en partie remplacées par les versions cloud (Topaze AIR) du même éditeur.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel kiné le plus utilisé en France ?',
        a: "Vega (édité par Epsilog) est le logiciel le plus utilisé par les masseurs-kinésithérapeutes français en 2026, avec 42,0% des télétransmissions. Il est suivi par Medi+4000 (Cegedim, 19,5%), Doctolib (14,9%), Maiia Gestion (Cegedim, 10,7%) et Topaze AIR (3,6%).",
      },
      {
        q: 'Doctolib propose-t-il un logiciel pour les kinés ?',
        a: "Oui, Doctolib propose un logiciel de gestion de cabinet kiné depuis 2021, intégré nativement à sa plateforme de prise de RDV. En 5 ans, il a capté 14,9% du marché kiné français, devenant le 3e logiciel le plus utilisé.",
      },
      {
        q: 'Vega est-il toujours numéro 1 du logiciel kiné ?',
        a: "Oui, Vega d'Epsilog est leader incontesté du marché kiné français depuis plus de 10 ans, avec 42,0% des cabinets en mars 2026 — et sa part a même légèrement progressé sur la période 2019-2026.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'orthophonistes',
    name: 'Orthophonistes',
    shortName: 'orthophoniste',
    hero: 'Évolution des parts de marché des logiciels métier utilisés par les orthophonistes français.',
    metaTitle: 'Logiciel orthophoniste le plus utilisé en France (2026)',
    metaDescription: "Quel logiciel orthophoniste est le plus utilisé en France ? Soins 2000 (Logisur'M, 32%), Vega (Epsilog, 21%), Medi+4000 (Cegedim, 19%), Orthomax (Sofia, 14%). Classement à jour.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Soins 2000', editor: "Logisur'M", share: '32,0%', note: 'leader depuis 2024' },
      { rank: 2, name: 'Vega', editor: 'Epsilog', share: '20,6%', note: 'ex-leader' },
      { rank: 3, name: 'Medi+4000', editor: 'Cegedim Santé', share: '18,7%', note: 'ex-leader' },
      { rank: 4, name: 'Orthomax', editor: 'Sofia Développement', share: '13,7%' },
      { rank: 5, name: 'Topaze AIR', editor: 'Sofia Développement', share: '4,2%' },
    ],
    marketAnalysis: `<p>Le logiciel le plus utilisé par les orthophonistes français est <strong>Soins 2000</strong>, édité par <strong>Logisur'M</strong>, avec <strong>32,0%</strong> des télétransmissions en mars 2026. C'est un changement majeur : Soins 2000 ne représentait que 5,6% du marché en 2019 — il a multiplié sa part par six en 7 ans.</p>
<p>Le top 5 est complété par <strong>Vega</strong> (Epsilog, 20,6%), <strong>Medi+4000</strong> (Cegedim Santé, 18,7%), <strong>Orthomax</strong> (Sofia Développement, 13,7%) et <strong>Topaze AIR</strong> (Sofia Développement, 4,2%). Ces 5 solutions couvrent 89% du marché orthophoniste français.</p>
<p>Le marché orthophoniste a la particularité d'être très concentré (top 3 = 71%) tout en étant assez stable côté nombre d'éditeurs (~22 progiciels actifs). Sofia Développement est l'éditeur dominant si on cumule Orthomax + Topaze AIR + autres (~22%). Logisur'M est le challenger qui s'est imposé en quelques années.</p>`,
    trends: `<p>Le marché orthophoniste a connu un <strong>renversement spectaculaire</strong>. En 2019, le duo de tête était <strong>Medi+4000</strong> (31,4%) et <strong>Vega</strong> (29,7%), qui se partageaient 61% du marché. En 2026, ils ont tous les deux fortement reculé : Medi+4000 à 18,7% (-13 points) et Vega à 20,6% (-9 points). Les utilisateurs déçus des deux ont massivement basculé vers <strong>Soins 2000</strong> de Logisur'M qui a capté +26 points sur la période.</p>
<p>Pourquoi ce basculement ? Soins 2000 a été l'un des premiers progiciels à proposer une <strong>application cloud + mobile complète</strong> pour orthophonistes (gestion bilan, AMO, AIS, télésoins post-COVID), au moment où les acteurs historiques tardaient à moderniser leur stack.</p>
<p>À noter : c'est l'une des rares spécialités où <strong>Doctolib n'est PAS présent comme logiciel de gestion</strong> (uniquement comme plateforme de RDV). Le marché reste donc disputé par les éditeurs spécialisés.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel orthophoniste le plus utilisé en France ?',
        a: "Soins 2000 (édité par Logisur'M) est le logiciel le plus utilisé par les orthophonistes français en 2026, avec 32,0% des télétransmissions. Il est suivi par Vega (Epsilog, 20,6%), Medi+4000 (Cegedim, 18,7%), Orthomax (Sofia, 13,7%) et Topaze AIR (4,2%).",
      },
      {
        q: 'Pourquoi Soins 2000 a-t-il pris la première place ?',
        a: "Soins 2000 (Logisur'M) est passé de 5,6% à 32,0% du marché orthophoniste entre 2019 et 2026. Cette croissance s'explique principalement par sa modernisation cloud + mobile en avance sur les acteurs historiques (Medi+4000 de Cegedim et Vega d'Epsilog), qui ont tardé à mettre à jour leurs solutions.",
      },
      {
        q: 'Doctolib est-il utilisé par les orthophonistes ?',
        a: "Doctolib est utilisé par les orthophonistes pour la prise de rendez-vous, mais Doctolib ne propose pas (ou très marginalement) de logiciel de gestion de cabinet pour cette spécialité. Le marché du logiciel reste donc dominé par les éditeurs spécialisés (Logisur'M, Epsilog, Sofia Développement, Cegedim Santé).",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'pharmacies',
    name: 'Pharmacies',
    shortName: 'pharmacie',
    hero: 'Évolution des parts de marché des logiciels de gestion utilisés par les pharmacies françaises.',
    metaTitle: 'Logiciel pharmacie le plus utilisé en France (2026) — LGPI, Winpharma',
    metaDescription: "Quel logiciel pharmacie est le plus utilisé en France ? LGPI (Equasens, 40%), Winpharma (Everys, 36%), Smart RX FES (11%), Leo 2.0 (CERP Rouen, 7%). Classement à jour.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'ID. (LGPI)', editor: 'Equasens (ex-Pharmagest)', share: '40,0%', note: 'leader stable' },
      { rank: 2, name: 'Winpharma', editor: 'Everys', share: '36,2%', note: 'forte progression' },
      { rank: 3, name: 'Smart RX FES', editor: 'Smart RX (groupe Cegedim)', share: '11,1%', note: 'nouvelle gamme FES' },
      { rank: 4, name: 'Leo 2.0', editor: 'Isipharm (groupe Astera)', share: '7,5%' },
      { rank: 5, name: 'Logiphar FES', editor: 'Smart RX (groupe Cegedim)', share: '1,8%' },
    ],
    marketAnalysis: `<p>Le logiciel pharmacie le plus utilisé en France est <strong>ID. (LGPI)</strong>, édité par <strong>Equasens</strong> (anciennement Pharmagest, leader historique français), avec <strong>40,0%</strong> des télétransmissions en mars 2026 — soit 2 pharmacies sur 5. C'est une part de marché stable depuis 7 ans (40% en 2019, 40% en 2026). À l'échelle européenne, le groupe Equasens revendique plus de <strong>12 000 pharmacies équipées</strong> et une division Pharmagest Europe à <strong>163,5 M€</strong> de chiffre d'affaires en 2024.</p>
<p>Le numéro 2 est <strong>Winpharma</strong>, édité par <strong>Everys</strong>, avec 36,2% du marché — en très forte progression depuis 2019 où il ne représentait que 21%. Everys revendique <strong>plus de 7 800 officines équipées</strong> (28,1 M€ de CA 2024). À eux deux, LGPI et Winpharma équipent <strong>76% des pharmacies françaises</strong> — c'est l'un des marchés les plus duopolistiques de la santé libérale.</p>
<p>Le top 5 est complété par <strong>Smart RX FES</strong> (Smart RX, filiale du <strong>groupe Cegedim</strong>, 11,1% — la nouvelle gamme FES Feuille de Soins Electronique, 40,1 M€ de CA 2024, 15 agences en France), <strong>Leo 2.0</strong> (édité par <strong>Isipharm</strong>, groupe Astera ex-CERP Rouen, 7,5%) et <strong>Logiphar FES</strong> (Smart RX, 1,8%). Le reste du marché est marginal : Caduciel, Periphar, Opus représentent moins de 1% chacun.</p>
<p>Au-delà du top 5 GIE, le marché compte un <strong>long tail d'éditeurs français</strong> à plus petite échelle mais bien implantés : <strong>PharmaVitale</strong> (CEPI), <strong>Pharmaland</strong> (La Source Informatique), <strong>VisioPharm</strong>, <strong>Crystal</strong> (Infosoft, développé depuis 1994), <strong>Vindilis</strong> (créé en 2005) et <strong>Pharmony One</strong> (positionnement SaaS natif cloud). Ces éditeurs adressent souvent des niches (PDA, multi-sites, groupements, cloud natif) et coexistent avec les leaders sur un parc total de <strong>19 898 officines</strong> en France métropolitaine et DOM au 11 mai 2026 (source CNOP, en baisse de 253 officines sur un an). Le marché logiciel + services numériques d'officine se situe dans une fourchette de <strong>160 à 220 M€/an</strong>, dont <strong>90 à 130 M€</strong> de noyau LGO récurrent (estimation analytique).</p>`,
    trends: `<p>La grande tendance du marché pharmacie 2019-2026, c'est la <strong>montée en puissance de Winpharma</strong> (Everys), qui a gagné <strong>+15 points en 7 ans</strong> (de 21% à 36,2%). Cette progression s'est faite principalement aux dépens de l'ancien <strong>Alliance + FES</strong> de Smart RX (19,3% en 2019 → 0% en 2026), qui a été progressivement remplacé par la nouvelle gamme <strong>Smart RX FES</strong> (11,1%).</p>
<p>Equasens (ex-Pharmagest) reste leader stable avec LGPI mais voit sa part marginalement érodée (-1 point sur la période). Les pharmaciens semblent privilégier la stabilité de l'éditeur historique plutôt que de migrer.</p>
<p>À noter : le marché pharmacie est extrêmement concentré (top 4 = 95% du marché), avec une forte intégration verticale (logiciel + grossiste répartiteur + groupement). LGPI est intégré au groupe Equasens (groupements Pharmavie, Optipharm…), Winpharma à l'écosystème Everys, et Leo 2.0 à Isipharm (groupe Astera, ex-CERP Rouen). Le choix de logiciel est souvent indissociable du choix d'écosystème commercial.</p>
<p>La consolidation s'est accélérée en 2025 avec l'<strong>acquisition de la branche ActiPharm de MSI 2000 par Isipharm</strong> en septembre, qui consolide le parc historique vers LEO. Côté réglementaire, l'<strong>ordonnance numérique</strong> est devenue le pivot de la sélection des LGO : au 23 avril 2026, seuls <strong>10 logiciels pharmaciens</strong> ont terminé leur présérie et peuvent déployer France entière — LGPI, LEO, Pharmaland, PharmaVitale, Winpharma, Visiopharm, Pharmony One, Smart Rx, Crystal et Vindilis. Cette liste constitue le noyau dur des LGO actifs et à jour réglementairement.</p>
<p>Sur le plan technique, trois forces structurent désormais le marché : (1) <strong>le socle Ségur</strong> (INS, DMP, DP, MSSanté, Mon espace santé, application carte Vitale, sérialisation France MVO, HDS, FHIR/CI-SIS) devient un coût produit continu, et non une vague de projets ponctuels ; (2) <strong>l'émergence du SaaS natif</strong> (Pharmony One, LEOcloud) challenge le modèle licence + maintenance traditionnel, particulièrement sur les officines multi-sites et les groupements ; (3) <strong>l'IA appliquée à la dispensation et au pilotage de stock</strong> émerge comme le prochain levier de différenciation pour les leaders, avec une exigence forte d'explicabilité et de cadre clinique.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel pharmacie le plus utilisé en France ?',
        a: "ID. (LGPI), édité par Equasens (anciennement Pharmagest), est le logiciel pharmacie le plus utilisé en France en 2026, avec 40,0% des pharmacies. Il est suivi par Winpharma (Everys, 36,2%), Smart RX FES (11,1%), Leo 2.0 de CERP Rouen (7,5%) et Logiphar FES (1,8%).",
      },
      {
        q: 'Quelle est la différence entre Pharmagest et Equasens ?',
        a: "Equasens est le nouveau nom du groupe Pharmagest depuis 2022 (rebranding suite à la diversification du groupe au-delà du logiciel). Le logiciel ID. (LGPI) reste le produit phare de l'entreprise — leader du marché pharmacie français.",
      },
      {
        q: 'LGPI ou Winpharma : lequel est le plus utilisé ?',
        a: "LGPI (Equasens) reste légèrement en tête en mars 2026 avec 40,0% du marché, contre 36,2% pour Winpharma (Everys). L'écart se réduit chaque année — Winpharma a gagné 15 points depuis 2019 alors que LGPI s'est stabilisé. Si la tendance se prolonge, Winpharma pourrait dépasser LGPI d'ici 2028.",
      },
      {
        q: "Quels sont les logiciels pharmacie autorisés pour l'ordonnance numérique en 2026 ?",
        a: "Au 23 avril 2026, 10 logiciels pharmaciens ont terminé leur présérie et sont autorisés à déployer l'ordonnance numérique France entière : LGPI (Equasens), LEO (Isipharm), Pharmaland (La Source Informatique), PharmaVitale (CEPI), Winpharma (Everys), Visiopharm, Pharmony One, Smart Rx (Cegedim), Crystal (Infosoft) et Vindilis. Cette liste constitue le noyau dur des LGO actifs et à jour sur le cadre Ségur (INS, DMP, DP, MSSanté, ApCV).",
      },
      {
        q: "Combien y a-t-il d'officines en France en 2026 ?",
        a: "Au 11 mai 2026, le Conseil national de l'Ordre des pharmaciens (CNOP) recense 19 898 officines en France métropolitaine et DOM, en baisse de 253 officines sur un an. La Cour des comptes rappelle que 156 officines ferment en moyenne chaque année depuis 2007. Le marché des éditeurs de logiciels est donc structurellement orienté vers la migration et l'up-sell de modules, plus que vers l'équipement de nouvelles officines.",
      },
      {
        q: 'Quels sont les autres logiciels pharmacie au-delà du top 5 ?',
        a: "Au-delà du top 5 GIE SESAM-Vitale, le marché compte un long tail d'éditeurs français : PharmaVitale (CEPI), Pharmaland (La Source Informatique), VisioPharm, Crystal (Infosoft, développé depuis 1994), Vindilis (créé en 2005) et Pharmony One (SaaS natif cloud, créé en 2022). Ces éditeurs adressent souvent des niches (PDA, multi-sites, groupements, cloud natif) et représentent ensemble moins de 5% du parc national télétransmis, mais sont visibles sur des segments spécifiques comme les groupements ou les officines multi-sites.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'medecins-specialistes',
    name: 'Médecins Spécialistes',
    shortName: 'médecin spécialiste',
    hero: 'Évolution des parts de marché des logiciels de gestion de cabinet utilisés par les médecins spécialistes français (toutes spécialités hors médecine générale).',
    metaTitle: 'Logiciel médecin spécialiste le plus utilisé en France (2026)',
    metaDescription: "Quel logiciel médical est le plus utilisé par les spécialistes en France ? Doctolib (15%), Xplore (11%), GXD5 RIS (8%), Intellio (6%), Stellair (5%). Marché fragmenté, données GIE SESAM-Vitale.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Doctolib', editor: 'Doctolib', share: '15,4%', note: 'leader depuis 2024' },
      { rank: 2, name: 'Xplore', editor: 'EDL', share: '10,8%', note: 'forte présence imagerie' },
      { rank: 3, name: 'GXD5 RIS', editor: 'Enovacom', share: '7,9%', note: 'spécialités radio' },
      { rank: 4, name: 'Intellio', editor: 'Orisha Healthcare France', share: '5,7%', note: 'leader historique' },
      { rank: 5, name: 'Stellair Integral', editor: 'Olaqin', share: '5,4%' },
    ],
    marketAnalysis: `<p>Le logiciel le plus utilisé par les médecins spécialistes français (toutes spécialités confondues hors médecine générale) est <strong>Doctolib</strong>, qui équipe <strong>15,4%</strong> des cabinets en mars 2026. Il a pris la première place en 2024, profitant de l'effondrement d'AxiSanté (CompuGroup) et de la migration des ex-utilisateurs vers la solution intégrée à la prise de RDV.</p>
<p>Le top 5 est complété par <strong>Xplore</strong> (EDL, 10,8% — très utilisé en radiologie / imagerie médicale), <strong>GXD5 RIS</strong> (Enovacom, 7,9% — solution RIS spécialisée radiologie), <strong>Intellio</strong> (Orisha Healthcare France, 5,7% — leader historique en perte de vitesse) et <strong>Stellair Integral</strong> (Olaqin, 5,4%).</p>
<p>Le marché des médecins spécialistes est <strong>extrêmement fragmenté</strong> : "Autres" (éditeurs hors top 30) représente 16,4% des cabinets — bien plus que pour les généralistes (2,2%). Cette fragmentation s'explique par la diversité des spécialités : chaque discipline (radio, cardio, ophtalmo, dermato, gynéco…) a souvent ses propres éditeurs verticaux. C'est l'un des marchés les plus disputés de la santé libérale française.</p>`,
    trends: `<p>Le marché des médecins spécialistes a vu deux grandes ruptures en 7 ans. D'abord, l'<strong>effondrement d'AxiSanté</strong> (CompuGroup Medical) qui est passé de 10,2% à 0% en 2026 — même histoire que chez les généralistes, l'éditeur a annoncé la fin du produit. Deuxièmement, la <strong>conquête de Doctolib</strong> qui est passé de 0% à 15,4%, capitalisant sur sa plateforme RDV pour vendre son module logiciel intégré.</p>
<p>Côté éditeurs spécialisés, <strong>Xplore</strong> (EDL) progresse régulièrement (+5,3 points) en consolidant sa position chez les radiologues. <strong>HelloDoc</strong> (Imagine Editions) recule fortement (-6 points), perdant des utilisateurs à Doctolib et CGM eVitale. <strong>Intellio</strong> (Orisha) a perdu 6,6 points — symptôme du vieillissement de la solution face aux nouvelles offres cloud.</p>
<p>La tendance dominante est claire : les <strong>spécialités à forte composante imagerie/RIS</strong> (radio, imagerie, cardio interventionnelle) restent fidèles à des éditeurs verticaux (Xplore, GXD5 RIS), tandis que les <strong>spécialités cliniques classiques</strong> (gynéco, dermato, etc.) basculent vers Doctolib pour profiter de l'intégration RDV/téléconsultation.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel médical le plus utilisé par les spécialistes en France ?',
        a: "Doctolib est le logiciel le plus utilisé par les médecins spécialistes français en 2026, avec 15,4% des télétransmissions. Il est suivi par Xplore (EDL, 10,8%), GXD5 RIS (Enovacom, 7,9%), Intellio (Orisha Healthcare, 5,7%) et Stellair Integral (Olaqin, 5,4%).",
      },
      {
        q: 'Pourquoi le marché du logiciel médecin spécialiste est-il si fragmenté ?',
        a: "Les médecins spécialistes regroupent une trentaine de disciplines (radiologie, cardiologie, ophtalmologie, dermatologie, gynécologie, etc.) avec des besoins métier très spécifiques. Cela favorise les éditeurs verticaux (Xplore et GXD5 pour la radio, par exemple) plutôt qu'un éditeur généraliste unique. C'est pourquoi 16% des cabinets utilisent un logiciel hors top 30.",
      },
      {
        q: 'Doctolib est-il adapté à toutes les spécialités médicales ?',
        a: "Doctolib est adapté à la plupart des spécialités cliniques (gynéco, dermato, endocrino, etc.) et a fortement progressé chez ces praticiens. Il est en revanche moins utilisé chez les spécialistes nécessitant un RIS ou un PACS (radiologues, anatomopathologistes), qui restent fidèles à Xplore (EDL) ou GXD5 RIS (Enovacom).",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'opticiens',
    name: 'Opticiens',
    shortName: 'opticien',
    hero: 'Évolution des parts de marché des logiciels de gestion utilisés par les opticiens-lunetiers français.',
    metaTitle: 'Logiciel opticien le plus utilisé en France (2026) — Cosium, Optimum',
    metaDescription: "Quel logiciel opticien est le plus utilisé en France ? Cosium Center (30%), Optimum Live (22%), MyEasyOptic (14%), Seeneo (6%), Ivoirnet (5%). Données GIE SESAM-Vitale, classement à jour.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Cosium Center', editor: 'Cosium', share: '30,5%', note: 'leader stable' },
      { rank: 2, name: 'Optimum Live', editor: 'Optimum CIT', share: '21,5%', note: 'forte progression' },
      { rank: 3, name: 'MyEasyOptic', editor: 'Cristallin', share: '13,7%', note: 'arrivé en 2021' },
      { rank: 4, name: 'Seeneo', editor: 'GrandVision France', share: '6,2%', note: 'enseigne intégrée' },
      { rank: 5, name: 'Ivoirnet', editor: 'VerticalOptic', share: '4,8%' },
    ],
    marketAnalysis: `<p>Le logiciel opticien le plus utilisé en France est <strong>Cosium Center</strong>, édité par <strong>Cosium</strong>, avec <strong>30,5%</strong> des télétransmissions en mars 2026 — soit près d'un magasin d'optique sur trois. C'est le leader historique du marché et il a même progressé sur la période (+8 points depuis 2019).</p>
<p>Le top 5 est complété par <strong>Optimum Live</strong> (Optimum CIT, 21,5% — en forte croissance), <strong>MyEasyOptic</strong> (Cristallin, 13,7% — solution cloud arrivée en 2021), <strong>Seeneo</strong> (GrandVision France, 6,2% — solution intégrée à l'enseigne) et <strong>Ivoirnet</strong> (VerticalOptic, 4,8%).</p>
<p>Côté éditeurs, deux acteurs dominent : <strong>Cosium</strong> (30,5%) et <strong>Optimum CIT</strong> (21,5%). Le marché optique est particulier car il est très lié aux <strong>centrales d'achat et enseignes</strong> (Krys, Optic 2000, Atol, GrandVision, Afflelou…), ce qui structure les choix de logiciels — chaque enseigne tend à promouvoir une solution spécifique auprès de ses adhérents.</p>`,
    trends: `<p>La grande tendance du marché optique, c'est la <strong>sortie en règle d'Orisha Healthcare</strong> (ex-Mainca/Wavesoft Optique) qui a perdu son trio gagnant : Intellio Editeurs (-8,7 pts), Winoptics (-6,4 pts) et MyEasyOptic + Web Intellio (-5,8 pts). Ces utilisateurs ont migré vers Cosium, Optimum Live et la nouvelle marque indépendante MyEasyOptic (Cristallin).</p>
<p><strong>Optimum Live</strong> a triplé sa part de marché (de 6,9% à 21,5%) — porté par sa solution SaaS et son intégration omnicanal (e-commerce, prise de RDV, téléconsultation). <strong>MyEasyOptic</strong> est arrivé sur le marché en 2021 et a directement capté 13,7% du marché en 5 ans, avec une stratégie cloud-first et mobile-first.</p>
<p>Côté enseignes, <strong>Synergie Optique</strong> (logiciel groupe GrandVision avant la fusion EssilorLuxottica) a disparu (-9 pts) au profit de <strong>Seeneo</strong>, le successeur. C'est un marché en pleine restructuration consolidée par 2-3 éditeurs cloud modernes.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel opticien le plus utilisé en France ?',
        a: "Cosium Center (édité par Cosium) est le logiciel le plus utilisé par les opticiens français en 2026, avec 30,5% des télétransmissions. Il est suivi par Optimum Live (21,5%), MyEasyOptic (13,7%), Seeneo de GrandVision (6,2%) et Ivoirnet (4,8%).",
      },
      {
        q: 'Quelle est la différence entre Cosium et Optimum Live ?',
        a: "Cosium Center et Optimum Live sont les deux principaux logiciels opticiens en France. Cosium est le leader historique (depuis les années 2000) avec une approche desktop classique enrichie de modules cloud. Optimum Live est une solution 100% SaaS plus récente, avec intégration native omnicanale (boutique + e-commerce + RDV).",
      },
      {
        q: 'Quels logiciels sont utilisés par les enseignes Krys, Optic 2000 et Afflelou ?',
        a: "Les grandes enseignes optiques françaises promeuvent généralement leur propre solution ou une solution préférentielle auprès de leurs adhérents. Seeneo (GrandVision France) est lié au réseau GrandVision/EssilorLuxottica. Cosium Center est très répandu chez les indépendants et plusieurs groupements. Les choix précis varient selon le contrat de franchise.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'audioprothesistes',
    name: 'Audioprothésistes',
    shortName: 'audioprothésiste',
    hero: 'Évolution des parts de marché des logiciels de gestion utilisés par les audioprothésistes français.',
    metaTitle: 'Logiciel audioprothésiste le plus utilisé en France (2026) — Cosium',
    metaDescription: "Quel logiciel audioprothésiste est le plus utilisé en France ? Cosium Center (45%), IDM Software (12%), Optimum Live (5%). Marché concentré, données GIE SESAM-Vitale.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Cosium Center', editor: 'Cosium', share: '45,0%', note: 'leader incontesté' },
      { rank: 2, name: 'IDM Software', editor: 'IDM', share: '11,8%', note: 'spécialiste audio' },
      { rank: 3, name: 'Optimum Live', editor: 'Optimum CIT', share: '4,8%' },
      { rank: 4, name: 'Intellio Editeurs', editor: 'Orisha Healthcare France', share: '0,7%' },
      { rank: 5, name: 'MyEasyOptic', editor: 'Cristallin', share: '0,3%' },
    ],
    marketAnalysis: `<p>Le logiciel audioprothésiste le plus utilisé en France est <strong>Cosium Center</strong>, édité par <strong>Cosium</strong>, avec <strong>45,0%</strong> des télétransmissions en mars 2026 — soit près d'un audioprothésiste sur deux. Le même éditeur leader sur le marché optique a transposé son offre avec succès sur l'audiologie.</p>
<p>Le numéro 2 est <strong>IDM Software</strong> (édité par <strong>IDM</strong>), avec 11,8% — un spécialiste 100% audio bien implanté dans le métier. Le top 5 se complète par <strong>Optimum Live</strong> (Optimum CIT, 4,8%), <strong>Intellio Editeurs</strong> (Orisha Healthcare, 0,7%) et <strong>MyEasyOptic</strong> (Cristallin, 0,3% — surtout présent quand les centres mixtes optique+audio sont équipés en MyEasyOptic).</p>
<p>Le marché de l'audiologie est très <strong>concentré sur Cosium</strong> (45%) mais reste structuré comme un marché de niche : "Autres" (éditeurs marginaux ou non répertoriés) représente encore 37% des centres — c'est l'une des spécialités où les solutions verticales artisanales tiennent face aux grands éditeurs.</p>`,
    trends: `<p>La tendance dominante du marché audioprothésiste, c'est la <strong>consolidation de Cosium</strong> qui est passé de 28,7% à 45,0% en 7 ans (+16 points). Cette croissance se fait au détriment des solutions historiques non répertoriées ("Autres" est passé de 70,6% à 37,0% — soit -33 points), signe d'une professionnalisation et concentration progressive du marché.</p>
<p><strong>IDM Software</strong> a fait son apparition au top en 2021-2022 et capte désormais 11,8% du marché — c'est le challenger principal de Cosium, avec une approche 100% audio (vs Cosium qui couvre aussi l'optique).</p>
<p>Le contexte réglementaire 100% Santé (Reste à Charge Zéro) lancé en 2021 a fortement accéléré la digitalisation des audioprothésistes — les solutions logicielles plus modernes (devis, prise en charge mutuelle automatisée) ont gagné des utilisateurs au détriment des vieilles solutions Excel/Access maison.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel audioprothésiste le plus utilisé en France ?',
        a: "Cosium Center (édité par Cosium) est le logiciel le plus utilisé par les audioprothésistes français en 2026, avec 45,0% des télétransmissions. Il est suivi par IDM Software (11,8%), Optimum Live (4,8%), Intellio Editeurs (0,7%) et MyEasyOptic (0,3%).",
      },
      {
        q: 'Pourquoi Cosium domine-t-il à la fois optique et audiologie ?',
        a: "Cosium a historiquement développé son logiciel pour les opticiens, puis a étendu sa couverture aux audioprothésistes — un métier connexe puisque de nombreux centres regroupent les deux activités. Cette mutualisation logicielle (optique + audio) avec une seule licence est un avantage compétitif fort, ce qui explique la part de marché élevée de Cosium chez les audioprothésistes (45%).",
      },
      {
        q: "L'audiologie est-elle un marché concentré ou fragmenté ?",
        a: "C'est un marché en cours de concentration : Cosium détient 45% des centres, mais 37% utilisent encore des solutions non répertoriées (logiciels propriétaires, Excel maison, etc.). La professionnalisation s'est accélérée depuis le 100% Santé en 2021, et la tendance va vers une consolidation progressive sur 2-3 éditeurs principaux d'ici 2028.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'orthoptistes',
    name: 'Orthoptistes',
    shortName: 'orthoptiste',
    hero: 'Évolution des parts de marché des logiciels métier utilisés par les orthoptistes français.',
    metaTitle: 'Logiciel orthoptiste le plus utilisé en France (2026)',
    metaDescription: "Quel logiciel orthoptiste est le plus utilisé en France ? Medi+4000 (Cegedim, 31%), Vega (Epsilog, 15%), Topaze AIR (5%), Orthomax (5%). Classement à jour, GIE SESAM-Vitale.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Medi+4000', editor: 'Cegedim Santé', share: '30,9%', note: 'leader stable' },
      { rank: 2, name: 'Vega', editor: 'Epsilog', share: '14,9%', note: 'en progression' },
      { rank: 3, name: 'Topaze AIR', editor: 'Sofia Développement', share: '5,3%', note: 'gamme cloud' },
      { rank: 4, name: 'Orthomax', editor: 'Sofia Développement', share: '5,3%' },
      { rank: 5, name: 'Acteur.fr', editor: 'Aatlantide', share: '4,3%' },
    ],
    marketAnalysis: `<p>Le logiciel orthoptiste le plus utilisé en France est <strong>Medi+4000</strong>, édité par <strong>Cegedim Santé</strong>, avec <strong>30,9%</strong> des télétransmissions en mars 2026. C'est le leader stable du marché depuis plus de 10 ans, avec une part qui s'est légèrement érodée (-5 points depuis 2019) mais qui reste très majoritaire.</p>
<p>Le top 5 est complété par <strong>Vega</strong> (Epsilog, 14,9% — en progression), <strong>Topaze AIR</strong> (Sofia Développement, 5,3% — la nouvelle gamme cloud), <strong>Orthomax</strong> (Sofia Développement, 5,3%) et <strong>Acteur.fr</strong> (Aatlantide, 4,3%). Au cumul, ces 5 solutions couvrent environ 60% du marché orthoptiste.</p>
<p>Côté éditeurs, <strong>Cegedim Santé</strong> reste dominant avec Medi+4000 (31%). <strong>Sofia Développement</strong> arrive en deuxième position avec ~10% via Orthomax + Topaze AIR. Une particularité du marché : "Autres" (éditeurs hors top 10) représente 21% — signe d'une fragmentation forte avec de nombreux éditeurs spécialisés dans la rééducation visuelle.</p>`,
    trends: `<p>Le marché orthoptiste évolue lentement comparé à d'autres spécialités. <strong>Medi+4000</strong> reste leader mais perd doucement du terrain (-5 points en 7 ans). Les principaux gagnants en parts de marché sont les éditeurs de "petite niche" — la catégorie "Autres" est passée de 9,5% à 20,9% (+11 points), signe que le marché se diversifie vers de nouveaux éditeurs verticaux.</p>
<p><strong>Intellio</strong> (Orisha Healthcare) a perdu la moitié de sa base (-4,2 points), passant à 3,8% en 2026. <strong>Acteur.fr</strong> (Aatlantide) a aussi reculé (-4,4 points). À l'inverse, <strong>Topaze AIR</strong> (Sofia Développement) est arrivé en force avec sa gamme cloud (+5,3 points en 5 ans).</p>
<p>Tendance à surveiller : les orthoptistes sont une <strong>profession en forte croissance démographique</strong> en France (les nouveaux installés sont nombreux), ce qui crée de l'opportunité pour les éditeurs cloud-first qui captent les jeunes praticiens. Sofia Développement avec Topaze AIR semble bien positionné sur cette dynamique.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel orthoptiste le plus utilisé en France ?',
        a: "Medi+4000 (édité par Cegedim Santé) est le logiciel le plus utilisé par les orthoptistes français en 2026, avec 30,9% des télétransmissions. Il est suivi par Vega (Epsilog, 14,9%), Topaze AIR (Sofia Développement, 5,3%), Orthomax (Sofia, 5,3%) et Acteur.fr (Aatlantide, 4,3%).",
      },
      {
        q: 'Vega est-il adapté aux orthoptistes ?',
        a: "Oui, Vega d'Epsilog est utilisé par 14,9% des orthoptistes français. C'est le logiciel polyvalent le plus utilisé pour les paramédicaux libéraux (kiné, infirmier, orthophoniste, orthoptiste) — il s'adapte aux besoins métier avec des modules spécifiques.",
      },
      {
        q: 'Y a-t-il un logiciel spécialisé pour la rééducation visuelle ?',
        a: "Oui, plusieurs éditeurs proposent des modules ou logiciels spécialisés pour la rééducation visuelle (orthoptie). Orthomax (Sofia Développement) est l'un des plus connus, conçu spécifiquement pour les orthoptistes. Cependant, la majorité des praticiens utilisent des logiciels polyvalents (Medi+4000, Vega) qu'ils adaptent à leur exercice.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'sages-femmes',
    name: 'Sages-Femmes',
    shortName: 'sage-femme',
    hero: 'Évolution des parts de marché des logiciels métier utilisés par les sages-femmes libérales françaises.',
    metaTitle: 'Logiciel sage-femme le plus utilisé en France (2026) — MaieuticApp, Weda',
    metaDescription: "Quel logiciel sage-femme est le plus utilisé en France ? MaieuticApp (FT Labs, 23%), Weda (18%), Medi+4000 (Cegedim, 14%), Acteur.fr (9%). Classement à jour.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'MaieuticApp', editor: 'FT Labs', share: '23,1%', note: 'spécialisé sage-femme' },
      { rank: 2, name: 'Weda', editor: 'Vidal France', share: '18,1%', note: 'forte progression' },
      { rank: 3, name: 'Medi+4000', editor: 'Cegedim Santé', share: '13,6%' },
      { rank: 4, name: 'Acteur.fr', editor: 'Aatlantide', share: '9,1%', note: 'ex-leader' },
      { rank: 5, name: 'Simply-Vitale', editor: 'Cegedim Santé', share: '8,3%' },
    ],
    marketAnalysis: `<p>Le logiciel sage-femme le plus utilisé en France est <strong>MaieuticApp</strong>, édité par <strong>FT Labs</strong>, avec <strong>23,1%</strong> des télétransmissions en mars 2026. C'est un nouvel entrant 100% spécialisé sage-femme arrivé sur le marché en 2020-2021, qui est devenu leader en moins de 5 ans grâce à une UX adaptée au métier (suivi grossesse, suivi gynéco, échographies).</p>
<p>Le top 5 est complété par <strong>Weda</strong> (Vidal France, 18,1% — forte progression), <strong>Medi+4000</strong> (Cegedim Santé, 13,6%), <strong>Acteur.fr</strong> (Aatlantide, 9,1% — l'ex-leader historique) et <strong>Simply-Vitale</strong> (Cegedim Santé, 8,3%). Ensemble ces 5 solutions couvrent 72% du marché.</p>
<p>Si on cumule par éditeur, le marché est partagé entre <strong>Vidal France</strong> (Weda, 18,1% — cloud moderne) et <strong>Cegedim Santé</strong> (~22% via Medi+4000 = polyvalent éprouvé, et Simply-Vitale = mobile). FT Labs (MaieuticApp) reste le seul concurrent majeur 100% spécialisé sage-femme.</p>`,
    trends: `<p>Le marché sage-femme a connu un <strong>renversement spectaculaire</strong> en 7 ans. En 2019, le trio de tête était <strong>Intellio</strong> (Orisha, 21,8%), <strong>Medi+4000</strong> (18,4%) et <strong>Acteur.fr</strong> (18,1%). En 2026, Intellio s'est effondré (-14 points → 7,9%) et Acteur.fr a aussi fortement reculé (-9 points → 9,1%).</p>
<p>Les grands gagnants : <strong>MaieuticApp</strong> (FT Labs, +23 points en 5 ans — partant de zéro) et <strong>Weda</strong> (+18 points — partant de zéro aussi). Ces deux solutions cloud modernes ont profité de la lassitude des sages-femmes envers les logiciels génériques pour capter le marché avec des fonctionnalités métier dédiées (terme grossesse, suivi prénatal, courrier de naissance).</p>
<p>La leçon : sur les <strong>petites spécialités libérales</strong> (sage-femme, podologue, orthoptiste), il y a de la place pour des éditeurs verticaux 100% spécialisés. MaieuticApp en est l'illustration parfaite — un logiciel pensé "pour les sages-femmes par des sages-femmes" peut prendre le marché en 4-5 ans face aux mastodontes généralistes.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel sage-femme le plus utilisé en France ?',
        a: "MaieuticApp (édité par FT Labs) est le logiciel le plus utilisé par les sages-femmes libérales françaises en 2026, avec 23,1% des télétransmissions. Il est suivi par Weda (Vidal France, 18,1%), Medi+4000 (Cegedim, 13,6%), Acteur.fr (9,1%) et Simply-Vitale (8,3%).",
      },
      {
        q: "Qu'est-ce que MaieuticApp ?",
        a: "MaieuticApp est un logiciel de gestion de cabinet 100% spécialisé pour les sages-femmes libérales, édité par FT Labs. Lancé en 2020-2021, il propose des fonctionnalités métier dédiées (suivi de grossesse, terme, suivi gynéco, courrier de naissance, télésoin) et a été conçu en collaboration avec des sages-femmes en exercice. Il est devenu leader du marché en moins de 5 ans.",
      },
      {
        q: 'Doctolib propose-t-il un logiciel pour les sages-femmes ?',
        a: "Doctolib est utilisé par les sages-femmes pour la prise de RDV mais son module de gestion de cabinet n'a pas (encore) gagné une part de marché significative chez cette spécialité — qui privilégie MaieuticApp et Weda. Côté éditeurs, Vidal France (Weda) capte 18% du marché, et Cegedim ~22% via ses 2 logiciels (Medi+4000, Simply-Vitale).",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'pedicures-podologues',
    name: 'Pédicures-Podologues',
    shortName: 'pédicure-podologue',
    hero: 'Évolution des parts de marché des logiciels métier utilisés par les pédicures-podologues français.',
    metaTitle: 'Logiciel pédicure-podologue le plus utilisé en France (2026)',
    metaDescription: "Quel logiciel podologue est le plus utilisé en France ? Medi+4000 (Cegedim, 25%), Intellio (Orisha, 7%), Televitale (Sofia, 6%). Marché fragmenté, données GIE SESAM-Vitale.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Medi+4000', editor: 'Cegedim Santé', share: '24,8%', note: 'leader en érosion' },
      { rank: 2, name: 'Intellio', editor: 'Orisha Healthcare France', share: '6,9%' },
      { rank: 3, name: 'Televitale', editor: 'Sofia Développement', share: '6,3%' },
      { rank: 4, name: 'Vital Online', editor: 'Mediconcept', share: '4,0%' },
      { rank: 5, name: 'Andréane', editor: 'Andréane (Centre de Gestion)', share: '1,9%' },
    ],
    marketAnalysis: `<p>Le logiciel pédicure-podologue le plus utilisé en France est <strong>Medi+4000</strong>, édité par <strong>Cegedim Santé</strong>, avec <strong>24,8%</strong> des télétransmissions en mars 2026. C'est le leader historique du marché libéral de la podologie, mais il a perdu près de 11 points en 7 ans (de 35,6% en 2019 à 24,8% en 2026).</p>
<p>Le top 5 est complété par <strong>Intellio</strong> (Orisha Healthcare France, 6,9%), <strong>Televitale</strong> (Sofia Développement, 6,3%), <strong>Vital Online</strong> (Mediconcept, 4,0%) et <strong>Andréane</strong> (1,9%). Le top 5 ne couvre que 44% du marché — c'est l'un des marchés les plus fragmentés de la santé libérale française.</p>
<p>"Autres" (éditeurs hors top 10) représente <strong>46% des cabinets</strong> — la majorité des podologues utilisent donc une solution "longue traîne". Cette particularité s'explique par les besoins très spécifiques du métier (suivi posturologique, semelles orthopédiques, soins du pied diabétique) qui ne sont pas toujours bien couverts par les éditeurs généralistes.</p>`,
    trends: `<p>Le marché podologue est en pleine <strong>fragmentation</strong>. <strong>Medi+4000</strong>, leader historique, a perdu près d'un tiers de sa base (-11 points), au profit principalement de la catégorie "Autres" qui est passée de 21% à 46% (+25 points). Ce n'est pas un autre logiciel qui s'impose, c'est une multitude de petits éditeurs qui captent les utilisateurs déçus.</p>
<p>Côté concurrents directs, <strong>Intellio</strong> (Orisha) a perdu près de la moitié de sa part (-7,9 points) et <strong>Televitale</strong> (Sofia) a aussi reculé (-3,4 points). À ce stade, aucun éditeur cloud moderne n'a réussi à capter le marché podologue de manière dominante — contrairement aux sages-femmes (MaieuticApp) ou aux orthophonistes (Soins 2000).</p>
<p>Opportunité : c'est probablement le marché santé libéral le plus <strong>ouvert à un nouvel entrant cloud-first</strong>. Un éditeur qui proposerait un logiciel 100% spécialisé podologie (gestion semelles, suivi diabétique, posturologie) avec une UX moderne pourrait facilement capter 20-30% du marché en quelques années.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel pédicure-podologue le plus utilisé en France ?',
        a: "Medi+4000 (édité par Cegedim Santé) est le logiciel le plus utilisé par les pédicures-podologues français en 2026, avec 24,8% des télétransmissions. Il est suivi par Intellio (Orisha Healthcare, 6,9%), Televitale (Sofia Développement, 6,3%), Vital Online (Mediconcept, 4,0%) et Andréane (1,9%).",
      },
      {
        q: 'Pourquoi le marché podologue est-il si fragmenté ?',
        a: "46% des podologues utilisent un logiciel hors top 10. Cela s'explique par les besoins métier très spécifiques (gestion semelles orthopédiques, posturologie, soins du pied diabétique, comptabilité auto-entrepreneur) qui ne sont pas toujours bien couverts par les éditeurs généralistes. Les podologues compensent en utilisant soit des solutions spécialisées de niche, soit des logiciels artisanaux/Excel.",
      },
      {
        q: 'Y a-t-il un logiciel cloud spécialisé pour les podologues ?',
        a: "Aucun éditeur cloud-first n'a encore réussi à dominer le marché podologue français. Les solutions polyvalentes (Medi+4000, Intellio, Televitale) restent majoritaires mais perdent du terrain. C'est probablement le marché santé libéral français le plus ouvert à un nouvel entrant qui proposerait un logiciel spécialisé moderne avec gestion semelles et posturologie.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'centres-sante',
    name: 'Centres de santé',
    shortName: 'centre de santé',
    hero: 'Évolution des parts de marché des logiciels de gestion utilisés par les centres de santé pluri-professionnels français.',
    metaTitle: 'Logiciel centre de santé le plus utilisé en France (2026) — Intellio, Veasy',
    metaDescription: "Quel logiciel centre de santé est le plus utilisé en France ? Intellio Editeurs (Orisha, 24%), Veasy (Visiodent, 17%), Galaxie Soins (Xtrem, 15%), Albus AIR (8%). Classement à jour.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Intellio Editeurs', editor: 'Orisha Healthcare France', share: '24,3%', note: 'leader depuis 2024' },
      { rank: 2, name: 'Veasy', editor: 'Visiodent', share: '17,0%', note: 'forte progression' },
      { rank: 3, name: 'Galaxie Soins', editor: 'Xtrem Santé', share: '14,6%', note: 'historique CDS' },
      { rank: 4, name: 'Albus AIR', editor: 'Sofia Développement', share: '8,0%' },
      { rank: 5, name: 'MonLogicielMedical.com', editor: 'Cegedim Santé', share: '5,7%' },
    ],
    marketAnalysis: `<p>Le logiciel le plus utilisé par les centres de santé en France est <strong>Intellio Editeurs</strong>, édité par <strong>Orisha Healthcare France</strong>, avec <strong>24,3%</strong> des télétransmissions en mars 2026. C'est une remontée spectaculaire : Intellio Editeurs ne représentait que 1,6% du marché en 2019.</p>
<p>Le top 5 est complété par <strong>Veasy</strong> (Visiodent, 17,0% — la nouvelle gamme cloud en très forte progression), <strong>Galaxie Soins</strong> (Xtrem Santé, 14,6% — le logiciel historique des centres de santé pluri-professionnels), <strong>Albus AIR</strong> (Sofia Développement, 8,0%) et <strong>MonLogicielMedical.com</strong> (Cegedim Santé, 5,7%).</p>
<p>Les centres de santé ont des besoins logiciels spécifiques : <strong>multi-praticiens</strong> (médecins, infirmiers, dentistes, kinés en parallèle), <strong>tiers-payant complet</strong>, <strong>suivi populationnel</strong>, <strong>reporting ARS</strong>. C'est pourquoi le marché est dominé par des solutions intégrées capables de gérer plusieurs spécialités sur le même dossier patient — Intellio Editeurs et Veasy ont fait leur force sur cette polyvalence.</p>`,
    trends: `<p>Le marché des centres de santé a été <strong>complètement reconfiguré</strong> en 7 ans. <strong>Intellio Editeurs</strong> (Orisha) a multiplié sa part par 15 (de 1,6% à 24,3%, soit +23 points). <strong>Veasy</strong> (Visiodent) a fait pareil (de 1,5% à 17,0%, +15 points). Ces deux solutions ont remplacé les acteurs historiques.</p>
<p>Les grands perdants : <strong>Televitale</strong> (Sofia, -10 points), <strong>HelloDoc</strong> (Imagine Editions, -7,8 points) et <strong>AMIES</strong> (Maidis, -6,3 points) — toutes des solutions desktop classiques peu adaptées au mode multi-praticiens des centres de santé modernes.</p>
<p>Un facteur clé : la <strong>politique de financement des centres de santé</strong> par l'État (avec exigences de reporting accru) et le développement des centres pluri-professionnels (CPTS, MSP) ont rebattu les cartes. Les centres ont besoin de solutions cloud capables d'agréger les données de tous les praticiens — d'où le succès de Veasy et Intellio Editeurs.</p>`,
    faq: [
      {
        q: 'Quel est le logiciel centre de santé le plus utilisé en France ?',
        a: "Intellio Editeurs (Orisha Healthcare France) est le logiciel le plus utilisé par les centres de santé français en 2026, avec 24,3% des télétransmissions. Il est suivi par Veasy (Visiodent, 17,0%), Galaxie Soins (Xtrem Santé, 14,6%), Albus AIR (Sofia, 8,0%) et MonLogicielMedical.com (Cegedim, 5,7%).",
      },
      {
        q: 'Quelle est la différence entre un centre de santé et un cabinet médical ?',
        a: "Un centre de santé regroupe plusieurs professionnels de santé (médecins, infirmiers, dentistes, kinés…) sur le même site avec un mode salarié et un dossier patient commun. Un cabinet médical libéral est généralement mono-spécialité (ou en exercice individuel/groupe restreint). Les centres de santé ont donc besoin de logiciels multi-praticiens et tiers-payant intégral, ce qui explique la spécificité de ce marché.",
      },
      {
        q: 'Galaxie Soins est-il toujours utilisé en centre de santé ?',
        a: "Oui, Galaxie Soins (Xtrem Santé) reste un acteur important du marché centre de santé en France avec 14,6% des structures en mars 2026. C'est le 3e logiciel le plus utilisé, derrière Intellio Editeurs et Veasy. Il est particulièrement implanté dans les CDS historiques (mutuelles, municipaux) qui privilégient sa stabilité.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────
  {
    slug: 'laboratoires-analyses',
    name: "Laboratoires d'analyses",
    shortName: "laboratoire d'analyses",
    hero: "Évolution des parts de marché des logiciels de gestion (LIMS / SGL) utilisés par les laboratoires d'analyses biomédicales français.",
    metaTitle: "Logiciel laboratoire d'analyses le plus utilisé en France (2026) — Hexalis",
    metaDescription: "Quel logiciel laboratoire d'analyses biomédicales est le plus utilisé en France ? Hexalis (Dedalus, 32%) leader. Données GIE SESAM-Vitale, classement à jour.",
    source: 'GIE SESAM-Vitale',
    asOf: 'mars 2026',
    topPlayers: [
      { rank: 1, name: 'Hexalis', editor: 'Dedalus Healthcare France', share: '32,0%', note: 'leader stable' },
      { rank: 2, name: 'Clarilab', editor: 'Clarisys Informatique', share: '6,0%' },
      { rank: 3, name: 'Autres (non répertoriés)', editor: 'multiples', share: '62,0%', note: 'longue traîne' },
    ],
    marketAnalysis: `<p>Sur la métrique GIE SESAM-Vitale (télétransmissions des FSE de mars 2026), <strong>Hexalis</strong>, édité par <strong>Dedalus Healthcare France</strong>, ressort à <strong>32,0%</strong>, suivi de <strong>Clarilab</strong> (Clarisys Informatique, 6,0%). Mais cette mesure ne capture qu'une partie du paysage : les FSE renvoyées par chaque progiciel n'incluent ni les autres solutions du même éditeur, ni les modules de facturation déportés vers d'autres briques. En base installée réelle sur les laboratoires de biologie médicale (LBM) de ville, le marché est nettement plus concentré et clairement <strong>oligopolistique</strong>.</p>
<p><strong>Dedalus est le leader dominant</strong>, avec une part estimée entre <strong>45 et 60%</strong> du marché LBM de ville en cumulant ses produits (Hexalis, KaliSil, KaliLab, Halia, portails, archivage). L'éditeur revendique près de 2 700 laboratoires de biologie médicale en France et DOM-TOM. Derrière, un deuxième cercle de six acteurs se partage l'essentiel du reste du marché :</p>
<ul>
<li><strong>Technidata</strong> (TDNexLabs) — 10 à 15%, fort sur les plateaux techniques et la microbiologie</li>
<li><strong>Clinisys, ex-MIPS</strong> (GLIMS, Clinisys Laboratory Solution) — 8 à 12%, paramétrable, présence historique AP-HP</li>
<li><strong>Softway Medical Biologie</strong>, ex-Histone (Lamweb, Midisya) — 5 à 8%, offre 100% SaaS référencée Ségur</li>
<li><strong>Inlog</strong> (EdgeLab, Inlog4Prescription, Inlog4QMS) — 4 à 7%, racheté par GENII en 2024</li>
<li><strong>CGM Lab France</strong> (MOLIS, CGM CHANNEL) — 2 à 5%, intégré à l'écosystème CompuGroup Medical</li>
<li><strong>Clarisys</strong> (Clarilab, MCA, Dashboard) — 2 à 4%, acteur français spécialisé positionné sur le middleware et les labos privés (Inovie est client MCA)</li>
</ul>
<p>Le marché logiciel cœur LBM ville pèse environ <strong>60 à 90 M€ par an</strong> (70 à 110 M€ en intégrant l'infogérance, le middleware et la cybersécurité), pour un marché aval des analyses de ville de 4,7 Md€ en 2024 (DREES). La demande est concentrée : selon l'IGAS, <strong>environ 75% des sites</strong> (sur ~4 300 implantations et ~300 entités juridiques) sont contrôlés par <strong>six grands groupes</strong> — Cerba HealthCare, Synlab, Biogroup, Eurofins Biomnis, Inovie, Laborizon.</p>`,
    trends: `<p>Sur les FSE télétransmises (métrique GIE SESAM-Vitale), la grande évolution 2019-2026 est la <strong>disparition de Progimed FSE</strong> (Dedalus), passé de 23,8% à 0% en 7 ans. Dedalus a migré ses utilisateurs Progimed vers Hexalis, qui reste leader stable à 32%. <strong>Clarilab</strong> a doublé sa part (de 2,5% à 6,0%), porté par son positionnement "challenger indépendant" face au géant Dedalus.</p>
<p>La vraie tendance de fond, c'est la <strong>consolidation côté éditeurs</strong>, en miroir de la consolidation côté laboratoires :</p>
<ul>
<li>Medasys est devenu Dedalus France (2019), absorbé dans le groupe italien Dedalus</li>
<li>Clinisys a racheté MIPS et regroupé ses actifs LIS/LIMS sous une marque unique (devenu plus grand fournisseur européen de LIS dans son récit corporate)</li>
<li>Technidata a rejoint TSS, logique de build-up logiciel vertical</li>
<li>Softway Medical a racheté Histone et créé Softway Medical Biologie — première vraie entrée d'un grand éditeur français santé sur la biologie</li>
<li>GENII a racheté Inlog en 2024, renforçant la verticale labo en Europe</li>
</ul>
<p><strong>Contrairement à une idée répandue, les grands groupes de biologie n'ont pas tous développé leur propre LIS.</strong> À ma connaissance, <strong>seul Synlab</strong> exploite un système d'information développé en interne. Les autres grands groupes (Cerba, Biogroup, Inovie, Eurofins, Laborizon) restent clients des éditeurs du marché — principalement Dedalus, ce qui explique sa très forte base installée.</p>
<p>La catégorie "Autres" à 62% sur la métrique SESAM-Vitale ne reflète donc pas des SI internes de groupes, mais une longue traîne de modules de facturation qui n'identifient pas le SGL d'origine dans les FSE, plus une présence de solutions de niche (middlewares, modules qualité, portails) facturant à part. La structure capitalistique compte évidemment, mais elle se traduit par des <strong>contrats cadres groupes</strong> avec Dedalus, Technidata ou Clinisys, pas par une autonomie logicielle.</p>
<p>Côté dynamique, après un pic post-Ségur (2022-2025), je table sur une croissance logicielle structurelle de <strong>4 à 7% par an</strong> sur 2026-2028, supérieure à celle du marché des examens (1% par an en valeur sur 2014-2024 selon la DREES), tirée par la migration SaaS, la cybersécurité, la consolidation multi-sites et les exigences d'interopérabilité (INS, Mon espace santé, CR-BIO, MSSanté).</p>`,
    faq: [
      {
        q: "Quels sont les principaux éditeurs de logiciels pour les laboratoires d'analyses médicales en France ?",
        a: "Le marché des SGL/LIMS pour les laboratoires de biologie médicale (LBM) de ville en France est oligopolistique. Dedalus Healthcare France est le leader dominant (estimation 45-60% du marché) avec Hexalis, KaliSil, KaliLab et Halia. Le deuxième cercle est composé de Technidata (TDNexLabs, 10-15%), Clinisys ex-MIPS (GLIMS, 8-12%), Softway Medical Biologie ex-Histone (Lamweb, 5-8%), Inlog (EdgeLab, 4-7%), CGM Lab France (MOLIS, 2-5%) et Clarisys (Clarilab, MCA, 2-4%).",
      },
      {
        q: "Qu'est-ce qu'un LIMS et à quoi sert-il en laboratoire ?",
        a: "Un LIMS (Laboratory Information Management System), aussi appelé SGL (Système de Gestion de Laboratoire) en français, est un logiciel qui pilote l'ensemble du circuit d'analyse en biologie médicale : enregistrement patient, prélèvement, paillasse, validation biologique, télétransmission des résultats au médecin prescripteur et à l'Assurance Maladie. Il doit dialoguer avec les automates, les chaînes robotisées, les portails de résultats, le SIH, la facturation SESAM-Vitale, l'INS et Mon espace santé. C'est un outil critique : il assure la traçabilité réglementaire (norme ISO 15189) de chaque analyse et peut faire l'objet de vigilance ANSM en cas d'incident.",
      },
      {
        q: 'Les grands groupes de biologie médicale utilisent-ils leur propre logiciel ?',
        a: "Non, contrairement à une idée répandue. Sur les six grands groupes qui contrôlent environ 75% des sites de biologie médicale de ville en France (Cerba HealthCare, Synlab, Biogroup, Eurofins Biomnis, Inovie, Laborizon), seul Synlab exploite un système d'information développé en interne. Les autres groupes restent clients des éditeurs du marché — Dedalus est le fournisseur dominant, avec des références publiques visibles comme Inovie sur le middleware MCA de Clarisys. Le poids des grands groupes se traduit par des contrats cadres à l'échelle groupe, pas par une autonomie logicielle.",
      },
      {
        q: "Pourquoi la catégorie 'Autres' représente-t-elle 62% des FSE sur les données SESAM-Vitale ?",
        a: "La métrique GIE SESAM-Vitale comptabilise les feuilles de soins électroniques par progiciel émetteur. Pour les laboratoires, une part importante des FSE est émise par des modules de facturation séparés du SGL principal ou par des briques middleware non rattachées commercialement à un éditeur cœur dans les statistiques publiques. Cela gonfle artificiellement la catégorie 'Autres' et masque la concentration réelle du marché autour de Dedalus, Technidata, Clinisys, Softway, Inlog, CGM et Clarisys. La base installée réelle, mesurée éditeur par éditeur, donne une vue très différente : un marché clairement dominé par Dedalus.",
      },
      {
        q: "Quelle est la taille du marché des logiciels pour laboratoires d'analyses en France ?",
        a: "Le marché du logiciel cœur (SGL/LIMS, facturation, télétransmission, portails, qualité, middleware) pour les LBM de ville en France est estimé entre 60 et 90 M€ par an, et 70 à 110 M€ en incluant l'intégration, l'infogérance, certains middlewares et la cybersécurité. Le marché aval (examens et prélèvements de ville) pèse 4,7 Md€ en 2024 selon la DREES. La croissance logicielle structurelle est estimée à 4-7% par an sur 2026-2028, supérieure à celle des examens (1% par an), tirée par le Ségur, la migration SaaS et la consolidation multi-sites.",
      },
    ],
  },
]

export function getSpecialite(slug: string): Specialite | undefined {
  return specialites.find(s => s.slug === slug)
}
