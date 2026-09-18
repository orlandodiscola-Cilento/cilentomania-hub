# Note di progetto — Cilentomania HUB

Riepiloghi sintetici di stato raggiunto, commit pubblicati e verifiche effettuate. File di documentazione interna: escluso dal deploy su Aruba (`docs/**` non viene pubblicato, vedi `.github/workflows/deploy-aruba.yml`).

## 2026-09-16 — Ospitalità e chat contestuale di Cilentino

**Commit pubblicato:** `d25d9312f168ee03e363c7f073e8ec00357dc784` — `feat: aggiorna ospitalità e chat contestuale di Cilentino`
**Deploy:** Run #25 "Deploy Cilentomania HUB su Aruba", completato con successo (19s).
**Destinazione:** `https://www.cilentomania.it/hub/` (nessuna modifica alla homepage principale, visibilità o indicizzazione).

### Contenuto pubblicato
- Restyling di "Dove mangiare" con identità verde (pulsanti Comuni uniformi, hero fotografica, categorie orizzontali, filtri cucina/esigenze/orari, card, griglia 1/2/3 colonne).
- Intestazioni delle schede: categoria di sezione piccola, nome del Comune grande e dinamico, senza dicitura "Cilentomania".
- Apertura della chat sopra la scheda corrente (z-index, gestione Esc, scroll e focus preservati).
- Cilentino Chef per "Dove mangiare" e Cilentino Concierge per "Dove dormire", con presentazioni e primi messaggi contestuali (Comune dinamico, gestione italiana "a/ad") tradotti in IT/EN/DE/FR/ES.
- Ritorno immediato allo stato dormiente in homepage (nessuna attesa del timer) e ripristino del personaggio classico alla riapertura della chat dalla home, senza perdere conversazioni in corso.

### Verifiche effettuate
- `git diff --check`, `node --check` su tutti i file JS toccati, `node tools/check-i18n-keys.js` → tutti superati.
- Verifica funzionale su anteprima locale e poi sul sito pubblicato, smartphone e desktop: pulsanti verdi "Dove mangiare", gerarchia intestazioni, chat sopra la scheda, Chef/Concierge con presentazioni corrette, ritorno dormiente immediato in home, riapertura con Cilentino classico.
- "Dove dormire" verificato invariato (identità blu, comportamento preesistente).

### Stato repository
- Push su `origin/main` eseguito senza force, nessuna divergenza residua.
- File esclusi dal commit/deploy: `.vscode/`, `node_modules/`, `review-cilentino/`, screenshot temporanei — rimasti solo in locale, non pubblicati.

## 2026-09-16 — Correzioni chat salvate localmente, non pubblicate

- Cronologie separate per lingua, sezione e Comune; vecchie cronologie globali lasciate intatte e non importate.
- Suggerimenti multipli per ospitalità e ristorazione, tradotti nelle cinque lingue, invio di una sola richiesta con le preferenze selezionate.
- Risposta breve localizzata quando mancano risultati o il servizio non è disponibile; eliminato il ricorso alle risposte demo.
- Protezione delle cronologie più recenti o cancellate dalle risposte tardive; preservata la bozza nel salvataggio di una risposta tardiva.
- Istruzione e pulsante di conferma a larghezza piena nella griglia dei suggerimenti.
- Anteprima locale allineata al progetto principale.

Verifiche: sintassi dei due JavaScript, allineamento delle chiavi i18n, diff senza errori; test ripetibile `node tools/check-cileo-conversations.cjs` per risposte tardive (cronologia invariata, aggiornata, cancellata e assenza di risposta); controllo visivo del pulsante nell'anteprima italiana di Agropoli. Controlli precedenti confermano separazione/ripristino delle cronologie e gestione di risposte mancanti o verificate.

Limiti: la selezione multipla compone una richiesta; non certifica che il backend applichi tutti i filtri ai dati. Non sono stati aggiunti servizi AI o credenziali. Le conversazioni già salvate possono contenere risposte demo storiche: non sono state cancellate. La verifica responsive completa nelle cinque lingue resta da effettuare prima della pubblicazione. Una risposta tardiva viene ignorata se la sua cronologia è stata modificata nel frattempo, per evitare sovrascritture.

Stato: solo salvataggio locale; nessun push/deploy. I file temporanei e personali restano esclusi.

### Verifica pre-pubblicazione
- Autorizzata la pubblicazione dall'utente dopo i controlli.
- Smartphone 390x844 e tablet 768x1024: verifica visiva di chat e suggerimenti, nessun overflow orizzontale della pagina, conferma a larghezza piena.
- Invio unico Hotel/Piscina/Parcheggio verificato; risposta di indisponibilità corretta.
- IT/EN/DE/FR/ES: controllati gli otto suggerimenti di entrambe le sezioni e i testi necessari; allineamento i18n superato. Non effettuato un collaudo visivo di ogni combinazione lingua/dispositivo.
- Test automatici delle risposte tardive superati. Il limite della ricerca effettiva nei dati rimane quello descritto sopra.
- Commit applicativo: ace1006. In avvio il push/deploy autorizzato; l'esito sarà verificato separatamente.

