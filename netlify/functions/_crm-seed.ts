// Raw CSV import of initial CRM contacts (extracted 2026-04-11)
// Parsed at module load. Only used to seed an empty CRM store on first access.

const RAW_CSV = `Email,Prénom,Nom,Entreprise,Source
andrea@cenitz.fr,Andrea,,Cenitz,Calendar
anthony@lisaconnect.fr,Anthony,,Lisaconnect,Calendar
carlos@siliconcarne.co,Carlos,,Siliconcarne,Gmail
cboutemy@cerus.com,Christian,,Cerus,Gmail
chloe@nabla.com,Chloé,,Nabla,Calendar
christofer@orsomedia.io,Christofer,,Orsomedia,Calendar
clovis@cenitz.fr,Clovis,,Cenitz,Calendar
ctezenas@rainmakers.fi,Christophe,,Rainmakers,Calendar
damien@andrewapp.fr,Damien,,Andrewapp,Calendar
denielvincent@gmail.com,Vincent,,,Calendar
docteurguillaumeparis@gmail.com,Guillaume,,,Gmail
emydejean_8@hotmail.com,Emilie,,,Calendar
fs@openai.com,Fidji,,Openai,Gmail
hugo@nowa.care,Hugo,,Nowa,Gmail
joanne@50partners.fr,Joanne,,50partners,Gmail
julpfs@gmail.com,Julie,,,Calendar
louis@andrewapp.fr,Louis,,Andrewapp,Calendar
mrouer@nord-vasculaire.fr,Martin,,Nord-vasculaire,Calendar
mysphere@aguettant.fr,,,Aguettant,Gmail
philippe@eid-lab.com,Philippe,,Eid-lab,Calendar
quemenerfabrice@gmail.com,Fabrice,,,Calendar
relationsclients@medintechs.com,,,Medintechs,Gmail
rodolphe@zenior.care,Rodolphe,,Zenior,Calendar
ugo@andrewapp.fr,Ugo,,Andrewapp,Calendar
vralli@lin-k.fr,Vanessa,,Lin-k,Gmail
abeguin@cryohydro.com,Abeguin,,Cryohydro,Gmail
adri@adriscale.com,Adri,,Adriscale,Gmail
alexandre@a-go.ai,Alexandre,,A-go,Gmail
arnaud@lafraise.pro,Arnaud,,Lafraise,Gmail
cedric@lafraise.pro,Cedric,,Lafraise,Gmail
insights@celonis.com,Celonis,,Celonis,Gmail
guillaume.paris@doccity.fr,Guillaume,,Doccity,Gmail
mathilde@appthera.fr,Mathilde,,Appthera,Gmail
maxime@kinvent.com,Maxime,,Kinvent,Gmail
moovandcompany@gmail.co,Moovandcompany,,Gmail,Gmail
fxavier.ringot@omsandco.com,OMS,,Omsandco,Gmail
partenaires@medintechs.com,Partenaires,,Medintechs,Gmail
recol@recol.fr,RECOL,,Recol,Gmail
baptiste@auraagence.com,Baptiste,- Aura,Auraagence,"Gmail, Calendar"
floriane@maternup.fr,Floriane,- Matern'Up,Maternup,Gmail
shai.alfia@cure51.com,Shaï,Alfia,Cure51,Gmail
t.alston@doc-city.fr,Thomas,ALSTON,Doc-city,"Gmail, Calendar"
pierrick.arnal@okeiro.com,Pierrick,Arnal,Okeiro,"Gmail, Calendar"
marie@tally.so,Marie,at Tally,Tally,Gmail
janice.atsin@axomove.com,Janice,Atsin,Axomove,Gmail
mat.auffret@gmail.com,Mathieu,Auffret,,Gmail
malard.axelle@gmail.com,Malard,Axelle,,Gmail
roge.bap@gmail.com,Roge,Bap,,Calendar
o.barnaud@doc-city.fr,Olivia,BARNAUD,Doc-city,Calendar
jaco.barral@blackroll.com,Jaco,Barral,Blackroll,Gmail
lisa.bastanes@appines.fr,Lisa,Bastanes,Appines,Gmail
vivian@inboxally.com,Vivian,Bastos,Inboxally,Gmail
bertin.belot@wanadoo.fr,Bertin,Belot,,Calendar
muriel.benitah@medintechs.com,Muriel,Benitah,Medintechs,Gmail
clemence.bd@synapse-medicine.com,Clémence,Bertrand,Synapse-medicine,Gmail
bertrand.besse@gmail.com,Bertrand,Besse,,Gmail
aurelie.beyssier@sisselperformancehealth.fr,Aurelie,Beyssier,Sisselperformancehealth,Gmail
charles.bleusez@urps-med-idf.org,Charles,Bleusez,Urps-med-idf,Calendar
update@global.metamail.com,Meta,Blueprint,Global,Gmail
pierrebct.pro@gmail.com,Pierre,Bochet,,Gmail
philippe.borel@pmsm.fr,Philippe,Borel,Pmsm,Gmail
heloise.bossu@ensweet.fr,Heloise,Bossu,Ensweet,Calendar
g.bourdin@doc-city.fr,Guillaume,BOURDIN,Doc-city,Calendar
guillaumebrdn@gmail.com,Guillaume,Bourdin,,Calendar
xboutin@doc-city.fr,Xavier,BOUTIN,Doc-city,Calendar
charlotte.calvet@gmail.com,Charlotte,Calvet Granet Calvet,,Calendar
cathy@semble.io,Cathy,Carpetta,Semble,Gmail
nath.casademont@gmail.com,Nathan,Casadémont,,Gmail
cprin@digitalpharmalab.com,Catherine,Prin,Digitalpharmalab,Gmail
theotime.cattiau@axomove.com,Théotime,Cattiau,Axomove,Gmail
adrien.chabrier@upsa-ph.com,Adrien,CHABRIER,Upsa-ph,Gmail
chelsea.chhin@okeiro.com,Chelsea,Chhin,Okeiro,Gmail
jb@monbilandesante.fr,Jean-Baptiste,Chouane,Monbilandesante,Gmail
manon@semble.io,Manon,Clech,Semble,Calendar
romain.closier@gmail.com,Romain,Closier,,Calendar
thomas.cornet@walter-learning.com,Thomas,Cornet,Walter-learning,Gmail
m.costache@doc-city.fr,Magda,COSTACHE,Doc-city,Calendar
jeremy.cramer@cherrybiotech.com,Jeremy,Cramer,Cherrybiotech,Calendar
je.dabadie@hapni.fr,Jean-Eudes,d'Abadie,Hapni,Gmail
anthony.dacremont@hypodia.fr,Anthony,Dacremont,Hypodia,Gmail
gabriel.david@kdsante.com,Gabriel,DAVID,Kdsante,Gmail
ludmila.de-dinechin@bloomays.com,Ludmila,De Dinechin,Bloomays,Gmail
teresa.degassart@waicah.com,Teresa,De Gassart,Waicah,Gmail
hellohealth@etudes-idel.fr,Sophie,de Hello Health,Etudes-idel,Gmail
edouard.delataille@kiwee.care,Edouard,de la TAILLE,Kiwee,Calendar
t.denoray@doc-city.fr,Thibault,de NORAY,Doc-city,Calendar
goulven.de.pontbriand@posos.fr,Goulven,De Pontbriand,Posos,Calendar
daniel.couet@simplebo.fr,Daniel,de Simplébo,Simplebo,Gmail
mariedevibraye@gmail.com,Marie,de Vibraye,,Gmail
dse@eumail.docusign.net,Marie,de Vibraye via Docusign,Eumail,Gmail
simon@octopulse.io,Simon,Deboeuf,Octopulse,"Gmail, Calendar"
achille.dehaine@hec.edu,Achille,DEHAINE,Hec,Gmail
charlesd@nexus-pro.com,Charles,Delannoy,Nexus-pro,Calendar
m.demeure@doc-city.fr,Marina,DEMEURE,Doc-city,Calendar
marie.devibraye@gmail.com,Marie,Devibraye,,Gmail
vianney.dhaussy@qadence.fr,Vianney,Dhaussy,Qadence,Calendar
carlosdiaz@user.luma-mail.com,Carlos,Diaz,User,Gmail
eric.delaloy@cure51.com,Eric,Delaloy,Cure51,Gmail
maquestionmedicale@gmail.com,,Esanté,,Gmail
sandra.ferran@bakimailglobal.online,Sandra,Ferran,Bakimailglobal,Gmail
nathalie.ferron@upsa-ph.com,Nathalie,FERRON,Upsa-ph,Gmail
bruno@amplemarket.com,Bruno,Filipe Santos from Amplemarket,Amplemarket,Gmail
flora@med-easy.fr,Boishardy,Flora,Med-easy,Calendar
mylo.flora@gmail.com,Flora,Flora,,Calendar
promoter@firstpromoter.com,Pauline,from Noota,Firstpromoter,Gmail
alexandre@pimms.io,Alexandre,from PIMMS,Pimms,Gmail
matthieu.gasc@drugoptimal.com,Matthieu,GASC,Drugoptimal,"Gmail, Calendar"
julie@dokey.io,Julie,Gatignon,Dokey,Gmail
pierre.gaudriault@cherrybiotech.com,Pierre,Gaudriault,Cherrybiotech,Calendar
dorothee.gautier.ext@kiwee.care,Dorothée,GAUTIER,Kiwee,Calendar
alexandre.gessier@predict4health.com,Alexandre,Gessier,Predict4health,Calendar
julien@capitalcell.net,Julien,Gillet-Daubin,Capitalcell,Gmail
b.gochgarian@gmail.com,Boris,Gochgarian,,Calendar
g.goffard@doc-city.fr,Gaëtan,GOFFARD,Doc-city,Calendar
m.gondre@doc-city.fr,Maëva,GONDRE,Doc-city,Calendar
j.guillosson@doc-city.fr,Johane,GUILLOSSON,Doc-city,Calendar
maxime.gury@blast.club,Maxime,Gury,Blast,Gmail
elisabeth.hachmanian@omsandco.com,Elisabeth,Hachmanian,Omsandco,Gmail
assistant@dentalpilote.com,Raphaël,HADDAD,Dentalpilote,Gmail
f.ibnguiatine@doc-city.fr,Fayrouze,Ibnguiatine,Doc-city,Calendar
lavinia@sorcovahealth.com,Lavinia,Ionita,Sorcovahealth,Gmail
isabelle.vanrycke@upsa-ph.com,Isabelle,VAN RYCKE,Upsa-ph,Gmail
pierre.jallon@pairfs.com,Pierre,Jallon,Pairfs,Gmail
boisseau.jb@gmail.com,Jean Baptiste,Boisseau,,Calendar
nicolas.jirikoff@gleamer.ai,Nicolas,Jirikoff,Gleamer,Calendar
fabien@bleu.care,Fabien,Jullia,Bleu,"Gmail, Calendar"
ishsirjanchandok.iskc@gmail.com,Ishsirjan,Kaur Chandok,,Gmail
aziz.kezzou@sipublic.fr,Aziz,Kezzou,Sipublic,Calendar
a.klawiter@doc-city.fr,Alexandre,KLAWITER,Doc-city,Calendar
tim@semble.io,Tim,Knowles,Semble,Calendar
affiliate@krispcall.com,Affiliate,Krispcall,Krispcall,Gmail
eliott.lafon@cherrybiotech.com,Eliott,Lafon,Cherrybiotech,Calendar
lucas@starofservice.com,Lucas,Lambertini,Starofservice,Gmail
anne.lataniere@moofize.fr,Anne,Lataniere,Moofize,Calendar
romain.laurent.sf@gmail.com,Romain,Laurent,,Calendar
alex@nabla.com,Alexandre,Lebrun,Nabla,Gmail
jerome.leleu@interaction-healthcare.com,Jérôme,LELEU,Interaction-healthcare,Gmail
julien.levavasseur@telos-sante.fr,Julien,LEVAVASSEUR,Telos-sante,Gmail
jon.lipfeld@gmail.com,Jon,LIPFELD,,Gmail
laura.lo@waicah.com,Laura,Lo,Waicah,Gmail
thibault@pmeinternet.com,Thibault,Louis,Pmeinternet,Gmail
loic.russo@gpm.fr,Loïc,Russo,Gpm,Gmail
oriane.luckylink@gmail.com,Oriane,Luckylink,,Gmail
lugan.flacher@drugoptimal.com,Lugan,Flacher,Drugoptimal,Gmail
theo.magda@arkhn.com,Théo,Magda,Arkhn,Gmail
nikolaos.makridis@dialecticanet.com,Nikolaos,Makridis,Dialecticanet,Gmail
hugo.manoukian@nowa.care,Hugo,Manoukian,Nowa,Gmail
marc.soris@pmsm.fr,Marc,Soris,Pmsm,Gmail
carlo.marchesini@asalaser.com,Carlo,Marchesini,Asalaser,Gmail
pierre.marechal@formality.co,Pierre,Marechal,Formality,Calendar
lucile@innovationsqi.com,Lucile,Marron Brignone,Innovationsqi,Gmail
nicolas.martelin@prostperia.com,Nicolas,Martelin,Prostperia,Calendar
chloe.mathias123@gmail.com,Chloe,Mathias123,,Calendar
docteur.mercoli@gmail.com,Henri,Mercoli,,Calendar
yaniv@growthfactor.fr,Yaniv,Mimoun,Growthfactor,Calendar
anthony.miossec@jinko.care,Anthony,Miossec,Jinko,Calendar
nouzha.mohellibi@pscc.org,Nouzha,MOHELLIBI,Pscc,Gmail
clement.morel@axomove.com,Clément,Morel,Axomove,Gmail
margaux.morel@simplebo.fr,Margaux,Morel,Simplebo,Calendar
mehdi.moussaid@gmail.com,Mehdi,Moussaid,,Calendar
julien.moussalli@outch.co,Julien,Moussalli,Outch,Calendar
muriel.colagrande@waicah.com,Muriel,Colagrande,Waicah,Gmail
marc@waicah.com,Marc,Nasser,Waicah,Gmail
pierre.nectoux@outch.co,Pierre,Nectoux,Outch,Calendar
y.nguyen@kinvent.com,Y-Vy,Nguyen,Kinvent,Gmail
marie.noirot-nerin@3h18.fr,Marie,Noirot-Nerin,3h18,Calendar
p.olive@gim-sante.fr,Paul,OLIVE,Gim-sante,Calendar
daniel@capitalcell.net,Daniel,Oliver Uriel,Capitalcell,Gmail
ce.orange@doc-city.fr,Charles-Edouard,ORANGE,Doc-city,Calendar
florent.palin@hublo.com,Florent,Palin,Hublo,Gmail
g.paris@doc-city.fr,Guillaume,PARIS,Doc-city,Calendar
patrypierreandre@gmail.com,Pierre-André,PATRY,,Gmail
julien.peltier@lpgsystems.com,Julien,Peltier,Lpgsystems,Gmail
penkervictoria@gmail.com,Victoria,Penker,,Gmail
l.perez@imp-sante.com,Laura,PEREZ,Imp-sante,Calendar
sophie.perez@gl-events.com,Sophie,PEREZ,Gl-events,Gmail
catherine@hackyourcare.com,Catherine,Philibert,Hackyourcare,Gmail
f.piessard@learni-group.com,Flore,Piessard,Learni-group,Gmail
m.pinheiro@aflor.eu,Magda,PINHEIRO,Aflor,Gmail
anthony@lisconnect.fr,Anthony,Placet,Lisconnect,Calendar
lolitamarianne.pro@gmail.com,Lolita,Pro,,Calendar
julie@myprettyagency.com,Julie,RAMBAUD,Myprettyagency,Gmail
trey@onhealthcare.tech,Trey,Rawles,Onhealthcare,Gmail
rdiallo@digitalpharmalab.com,Rayhanatou,Diallo,Digitalpharmalab,Gmail
philippine.raynaud@formality.co,Philippine,Raynaud,Formality,Calendar
bastien.renart@behelem.fr,Bastien,Renart,Behelem,Calendar
amandine.rio@gmail.com,Amandine,Rio,,Calendar
paul.rousseau@bloomcare.app,Paul,Rousseau,Bloomcare,Calendar
romain.rousselet@libramentor.com,Romain,ROUSSELET,Libramentor,Gmail
alexandre.saconney@aligna3d.com,Alexandre,Saconney,Aligna3d,Gmail
alexandre@carecall.ai,Alexandre,Sadoun,Carecall,Gmail
n.sainte-foie@doc-city.fr,Nicolas,Sainte-Foie,Doc-city,Calendar
p.sarret@doc-city.fr,Paul,SARRET,Doc-city,Calendar
valentine.schmitt@elinoi.com,Valentine,Schmitt,Elinoi,Calendar
christophe.s@conec-materiel.be,Christophe,Schoonbroodt,Conec-materiel,Gmail
alessandra.silveira@manychat.com,Alessandra,Silveira,Manychat,Gmail
aurelie.sourisseau@omsandco.com,Aurélie,SOURISSEAU,Omsandco,"Gmail, Calendar"
amelie.starace@gmail.com,Amelie,Starace,,Calendar
olga.starkova@predict4health.com,Olga,Starkova,Predict4health,Calendar
erika@semble.io,Erika,Tallarico,Semble,Gmail
marios.tantaros@dialecticanet.com,Marios,Tantaros,Dialecticanet,Gmail
jean.tfz@maquestionmedicale.fr,Jean,Tfz,Maquestionmedicale,Gmail
dtranchier@digitalpharmalab.com,Didier,Tranchier,Digitalpharmalab,Gmail
romuald.vally@elvesys.com,Romuald,Vally,Elvesys,Gmail
ma.vanni@doc-city.fr,Marc-Antoine,VANNI,Doc-city,"Gmail, Calendar"
s.vanvuchelen@virtualisvr.com,Sophie,Vanvuchelen,Virtualisvr,Gmail
samuel.vergnol@cherrybiotech.com,Samuel,Vergnol,Cherrybiotech,Calendar
jeromev@patrimovie.com,Jérome,Vialla,Patrimovie,Gmail
mariona@capitalcell.net,Mariona,Vidal Picamoles,Capitalcell,Gmail
solene@hackyourcare.com,Solène,Vo Quang,Hackyourcare,Gmail
fabien.watrelot@ensweet.fr,Fabien,Watrelot,Ensweet,Calendar
thierry.weber@vivactis.ch,Thierry,Weber,Vivactis,Calendar
leo.weishard@hability.fr,Leo,Weishard,Hability,Gmail
roy.william.wr@gmail.com,Roy,William Wr,,Calendar
ziane@noun-partners.com,Malek,Ziane,Noun-partners,Gmail`

