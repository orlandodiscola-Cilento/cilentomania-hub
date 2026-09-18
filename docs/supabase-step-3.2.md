# Fase 3 / Step 3.2 — schema locale, permessi e applicazione futura

**Stato successivo:** applicazione delle sette migrazioni autorizzata e completata sul
solo DEV UE di Francoforte, con verifiche remote positive. Vedi
`supabase-step-3.2-applicazione-dev.md`. Le sezioni sotto documentano progetto, correzione
e procedura adottata. Nessun frontend collegato e nessun deploy del sito.

SQL implementato e verificato localmente con PGlite. Collegamento e dry-run DEV completati;
nessuna migrazione remota applicata, commit, push o deploy. Frontend invariato rispetto allo Step 3.1,
selezione demo e nessun fallback automatico.

## Correzione dopo il preflight sul DEV

Il collegamento e il primo dry-run sono stati autorizzati e completati sul progetto reale
Cilentomania APS / Cilentomania HUB - DEV UE / eu-central-1. Nessuna migrazione applicata.
Il preflight ha rilevato che postgres non può concedere USAGE sullo schema auth né EXECUTE
su auth.uid(): la prima simulazione locale assumeva grant option non presenti sul DEV.

La migrazione 001 ora non contiene alcun GRANT/REVOKE/ALTER sugli oggetti Auth.
hub_private.request_user_id() è una funzione SQL STABLE SECURITY DEFINER a zero argomenti,
con search_path vuoto, che restituisce esclusivamente auth.uid(). Rimane di proprietà del
principal di migrazione (postgres sul DEV), già autorizzato a leggere l'identità. Non viene
trasferita a hub_owner/hub_executor; solo questi ruoli possono richiamarla a regime.
Le RPC con proprietario HUB usano questo helper; le policy eseguite da authenticated
mantengono auth.uid() direttamente. Non vengono reinterpretati ruoli o metadati client.

Le migrazioni 005/006/007 cambiano solo le chiamate all'identità necessarie. Nessuna
struttura Auth, utente, configurazione o ruolo gestito viene modificato. Resta soltanto
la FK della nostra tabella profiles verso auth.users, prevista dal modello Supabase.

Test aggiornati: 87 controlli database, ACL Auth senza grant option, proprietari Auth e
Storage separati dal migratore, nessuna membership del migratore nel proprietario Storage,
snapshot Auth prima/dopo e struttura/proprietà Storage invariate. Fixture solo in memoria.
Il JWT sintetico viene verificato anche tramite request.jwt.claims oltre al singolo sub.

Differenza residua dichiarata: il DEV autorizza le policy Storage tramite
supautils.policy_grants. PGlite non include questa estensione: il runner esegue esclusivamente
le quattro CREATE POLICY Storage previste con il principal di bootstrap, senza concedere
ownership o privilegi aggiuntivi al migratore. Tutto il restante SQL usa il migratore non
superuser. Non è una prova dell'estensione remota; il collaudo integrato resta successivo.
Il trigger RLS automatico del DEV agisce solo su public: hub_private continua ad attivare
RLS esplicitamente. Storage resta limitato ai due bucket HUB e alle quattro policy previste.

Nuovo dry-run dopo correzione: riuscito con --linked --dry-run --skip-vault; elenca esattamente
le sette migrazioni. Verifica successiva: tutte pendenti, nessuno schema/ruolo HUB, bucket o
policy Storage creati. Il dry-run non esegue il SQL e non certifica l'esecuzione completa sul
motore remoto. Nessuna ulteriore incompatibilità bloccante rilevata nei controlli in lettura.

## Modello

Tabelle in hub_private, escluso dalla Data API. Funzioni autorizzate in hub_api restituiscono
JSON; non serve esporre le tabelle di base.

