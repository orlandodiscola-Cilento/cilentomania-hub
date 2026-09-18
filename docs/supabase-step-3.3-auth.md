# Fase 3 — Stato consolidato e chiusura sessione

## Stato approvato

- Supabase Cilentomania APS / Cilentomania HUB - DEV UE, Francoforte eu-central-1 operativo.
- Sette migrazioni applicate; RLS, isolamento e permessi verificati. Data API espone hub_api; hub_private non esposto.
- SMTP Aruba, mittente info@cilentomania.it: invito ricevuto, confermato dall'utente. Nessuna password SMTP nei file locali.
- Account Outlook reale: invito, impostazione password, email confermata e accesso/sessione autenticata verificati dall'utente. Il browser dell'agente non condivide questa sessione.
- Creati con autorizzazione e in unica transazione: un profilo abilitato, organizzazione [TEST] Cilentomania HUB abilitata, membership operator attiva. Nessun ruolo staff/admin/editor.
- current_context verificato anche nel database sotto ruolo authenticated e identità dell'account; una sola organizzazione e zero schede.
- Zero dati commerciali, nessuna associazione a Dimora del Mare. Non sono stati aggiunti altri dati durante il controllo finale.
- Prossimo step funzionale: collegamento delle schede reali al backend, con autorizzazione separata e isolamento pubblicata/bozza invariato.

## Configurazione locale e credenziali

operatori/config.local.json contiene i valori DEV autentici e auth=supabase/backend=demo.
È escluso da Git e dal deploy. operatori/config.json è il modello versionabile vuoto in modalità demo.
Il loader legge l'override solo su loopback; su errore di rete/JSON non passa alla demo.
Solo l'assenza 404 del file locale permette di usare il modello esplicitamente configurato.
Non inserire segreti in nessuno di questi file: nel frontend sono ammessi soltanto URL e Publishable Key.
.env.example contiene solo nomi con valori vuoti. Cache CLI, node_modules, screenshot e cartelle locali esclusi.

## Implementazione

- SDK ufficiale Supabase 2.116.0 compilato e versioni fissate in tools/auth-sdk.
- Password recovery PKCE, invito standard tramite fragment; URL ripulita prima della verifica, token mai mostrati/loggati.
- Login/logout, rinnovo/persistenza tramite SDK, getUser per verifica server. current_context per profilo/membership. Nessun mapping automatico alle identità demo.
- password.html mantiene la precedenza sui redirect di sessione. Cambio con password attuale, minimo 12 caratteri e conferma.
- CSP index/password, no-referrer, HTML esterno tramite textContent, nessuna service_role frontend.
- Sessione SPA in localStorage: non cookie HttpOnly. Resta necessaria la revisione XSS dell'intera origine prima della pubblicazione.
- Area reale limitata alla verifica accesso: editor e dati ancora scollegati; nessuna scheda demo assegnata agli utenti reali.

## Verifiche finali locali

Auth simulata, backend (incluso override che fallisce senza fallback), Area Operatori/workflow/permessi,
Scheda Master e traduzioni: superati. Database/RLS: 87 controlli locali superati.
La verifica reale di logout, persistenza dopo riavvio browser e recupero email non è stata ripetuta
nella sessione dell'utente: non va confusa con i test simulati.

## Pacchetto pubblico

### Chiusura Fase 3 — pacchetto pubblico Auth autorizzato

Supabase DEV Francoforte operativo: sette migrazioni applicate, RLS/Data API verificate, SMTP Aruba info@cilentomania.it funzionante. Invito, impostazione password e sessione reale confermati dall'utente. Unico profilo test associato a [TEST] Cilentomania HUB con ruolo operator; zero schede e dati commerciali. Nessuna associazione a Dimora del Mare. Prossimo step: collegamento delle schede reali al backend.

I due redirect pubblici sono stati aggiunti manualmente e verificati, mantenendo quelli DEV e la Site URL locale. Il pacchetto pubblico usa callback HTTPS esplicito. Gli inviti dalla dashboard senza override seguono ancora la Site URL DEV: non usarli per inviti pubblici senza predisporre il redirect esplicito. Nessuna modifica remota durante questa pubblicazione.

Build pubblica con allowlist e solo autenticazione reale; demo Operatori, simulatore Admin, configurazioni locali, test e strumenti esclusi. La configurazione pubblica contiene solo URL e Publishable Key. Il pulsante Area Operatori viene attivato nel pacchetto pubblico; rimane il ritorno al sito HUB. Sito turistico e Scheda Master demo conservati.

Test Auth/backend/workflow/permessi/Scheda Master/traduzioni/Cilentino superati; 87 verifiche RLS locali. Controlli su segreti e riferimenti locali nel pacchetto superati. La verifica con account reale di login/logout/persistenza sul dominio pubblico richiede l'accesso personale dell'utente e non viene dichiarata conclusa dai soli test simulati. Il push main avvia il workflow di test, build e deploy Aruba; esito da verificare sul run e sul sito dopo il push.

Implementazione in operatori/public; build tools/build-public.cjs, verifica tools/check-public-package.cjs. Il workflow pubblica esclusivamente _site. Nessun fallback demo o editor dati nel bundle pubblico. La build specializza i default di sviluppo dell'SDK fissato, rimuovendo le eccezioni loopback; non le estende al dominio pubblico. Il logging di sviluppo di Cilentino viene disattivato nel solo artefatto, come gia avveniva sul dominio pubblico.

URL pubblici:
- https://www.cilentomania.it/hub/
- https://www.cilentomania.it/hub/operatori/
- https://www.cilentomania.it/hub/operatori/password.html

La Site URL DEV resta invariata; recupero password dal pubblico usa il callback HTTPS esplicito. Non inviare email o creare account durante il collaudo di rilascio senza autorizzazione.