function parseCsv(csv: string): string[][] {
  const rows: string[][] = []
  const lines = csv.split('\n').filter(l => l.length > 0)
  for (const line of lines) {
    const fields: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
    fields.push(cur)
    rows.push(fields)
  }
  return rows.slice(1) // drop header
}

export type SeedContact = {
  email: string
  firstName: string
  lastName: string
  company: string
  source: string
}

export const SEED_CONTACTS: SeedContact[] = parseCsv(RAW_CSV)
  .filter(fields => fields[0] && fields[0].includes('@'))
  .map(fields => ({
    email: (fields[0] || '').trim().toLowerCase(),
    firstName: (fields[1] || '').trim(),
    lastName: (fields[2] || '').trim(),
    company: (fields[3] || '').trim(),
    source: (fields[4] || '').trim(),
  }))

// --- Lemcal contacts (extracted 2026-04-12) ---
// These are imported with default status "Opportunité" (they booked a meeting).

export type LemcalContact = {
  email: string
  firstName: string
  lastName: string
  company: string
  source: string
  notes: string
  linkedIn: string
  rdvDate: string
  rdvType: string
}

const RAW_LEMCAL = `Email,Prénom,Nom,Entreprise,LinkedIn,Date RDV,Type de RDV,Notes
jb@monbilandesante.fr,Jean-Baptiste,Chouane,Mon Bilan de Santé,,,01/04/2026,Service Discovery,
affif.zaccaria@peektoria.com,Affif,Zaccaria,Peektoria,https://www.linkedin.com/in/affif-zaccaria-93114b65,27/02/2026,Audit Marketing Healthcare,
alexis.patissier@shadow.eco,Alexis,Patissier,Shadow,,,25/02/2026,Service Discovery,
kevin.ouazzani@lucidia.fr,Kevin,Ouazzani,Lucidia Health Intelligency,https://www.linkedin.com/in/kevin-ouazzani-55a471120,11/02/2026,Service Discovery,
romain.rousselet@libramentor.com,Romain,Rousselet,Libramentor,,,26/11/2025,Service Discovery,
hugo@nowa.care,Hugo,Manoukian,Nowa Care,https://www.linkedin.com/in/hugo-manoukian-02a78927,21/11/2025,Service Discovery,
julien@peachmed.app,Julien,Le Thoai,Peachmed,,,21/11/2025,Audit Marketing Healthcare,
assistant@dentalpilote.com,Raphael,Haddad,Dentalpilote,,,12/11/2025,Audit Marketing Healthcare,
gasparddedreuzy@gmail.com,Gaspard,Mille,Celsius Santé,https://www.linkedin.com/in/gaspard-mille-804945b0,24/09/2025,Audit Marketing Healthcare,
marc.nasser@hotmail.com,Marc,Nasser,,,,17/09/2025,Audit Marketing Healthcare,
s.fakallah@audensiel.com,Sara,Fakallah,Audensiel,,,12/09/2025,Service Discovery,
kevin.ouazzani@gmail.com,Kevin,Ouazzani,,,,03/09/2025,Service Discovery,
f.thomas@nex-meded.com,Florian,Thomas,Nex-MedEd,,,29/08/2025,Audit Marketing Healthcare,
eliott@vocca.ai,Eliott,Hoffenberg,Vocca,https://www.linkedin.com/in/eliott-hoffenberg,29/08/2025,Service Discovery,
nicolasraulin22@gmail.com,Nicolas,Raulin,,,,30/07/2025,Service Discovery,
boris.leveque@axomove.com,Boris,Leveque,Axomove,https://www.linkedin.com/in/boris-leveque-50791756,25/07/2025,Service Discovery,
mottesylvain16@gmail.com,Christophe,,,,,22/07/2025,Service Discovery,
lavinia@sorcovahealth.com,Lavinia,Ionita,Sorcova Health,,,21/07/2025,Service Discovery,
sophia@spaictra.com,Sophia,Mejjati Alami,Spaictra,https://www.linkedin.com/in/sophia-mejjati-alami-4371b7217,09/07/2025,Service Discovery,
roberto.jongejan@alveolus.nl,Roberto,Jongejan,Alveolus Biomedical,https://www.linkedin.com/in/roberto-jongejan-md-phd-152945a,09/07/2025,Service Discovery,
caroline.chesnel@mbadmb.com,Caroline,Chesnel,MBA DMB,,,04/07/2025,Service Discovery,
roland.lemeur@med-ia.biz,Roland,Le Meur,Med-IA,,,04/07/2025,Service Discovery,
contact@mori-nutrition.com,Anne-Sophie,Darrigade,MORI Nutrition,https://www.linkedin.com/in/dr-anne-sophie-darrigade-b2936693,04/07/2025,Service Discovery,
laila.quere@akenmedical.com,Laila,Quere,aKen Medical,https://www.linkedin.com/in/laila-quere,02/07/2025,Service Discovery,
yamina.hakem@globalreachbi.com,Yamina,Hakem,Liik,https://www.linkedin.com/in/yamina-hakem-a21492a,30/06/2025,Service Discovery,
shiva.shukla@beezbiotech.com,Shiva,Shukla,Beez Biotech,https://www.linkedin.com/in/shiva-k-shukla-8621b419,13/06/2025,Service Discovery,
louis@centreviasana.com,Louis,Fosse,Via Sana,https://www.linkedin.com/in/louis-fosse-377655109,13/06/2025,Service Discovery,
na@one.fr,Nathaniel,Amsellem,,,,23/05/2025,Service Discovery,
benoit.bourre@hocoia.com,Benoît,Bourre,Hocoia,https://www.linkedin.com/in/benoît-bourre-a9a807234,22/05/2025,Business meeting santexpo,Leads a l international+grands comptes
charlotte.bouquerel@u-paris.fr,Charlotte,Bouquerel,Université Paris,,,21/05/2025,Service Discovery,
benoit@metaconnect.fr,Tommasino,,Metaconnect,,,21/05/2025,Business meeting santexpo,En avance sur notre temps.
mathieudellenbach@gmail.com,Mathieu,Dellenbach,,,,19/05/2025,Service Discovery,
thierry.weber@vivactis.ch,Thierry,Weber,Vivactis Switzerland,https://www.linkedin.com/in/thierrywebermd,13/05/2025,Service Discovery,
matthieu.gasc@drugoptimal.com,Matthieu,Gasc,DrugOptimal,,,05/05/2025,Service Discovery,
davidderrien@hotmail.com,David,Derrien,,,,24/04/2025,Business meeting santexpo,
jourdrencyrielle@gmail.com,Cyrielle,Jourdren,,,,18/04/2025,Business meeting santexpo,
vducrohet@softwaymedical.com,Vincent,Ducrohet,Softway Medical,,,17/04/2025,Business meeting santexpo,
charlotte.calvet@gmail.com,Charlotte,Calvet Granet,,,,14/04/2025,Business meeting santexpo,
romain.laurent.sf@gmail.com,Romain,Laurent,,,,07/04/2025,Business meeting santexpo,
anthony@lisconnect.fr,Anthony,Placet,Lisconnect,,,03/04/2025,Service Discovery,
fslaoui@theryq.com,Fatine,Slaoui,THERYQ,https://www.linkedin.com/in/fatineslaoui,31/03/2025,Service Discovery,
jpursulet@yahoo.fr,Jean-Philippe,Ursulet,,,,28/03/2025,Service Discovery,
pierrick.arnal@predict4health.com,Pierrick,Arnal,Predict4Health,https://www.linkedin.com/in/pierrick-arnal-ph-d-067b65148,28/03/2025,Service Discovery,
charlesd@nexus-pro.com,Charles,Delannoy,Nexus Pro Santé,https://www.linkedin.com/in/charles-delannoy-aa280b182,27/03/2025,Service Discovery,
aziz.kezzou@sipublic.fr,Aziz,Kezzou,Sopra Steria,https://www.linkedin.com/in/akezzou,20/03/2025,Service Discovery,
marie.noirot-nerin@3h18.fr,Marie,Noirot-Nerin,3H18,,,03/03/2025,Business meeting santexpo,
sami.rifai@novetude.com,Sami,Rifai,Novetude,,,26/02/2025,Business meeting santexpo,
leila@le-palpitant.fr,Ilona,Huynh,Le Palpitant,https://www.linkedin.com/in/ilona-huynh,25/02/2025,Service Discovery,
nicolas.martelin@prostperia.com,Nicolas,Martelin,Prostperia,https://www.linkedin.com/in/nicolas-martelin-325a855,21/02/2025,Service Discovery,
arthur.seres@neok.fr,Arthur,Sérès,Neok,https://www.linkedin.com/in/arthur-sérès-bb1a6599,20/02/2025,Service Discovery,
fherry@libheros.fr,Florence,Herry,France Biotech,https://www.linkedin.com/in/florence-herry,20/02/2025,Service Discovery,
romain.dorange@biostarks.com,Romain,Dorange,Biostarks,,,09/12/2024,Business meeting santexpo,
flora@med-easy.fr,Flora,Boishardy,Med-Easy,,,04/12/2024,Business meeting santexpo,
laury.pantel@pmd-medical.com,Laury,Pantel,PMD Medical,,,22/08/2024,Business meeting santexpo,
abbou.yonathan@gmail.com,Yonathan,Abbou,,,,24/07/2024,Business meeting santexpo,
marcantoine.vanni@gmail.com,Marc-Antoine,Vanni,,,,17/06/2024,Business meeting santexpo,
jeremy.cramer@cherrybiotech.com,Jeremy,Cramer,Cherry Biotech,,,26/03/2024,Echange PSCC,"CEO | Cherry Biotech develops instruments for drug discovery and precision medicine."
yaniv@growthfactor.fr,Yaniv,Mimoun,Growth Factor,,,25/03/2024,Business meeting santexpo,
louis@andrewapp.fr,Louis,Rapp,Andrewapp,,,13/03/2024,Business meeting santexpo,
ac@msinsight.tech,Arnaud,Cutivet,MSInsight,,,23/01/2024,Echange PSCC,"CEO | MSInsight développe des solutions logicielles pour le repérage de cancers MSI."`

export const LEMCAL_CONTACTS: LemcalContact[] = parseCsv(RAW_LEMCAL)
  .filter(fields => fields[0] && fields[0].includes('@'))
  .map(fields => ({
    email: (fields[0] || '').trim().toLowerCase(),
    firstName: (fields[1] || '').trim(),
    lastName: (fields[2] || '').trim(),
    company: (fields[3] || '').trim(),
    source: 'Lemcal',
    linkedIn: (fields[4] || '').trim(),
    rdvDate: (fields[5] || '').trim(),
    rdvType: (fields[6] || '').trim(),
    notes: (fields[7] || '').trim(),
  }))