| Tabelle | Relazioni e contenuto |
|---|---|
| profiles | UUID Auth, nome, lingua, abilitazione; nessuna password |
| organizations / organization_members | N utenti per organizzazione e N organizzazioni per utente; ruolo e abilitazione |
| staff_roles | Editor/admin globali separati dai metadati modificabili dall'utente |
| listings | Identità stabile, organizzazione, content_owner, tipo, slug, legacy_id, stato pubblicazione e puntatori |
| listing_revisions | Versione editoriale numerata, autori/date, testi, contatti, posizione e flag demo |
| accommodations | Caratteristiche della revisione; numeri, orari e booleani nullable |
| amenities / listing_amenities | Codici stabili e disponibilità per revisione true/false/null |
| listing_revision_translations | Testi per lingua e revisione |
| municipalities | Comune, slug, ISTAT e coordinate facoltative |
| media / listing_revision_media | File identificato e immutabile; ruolo, ordine, ALT e didascalia versionati |
| workflow_events | Storico append-only |
| plans / contracts / subscriptions / payments | Predisposizioni private vuote, nessuna automazione commerciale |
| notifications | Predisposizione privata; lettura al destinatario ancora autorizzato |

content_owner è la UUID dell'organizzazione titolare e coincide con organization_id;
l'autore della modifica è separato. Un futuro trasferimento richiederà una procedura
dedicata. subscriptions contiene riferimenti opzionali a scheda, piano e contratto:
i dati commerciali non vengono duplicati nelle revisioni o proiezioni pubbliche.

FK composite impediscono puntatori, revisioni base, media e contratti di altre
organizzazioni/schede. UNIQUE proteggono sequenze, posizione foto e singoli logo/cover.
Coordinate complete e valide, conteggi non negativi e URL web HTTPS. NULL resta sconosciuto.
Il flag demo non è modificabile dall'operatore. Nessun dato Dimora del Mare viene inserito.

## Versioni e workflow

- published_revision_id indica una revisione approvata; solo quella alimenta il pubblico.
- working_revision_id indica il lavoro corrente, senza alterare il pubblicato.
- draft → submitted → in_review → approved; oppure in_review → changes_requested.
- Da approved/changes_requested si crea una NUOVA bozza con riferimento alla precedente.
  Non si riaprono o sovrascrivono gli originali.
- Testi, traduzioni, servizi, caratteristiche e riferimenti foto si congelano all'invio.
- Approvare non pubblica. Pubblicazione e sospensione sono operazioni Admin separate.
- Versione attesa e blocchi transazionali proteggono dal sovrascrivere modifiche concorrenti.
  La UI futura dovrà mostrare il conflitto senza salvare localmente.
- La pubblicazione già completata può essere ritentata senza duplicare lo storico.

API: current_context, list_listings, get_listing, review_queue (ricerca/stato/paginazione),
compare_revision, create_working_revision, save_draft, submit_revision, review_revision,
publish_revision, suspend_listing, set_operator_membership, register_media.
L'adapter futuro mapperà questi contratti al modello UI attuale; non è collegato ora.

## Permessi effettivi

Identità da Auth, autorizzazioni dalle tabelle private e da abilitazioni controllate a ogni
richiesta. Nessun ruolo è accettato dal browser o da metadati utente modificabili.

| Identità | Lettura | Scrittura |
|---|---|---|
| Anonimo | Proiezione pubblica e sole foto pubblicate attive | Nessuna |
| operator | Schede/revisioni proprie organizzazioni attive, membri della stessa organizzazione, proprio profilo, cataloghi | RPC per nuova bozza, modifica corrente, invio, registrazione foto; nessuna scrittura diretta |
| organization_admin | Come operator | Inoltre attiva/disattiva operatori già associati alla propria organizzazione; non se stesso, manager o staff |
| cilentomania_editor | Revisioni inviate/in revisione/approvate/con modifiche richieste e confronto pubblicato; non bozze estranee | Presa in carico, approvazione o richiesta motivata di modifiche; niente pubblicazione/sospensione |
| cilentomania_admin | Contenuti e identità applicative | Pubblicazione/sospensione; associazione di operatori già provisionati |