## 2026-09-16 — Avatar contestuali e movimenti

- Chef e Concierge restano il personaggio della sezione anche durante ricerca, risposta e indisponibilità; comportamento della homepage conservato.
- Movimenti discreti di ricerca, ascolto, presentazione e mancata risposta sulle immagini esistenti, con ritorno automatico in attesa; nessuna nuova espressione del volto.
- Animazioni disattivate per chi preferisce movimento ridotto.
- Verifiche: sintassi JavaScript e test delle conversazioni superati; test degli stati per Chef/Concierge e ritorno alla home superato nella sessione di sviluppo; anteprima controllata dopo una richiesta, con avatar concierge e animazione cileoContextUnavailable.
- Pubblicazione su /hub autorizzata dall'utente; deploy avviato dal push di questo commit. Esito disponibile nel workflow GitHub Actions associato.
- File personali e temporanei esclusi dal commit e dalla pubblicazione.

## 2026-09-17 — Prima Scheda Master Operatore, solo locale

- Nuovo dettaglio Dove Dormire con hero, gallery, servizi a codici stabili, caratteristiche a tre stati, CTA, contatti, mappa e collegamenti al territorio. Demo “Dimora del Mare — Demo” a Castellabate chiaramente identificata; nessuna adesione o verifica implicita.
- Modello pubblico separato dalla predisposizione amministrativa/commerciale (soli segnaposto, nessuna logica abbonamenti). Documentazione in `docs/operator-profile.md`.
- Responsive controllato a 390/768/1024/1440 px; gallery, ritorno all'elenco, cinque lingue e Concierge verificati. Dove Mangiare conserva il dettaglio precedente.
- Test automatici del modello e sintassi superati. Limite: cartografia OpenStreetMap incorporata non visibile nel browser locale; presente collegamento esterno. CTA della demo volutamente inattive.
- File modificati solo localmente. Nessun commit, push, deploy o pubblicazione: attesa approvazione dell'utente.

### Secondo passaggio grafico Scheda Master (solo locale)

- Hero immersiva, badge DEMO separato, logo opzionale, CTA immediate e sticky mobile.
- Servizi compatti, caratteristiche strutturate con icone, gallery estesa a sette immagini demo.
- Quattro blocchi territoriali dimostrativi (Eventi, Esperienze, Dove mangiare, Itinerari) e CTA Concierge nei dintorni.
- Verifiche responsive 390/768/1024/1440 e test del modello superati; resta il limite della mappa esterna nel browser locale.
- Nessun commit, push o deploy; in attesa di revisione grafica.

### Pubblicazione Scheda Master autorizzata

- Versione finale semplificata, senza barra interna, riquadro Concierge o gallery separata. Gallery completa dalla hero; chat generale invariata.
- Test Scheda Master, i18n e conversazioni superati; dati preesistenti e traduzioni esterne al nuovo namespace invariati; Dove Mangiare verificato.
- Commit e push autorizzati dall’utente; deploy previsto dal workflow esistente su main in /hub/. Esito da verificare dopo il push.
- Esclusi file locali, screenshot, node_modules e server di anteprima LAN.

## 2026-09-17 — Fase 2 Area Operatori v1, solo locale

- Login demo, dashboard “Le mie schede”, editor in sei sezioni e Area Cilentomania con coda, ricerca, filtri e storico invii.
- Due organizzazioni demo; Anna e Luca condividono la prima, Marta appartiene alla seconda. Modello predisposto per più utenti e più contenuti per organizzazione.
- publishedVersion separata da workingRevision e invii: approvare non modifica la versione pubblica. Stati pubblicazione/sospensione soltanto nel simulatore Admin locale.
- Foto e bozze in IndexedDB, media con id/tipo/ordine/didascalia/ALT. Anteprima sul renderer Master esistente, con CTA demo inattive. Codici servizi condivisi e dati sconosciuti mantenuti come non specificati.
- Nessuna modifica al renderer, modello, stile o dati della Scheda Master pubblica. Solo apertura diretta opzionale della scheda tramite parametro URL nella navigazione esistente.
- Test di isolamento, campi amministrativi, workflow, concorrenza, modello pubblico e traduzioni superati. Verificati caricamento foto, persistenza, gallery e responsive 390/768/1024/1440 px.
- Architettura, credenziali demo, limiti e autorizzazioni database future documentati in docs/area-operatori.md. Nessuna autenticazione reale e nessuna logica commerciale.
- Nessun commit, push o deploy: attesa approvazione grafica e funzionale. Attenzione per la fase successiva: il workflow su main pubblica automaticamente anche operatori/ se non viene esclusa.

