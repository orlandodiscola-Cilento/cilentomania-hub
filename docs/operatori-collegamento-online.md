# Collegamento online — preparazione locale

Stato: implementazione locale, NON attivata e NON pubblicata. Il backend pubblico resta Auth-only. La demo su 8766 rimane disponibile. Non sono state cambiate configurazioni locali Supabase, né effettuate richieste/operazioni remote o creati record.

## Completato
- Provider Supabase e repository RPC, senza IndexedDB o fallback demo.
- Mappatura dei campi ricettività/ristorazione, conservazione di null e zero, codici servizi e associazione Comune tramite UUID del catalogo remoto.
- Doppio controllo concorrenza: versione della scheda e versione/identità della revisione.
- Salvataggio atomico della bozza, inclusa creazione/copia da revisione approvata o da correggere; rollback se i dati non sono validi.
- Campo claim (Frase di presentazione) mantenuto nel database e nella proiezione pubblica.
- Invio alla revisione senza pubblicazione, API di confronto/revisione e prima interfaccia interna riservata ai ruoli staff reali. Confronto ancora tecnico da rifinire graficamente.
- Dashboard online vuota se non ci sono schede, senza assegnazione di demo.
- Editor riutilizzato con messaggi online; anteprima privata e lettura foto esistenti tramite URL firmati di 5 minuti. Nessun URL firmato memorizzato o documentato.
- Foto nuove deliberatamente disabilitate nel modulo online: serve completare upload, recupero errori, pulizia oggetti orfani e validazione server delle immagini. La demo mantiene upload locale.

## Migrazioni da approvare prima dell’applicazione
008 restaurant_profiles: già preparata, tabella restaurants, servizi e adeguamento RPC/proiezioni. Non applicata al DEV.
009 operator_online_contract: nuovo claim, aggiornamento save_draft/public_listing, save_listing_draft atomica, list_municipalities autenticata e feedback nella revisione. Permesso CREATE su hub_api concesso temporaneamente a hub_executor solo per trasferire le funzioni, revocato nella stessa migrazione. Nessuna modifica Auth, Storage gestito o dati commerciali.

## Attivazione prevista
Dopo controllo/dry-run e autorizzazione, applicare esclusivamente 008 e 009 al DEV Francoforte. Ricontrollare privilegi, RLS e assenza di accesso anonimo. In seguito selezionare backend=supabase e auth=supabase nel file locale ignorato da Git, mantenendo URL/Publishable key inseriti dall’utente. Nessuna service_role nel browser. La configurazione pubblica non è stata modificata.

Il test completo di scrittura reale richiede schede assegnate: proporre due nuove schede chiaramente TEST (ricettività e ristorante), non pubblicate, nell’organizzazione esistente [TEST] Cilentomania HUB. Attendere autorizzazione ai record esatti, non importare Dimora del Mare né creare altri account. Il catalogo Comuni remoto deve essere verificato e popolato con dati reali approvati prima di selezionare un Comune; nessun inserimento automatico effettuato qui.

## Verifiche e limiti
109 verifiche PostgreSQL/RLS locali incluse isolamento, concorrenza, rollback, campi amministrativi, immutabilità pubblicato e autorizzazioni. Test adapter con client simulato: mappatura, salvataggio/invio, nessun dato per account vuoto, account disabilitato, errori ripuliti. Regressioni demo, Auth, backend, Master e lingue.

Non ancora collaudati con dati remoti: salvataggio end-to-end, anteprima di foto reali, revisione con staff reale, scadenza URL foto, responsive della dashboard online popolata. Nessun deploy consentito finché questi controlli e il caricamento immagini non saranno completati. I test simulati non dimostrano che un salvataggio remoto reale sia avvenuto.

## File di questo passaggio
Nuovi: operatori/js/supabase-repository.js, online-ui.js, online-review.js; tools/check-operator-online.cjs; supabase/migrations/20260918000900_operator_online_contract.sql; questo documento.
Modificati: operatori/js/supabase-backend.js, app.js, auth-ui.js, editor.js, media.js, preview.js, restaurant-preview.js; supabase/tests/run.mjs; docs/note-progetto.md.


## Aggiornamento: applicazione DEV autorizzata

Applicate con CLI ufficiale le migrazioni 008 e 009 al solo progetto qgkwqzjapvjvzmvdfges, Cilentomania HUB - DEV UE, eu-central-1, dopo verifica progetto, storico e dry-run. Nessun errore. Nove migrazioni presenti. RLS attiva su tutte le tabelle private, nessuna scrittura diretta browser, nuova RPC inaccessibile ad anon e CREATE su hub_api revocato a hub_executor.

Create in un’unica transazione due schede e relative bozze iniziali, is_demo=true: [TEST] Struttura ricettiva (test-struttura-ricettiva) e [TEST] Ristorante (test-ristorante), nella sola organizzazione esistente [TEST] Cilentomania HUB. Entrambe unpublished, published_revision_id nullo, proiezioni pubbliche nulle. Membership resta operator, nessuno staff. Un account Auth, un’organizzazione, zero dati commerciali; impronta catalogo Auth e quattro policy Storage invariate. Nessun dato Dimora del Mare.

Selezionati backend=supabase e auth=supabase nei soli config.local.json ignorati da Git, mantenendo URL/Publishable Key. Porta 8765 ora pronta per il login reale; porta 8766 ancora demo separata. Login personale del titolare necessario per il collaudo browser: non dichiarato completato. Catalogo Comuni remoto ancora vuoto, nuove foto online disabilitate. Nessun commit, push o deploy.

### Foto private e inquadratura — DEV

Applicata la migrazione 010 media_framing al solo DEV Francoforte, dopo dry-run che elencava esclusivamente tale migrazione. Introduce posizione focale per revisione e RPC autenticata di disponibilità; nessuna modifica degli oggetti Auth o delle policy Storage. Caricamento privato JPG/PNG/WebP entro 5 MB e 40 megapixel, fino a 40 foto. Originale conservato, copertina senza deformazioni con cursori orizzontale/verticale, logo intero, gallery intera. Prima foto impostata come copertina.

Collaudo reale: una foto del territorio chiaramente illustrativa caricata nella sola scheda [TEST] Ristorante; bozza salvata online con inquadratura 25/75. Scheda ricettiva aperta dall’utente con modifiche non salvate lasciata intatta. 113 controlli database locali e test upload/retry, adapter online, Auth, backend, tipologie e Master superati. Pacchetto pubblico ancora Auth-only, nessun commit/push/deploy.

Limiti: validazione definitiva delle immagini lato server e pulizia automatica degli upload orfani restano da implementare prima della pubblicazione delle foto. I media rimangono pending e non possono essere pubblicati senza validazione. In caso di errore dopo il salvataggio testi, un messaggio esplicito invita a mantenere aperta la pagina e riprovare: la stessa sessione riusa la registrazione dell’upload. Gli URL privati scadono dopo 5 minuti; riaprire la scheda li rinnova. Nessuna nuova organizzazione, account o dato commerciale.