Nessun INSERT/UPDATE/DELETE di base per anon/authenticated. Nessun hard delete di schede,
revisioni o storico esposto. Patch limitate a campi editoriali noti: proprietà, enabled,
ruoli, flag demo, puntatori, stati e date amministrative sono protetti lato database.

Le tabelle commerciali non hanno ancora API o grants client, neppure per un utente Admin:
restano riservate al futuro servizio amministrativo/database. Provisioning di organizzazioni,
profili, manager e ruoli staff è riservato al proprietario del database e al futuro servizio
Admin controllato. Non viene inventata una registrazione reale o un invito via browser.
La prima assegnazione Admin richiederà account Auth reale e autorizzazione separata.

### Confine di fiducia SQL

hub_owner e hub_executor sono NOLOGIN/NOSUPERUSER/NOBYPASSRLS. Il principal di migrazione
riceve membership per trasferire proprietà, senza richiedere un superuser. Non concederli
ad authenticator, anon, authenticated o account applicativi.

hub_owner possiede tabelle e poche funzioni di autorizzazione/proiezione. Come proprietario
PostgreSQL può leggere le proprie tabelle senza RLS: scelta esplicita per evitare ricorsioni
nelle policy. hub_executor non possiede le tabelle e usa una policy riservata alle RPC
fidate, che verificano l'identità prima di scrivere. Grants ridotti alle operazioni necessarie.
Funzioni SECURITY DEFINER con search_path vuoto, nomi qualificati, EXECUTE espliciti.
Il loro codice è parte del perimetro di sicurezza: “RLS attiva” da sola non basta.

## Storage

listing-drafts e listing-published sono bucket privati. JPEG/PNG/WebP, massimo 5 MiB per
immagine, 40 associazioni per revisione e 40 registrazioni pending per scheda. SVG escluso.

Percorsi generati dal database: organizzazione UUID / scheda UUID / media UUID / original
oppure / published. MIME separato dal nome del file. La policy verifica la riga autorizzata,
non soltanto il prefisso. Upload singolo; nessun overwrite, upsert, UPDATE o DELETE client.
File di revisioni inviate non ricevono upload tardivi. Una rimozione dalla bozza non elimina
l'immagine delle versioni precedenti. Nessuna scrittura client nel bucket published.

Il futuro worker server dovrà verificare byte effettivi, MIME, dimensioni, EXIF e contenuto,
copiare tramite Storage API e chiamare finalize_media. Solo il ruolo di servizio può
chiamarla; nessuna chiave privilegiata è presente nei file o nel frontend. La funzione
controlla l'esistenza dell'oggetto preparato e congela checksum/dimensioni. Non simula
l'ispezione dei byte: quel worker resta da implementare.

La pubblicazione verifica tutti i media prima di spostare il puntatore. Storage e SQL non
sono una transazione unica: il worker futuro dovrà consentire ritentativi e pulizia orfani,
conservando il pubblicato precedente in caso d'errore. Nessun cleanup automatico ora;
non cancellare righe storage.objects per eliminare file: usare Storage API.

Foto pubbliche leggibili soltanto se collegate al pubblicato di un'organizzazione attiva.
Le future URL firmate dovranno durare poco: link già firmati/cache possono sopravvivere
alla sospensione fino alla scadenza. La proiezione restituisce percorsi, non URL firmate.

## Proiezione e futura migrazione JSON

public_listing espone una whitelist di nome/testi, contatti pubblici, posizione, servizi,
caratteristiche, traduzioni, foto validate e flag demo. Esclude autori, organizzazione
privata, revisioni interne, cronologia e dati commerciali. Sospese/disabilitate non esposte.