### Approvazione Area Operatori v1 e salvataggio remoto

- Area Operatori v1 approvata dall’utente come prototipo funzionale. Prossimo passaggio: database + autenticazione reale, applicando le autorizzazioni lato database documentate in docs/area-operatori.md.
- Rieseguiti con esito positivo i test Area Operatori (workflow, permessi, isolamento e versioni), Scheda Master, allineamento traduzioni e conversazioni Cilentino; controllo sintattico dei nuovi moduli superato.
- Autorizzati commit “feat: add operator management area” e push su origin/main, senza pubblicazione. Il corpo del commit include [skip ci] per non avviare il deploy automatico di questo push.
- Aggiunta esclusione operatori/** nel workflow FTP anche per i futuri deploy: l’accesso demo non deve essere pubblicato come area riservata reale. Nessuna modifica alle credenziali o agli altri meccanismi di deploy.
- Renderer, stile, modello e dati pubblici della Scheda Master, Dove Mangiare e traduzioni esistenti restano invariati. La piccola apertura diretta via parametro URL resta salvata nel codice ma non viene distribuita con questo push.
- Esclusi cartelle locali, node_modules, screenshot e altri file temporanei. Nessun deploy richiesto o avviato intenzionalmente.

## Fase 3 — Step 3.1, contratti e configurazione (solo locale)

- Backend selezionato esplicitamente da operatori/config.json; demo mantenuta come selezione consegnata.
- App, Admin e anteprima usano contratti condivisi di sessione/repository. Eliminati gli import diretti dei moduli demo nelle tre viste.
- Provider Supabase riservato e intenzionalmente indisponibile: nessun collegamento remoto, SDK o fallback alla demo; errore visibile senza apertura IndexedDB o salvataggio locale.
- Configurazione Supabase vuota. .env.example contiene solo nomi con valori vuoti; nessuna credenziale generata o inserita. File ambiente privati esclusi da Git e deploy.
- Step 3.2 predisposto con sei specifiche .sql.template non eseguibili. Schema e RLS non ancora implementati né collaudati sul database. Nessuna migrazione remota applicata.
- Contratti e istruzioni in docs/operator-backend-contracts.md e supabase/README.md. Renderer, dati pubblici, Master e Dove Mangiare invariati.
- Test selettore/no-fallback, sessione demo, isolamento contesto, Area Operatori, Master e traduzioni superati; browser verificato nelle modalità demo e Supabase indisponibile.
- Nessun commit, push o deploy. Fermarsi qui e attendere autorizzazione al prossimo step e creazione guidata del progetto Supabase.

## 2026-09-18 — Step 3.2, schema e permessi soltanto locali

- Progetto indicato dall'utente: Cilentomania APS / Cilentomania HUB - DEV EU, Francoforte eu-central-1. Il precedente progetto Irlanda è escluso. Nessun collegamento remoto eseguito.
- Sei template sostituiti da sette migrazioni SQL versionate: identità, organizzazioni multiutente, schede multiple, revisioni separate, servizi a codici stabili, media, RLS, workflow e proiezione pubblica.
- Dati commerciali in tabelle private vuote. Nessun account Auth, organizzazione cliente o Dimora del Mare inserito dalle migrazioni; solo catalogo servizi.
- Approvazione separata dalla pubblicazione, revisioni inviate immutabili, nuova bozza dopo richiesta modifiche, grants client senza scritture dirette, campi amministrativi protetti e storico append-only.
- Storage privato predisposto, nessun upload client sovrascrivibile, validazione riservata al futuro worker server e verifica della copia preparata prima della pubblicazione.
- Test SQL locali con PGlite: 77 verifiche superate, principal di migrazione non superuser, due organizzazioni/sei utenti sintetici/tre schede. Fixture esclusivamente nel runner locale; nessun seed remoto.
- I test non certificano ancora Auth/JWT reali, Storage HTTP, PostgREST o concorrenza multi-connessione. Occorre un collaudo integrato sul DEV dopo autorizzazione separata.
- Frontend e selezione demo invariati; nessuna modifica a Master, Dove Mangiare o sito pubblico. Nessun commit, push o deploy.
- Procedura futura, matrice permessi e criticità in docs/supabase-step-3.2.md. Attendere autorizzazione prima di collegare o applicare qualsiasi migrazione remota.

### Correzione locale dopo collegamento DEV e preflight autorizzati

- Confermato il nome reale Cilentomania HUB - DEV UE, organizzazione Cilentomania APS, Francoforte eu-central-1. Primo dry-run: sette migrazioni pendenti, nessuna applicata.
- Rimossi i GRANT su auth/auth.uid() non supportati dai permessi remoti. Helper privato request_user_id(), di proprietà del principal di migrazione, conserva auth.uid() senza modificare oggetti Auth.
- Aggiornati i soli richiami identità nelle RPC HUB; policy authenticated con auth.uid() invariate. Frontend ancora demo.
- 87 test database superati con ACL Auth più fedeli al DEV e controllo di immutabilità di proprietà/permessi Auth e struttura/proprietà Storage.
- Il runner dichiara l'emulazione limitata delle quattro policy Storage, normalmente abilitate sul DEV da supautils.policy_grants. Nessuna elevazione generale del migratore nei test.
- Nessun utente/dato remoto creato, nessuna migrazione applicata, nessun commit/push/deploy. Nuova applicazione subordinata ad autorizzazione separata.
- Secondo dry-run completato dopo la correzione, con --dry-run --skip-vault: esattamente sette migrazioni pendenti. Stato remoto ricontrollato e invariato; nessun oggetto HUB/Storage creato. Il dry-run non esegue il SQL.

### Applicazione Step 3.2 sul DEV autorizzata e completata

- Riconfermato Cilentomania APS / Cilentomania HUB - DEV UE / Francoforte eu-central-1. Applicate le sole sette migrazioni, senza errori, seed o aggiornamenti Vault.
- Storico remoto allineato: sette applicate. 19 tabelle con RLS, 117 vincoli validati e 49 indici validi; corrispondenza completa dello schema previsto.
- Accesso anonimo privato negato anche con prova SQL; proiezione pubblica vuota correttamente. Due bucket privati e sole quattro policy Storage attese.
- Nessun account, organizzazione cliente, scheda o dato commerciale creato. Dieci codici servizi presenti; foto assenti.
- Impronte delle strutture/proprietà/permessi Auth e della struttura/proprietà Storage invariate. Nessuna configurazione Auth modificata.
- Remoto PostgreSQL 17.6, locale PGlite PostgreSQL 18.3: differenza di catalogazione NOT NULL normalizzata e verificata tramite colonne; nessuna differenza funzionale riscontrata.
- Rapporto: docs/supabase-step-3.2-applicazione-dev.md. Frontend ancora demo; nessun commit, push o deploy web. Attendere autorizzazione per lo step successivo.

### Step 3.3 — Integrazione Auth locale, non attivata

- Implementati password.html, adapter Supabase Auth, login/logout, recupero, invito e cambio password, sessione persistente SDK e protezioni CSP.
- Selezione auth separata da backend dati: configurazione ancora demo/demo con valori pubblici Supabase vuoti. Nessun fallback da Supabase a demo e nessuna associazione automatica fra utenti reali e organizzazioni demo.
- Dati/editor non collegati al database reale. Nessun account creato, email inviata, migrazione contenuti, commit/push/deploy.
- Test Auth simulati e regressioni superati, 87 controlli database/RLS locali; modulo responsive 390/768/1024/1440. Verifica reale di email e persistenza subordinata al prossimo account autorizzato.
- Dettagli, file e limiti: docs/supabase-step-3.3-auth.md. Fermarsi prima di configurazione pubblica chiavi/attivazione e primo account.
### Chiusura Fase 3 — pacchetto pubblico Auth autorizzato

Supabase DEV Francoforte operativo: sette migrazioni applicate, RLS/Data API verificate, SMTP Aruba info@cilentomania.it funzionante. Invito, impostazione password e sessione reale confermati dall'utente. Unico profilo test associato a [TEST] Cilentomania HUB con ruolo operator; zero schede e dati commerciali. Nessuna associazione a Dimora del Mare. Prossimo step: collegamento delle schede reali al backend.

I due redirect pubblici sono stati aggiunti manualmente e verificati, mantenendo quelli DEV e la Site URL locale. Il pacchetto pubblico usa callback HTTPS esplicito. Gli inviti dalla dashboard senza override seguono ancora la Site URL DEV: non usarli per inviti pubblici senza predisporre il redirect esplicito. Nessuna modifica remota durante questa pubblicazione.

Build pubblica con allowlist e solo autenticazione reale; demo Operatori, simulatore Admin, configurazioni locali, test e strumenti esclusi. La configurazione pubblica contiene solo URL e Publishable Key. Il pulsante Area Operatori viene attivato nel pacchetto pubblico; rimane il ritorno al sito HUB. Sito turistico e Scheda Master demo conservati.

Test Auth/backend/workflow/permessi/Scheda Master/traduzioni/Cilentino superati; 87 verifiche RLS locali. Controlli su segreti e riferimenti locali nel pacchetto superati. La verifica con account reale di login/logout/persistenza sul dominio pubblico richiede l'accesso personale dell'utente e non viene dichiarata conclusa dai soli test simulati. Il push main avvia il workflow di test, build e deploy Aruba; esito da verificare sul run e sul sito dopo il push.