Nessun JSON è migrato. In futuro conserveremo legacy_id e is_demo=true, confronteremo
il rendering prima di cambiare sorgente e registreremo esplicitamente le schede migrate.
Una scheda già passata al database non deve riapparire dal JSON se sospesa, assente o se
Supabase è indisponibile. Nessun fallback automatico Supabase → demo.

## Limiti da verificare prima dell'apertura reale

1. Test locali con Auth/Storage minimali: niente JWT veri, email, PostgREST, upload HTTP
   o concorrenza multi-connessione. Conflitti di versione verificati con richieste successive.
2. Verificare sul DEV reale versione PostgreSQL, event trigger e grants. Servono CREATEROLE
   e autorizzazioni sulle policy Storage; il runner locale verifica l'assenza di dipendenze
   da privilegi superuser, ma non replica tutta la piattaforma Supabase.
3. Policy Storage preesistenti permissive si sommano con OR e potrebbero ampliare l'accesso.
   Vanno inventariate e riesaminate prima dell'applicazione, senza cancellarle alla cieca.
4. Schemi/ruoli/bucket omonimi devono causare uno stop, non essere nascosti con IF NOT EXISTS.
5. Conferma email e revoca sessioni Auth nello step successivo; enabled blocca già l'accesso
   applicativo anche se l'identità continua a essere presentata.
6. Worker foto, inviti e provisioning non sono ancora servizi effettivi. Non aprire l'area
   a clienti prima di aver collaudato questi passaggi.

## Procedura di collegamento e applicazione

La procedura sotto era il piano iniziale: collegamento, inventario e dry-run sono ora
completati come descritto sopra. Solo l'applicazione e il collaudo integrato restano futuri.

Solo dopo una nuova autorizzazione:

1. Verificare in dashboard Cilentomania APS, DEV EU, regione eu-central-1. Acquisire il
   solo project reference non segreto, senza riutilizzare il progetto Irlanda eliminato.
2. Usare CLI Supabase ufficiale, inizializzata localmente con `supabase init` (non eseguito).
   Login interattivo gestito dall'utente. Nessun token/password in chat, argomenti o repository.
3. `supabase link --project-ref <riferimento-verificato-del-progetto>`: le parentesi indicano
   il valore reale da acquisire, non una credenziale inventata. Eventuale password immessa
   dall'utente nel prompt sicuro; niente stringhe di connessione contenenti password.
4. Inventario remoto in lettura, `supabase migration list`, poi `supabase db push --dry-run`.
   Verificare che il piano contenga esattamente i sette file e nessuna collisione. Niente reset.
   Le query di inventario sono predisposte in supabase/checks/preflight.sql, senza estrarre
   credenziali o contenuti degli utenti.
5. Verificare backup/esportazione o assenza documentata di dati da preservare. In presenza
   di differenze fermarsi e mostrarle prima di procedere.
6. Con autorizzazione all'applicazione e controlli positivi: `supabase db push`. Non eseguire
   bootstrap-local.sql, run.mjs o seed. Non creare utenti reali o Dimora del Mare.
7. Verificare schema, policy, grants, bucket privati, tabelle commerciali vuote e storico
   migrazioni. La futura esposizione Data API aggiungerà soltanto hub_api; mantenere
   hub_private escluso ed esposizione automatica disattivata.
   Controlli strutturali in sola lettura: supabase/checks/postflight.sql.
8. Prima del collegamento UI, test integrato Supabase con account di prova autorizzati
   separatamente. Demo invariata fino ad allora.

CLI ufficiale 2.117.0 disponibile e collegata al DEV verificato. Non servono segreti in chat. Un errore
parziale richiede ispezione dello storico prima di riprendere, non un reset distruttivo.

Fonti: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[funzioni](https://supabase.com/docs/guides/database/functions),
[ruoli](https://supabase.com/docs/guides/database/postgres/roles),
[schemi API](https://supabase.com/docs/guides/api/using-custom-schemas),
[Storage](https://supabase.com/docs/guides/storage/security/access-control),
[PGlite](https://pglite.dev/docs/).
