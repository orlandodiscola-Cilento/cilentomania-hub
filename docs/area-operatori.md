# Area Operatori v1 — demo locale

Implementazione del 17 settembre 2026. Nessuna autenticazione reale, connessione Supabase, email, pagamento o pubblicazione remota. Non inserire dati personali o credenziali reali.

## Accesso e percorsi

- Area Operatori: `operatori/index.html` (directory `/operatori/` nel server locale, in futuro `/hub/operatori/`).
- Area Cilentomania: `operatori/admin.html`, simulatore esplicitamente aperto e non riservato.
- Anteprima: `operatori/anteprima.html?scheda=mare`; richiede una sessione demo autorizzata. La variante Admin visualizza un invio preciso.
- Anna: `anna@example.test`; Luca: `luca@example.test`. Entrambi appartengono a Dimora del Mare.
- Marta: `marta@example.test`, organizzazione distinta Ospitalità del Borgo.
- Password dimostrativa per tutti: `demo`. Non è salvata né inviata; la sessione conserva solo l'identificativo utente in sessionStorage.
- Il recupero password mostra un avviso: non invia email.

IndexedDB `cilentomania-operatori-v1` conserva dati e fotografie nel browser. Chiusura/riapertura non elimina le bozze, ma cancellare i dati del browser le elimina. Browser, dispositivi e origini differenti (localhost e indirizzo LAN compresi) hanno copie indipendenti. Non è un backup remoto. La coda parte vuota in un browser nuovo: effettuare un invio per popolarla.

## Separazione delle responsabilità

- UI: app.js, editor.js, admin.js, dialog.js; stile dedicato e documenti separati dal sito turistico.
- Modello e validazione: model.js. Un elenco esplicito consente esclusivamente i campi editoriali. I servizi usano `OperatorProfileModel.SERVICE_CODES`, senza duplicare codici o tradurli nei dati.
- Appartenenze: permissions.js; utenti e organizzazioni collegati da un array di membership, senza vincoli uno-a-uno.
- Stati e transizioni: workflow.js. Etichette comprensibili distinte dai codici interni.
- Accesso dati: contratto asincrono repository.js; implementazione demo-repository.js. La UI non legge direttamente IndexedDB.
- Sessione: demo-session.js, sostituibile con una sessione reale. Il ruolo viene ricavato dal modello utenti, non da un pulsante nell'editor.
- Media: media.js; ogni immagine possiede id, kind (logo/cover/gallery), order, caption e alt, con Blob locale o riferimento a un'immagine esistente. Massimo 40 immagini e 5 MB ciascuna, JPG/PNG/WebP. Un solo logo e una sola copertina.
- Anteprima: preview.js, stesso modello/renderer/CSS della Scheda Master pubblica. I Blob sono risolti in URL temporanei soltanto nella preview, senza allargare i protocolli ammessi dal modello pubblico. I contenuti territoriali vengono letti dalla fonte pubblica e non sono duplicati nell'editor.

Le schede appartengono a organizationId; ogni organizzazione può possedere molte schede, anche di tipi differenti. La v1 implementa l'editor ricettivo; gli editor degli altri tipi verranno aggiunti in seguito. `contentOwner` identifica l'organizzazione titolare. I dati commerciali restano separati, null e non modificabili dall'operatore.

## Versioni e stati

Il seed contiene riferimenti alla scheda pubblica, non una seconda copia JSON del suo contenuto. All'inizializzazione il browser prepara una copia locale di lavoro e, dove previsto, una fotografia indipendente della versione pubblicata.

- `publishedVersion`: ultima fotografia pubblicata nella simulazione, mai modificata da Salva o Approva.
- `workingRevision`: bozza corrente dell'operatore.
- `revisions`: invii congelati nei contenuti, con stato/esito della redazione. Una correzione dopo richiesta o approvazione genera un nuovo identificativo; gli invii precedenti restano consultabili.
- `version`: controllo di concorrenza per impedire la sovrascrittura silenziosa da un'altra finestra/utente demo. In caso di conflitto occorre riaprire la scheda.

Operatore: salva una bozza e la invia (`draft` → `submitted`). Durante `submitted` e `in_review` l'editor è consultabile, ma non modificabile. Dopo `changes_requested`, `approved` o `published`, un nuovo salvataggio crea una nuova bozza.

Admin: `submitted` → `in_review`, `approved` o `changes_requested`; `in_review` → `approved` o `changes_requested`. Per richiedere modifiche è obbligatorio spiegare cosa correggere. L'approvazione **non pubblica** e non cambia publishedVersion. La sezione esplicita di simulazione può portare una revisione approvata a `published` oppure simulare `suspended`/riattivazione, sempre solo in IndexedDB.

La pagina pubblica continua a leggere i JSON esistenti. Non legge IndexedDB e non importa moduli dell'area gestionale. `?scheda=CAST-DORM-MASTER-DEMO` apre il dettaglio esistente: è l'unica integrazione nel sito, senza variazioni grafiche alla Master o a Dove Mangiare.

## Autorizzazioni da implementare nel backend futuro

I controlli locali permettono di provare il comportamento, **non costituiscono una barriera di sicurezza**: il browser è controllabile dall'utente e Admin è deliberatamente un simulatore aperto. Nascondere pulsanti o usare noindex non protegge dati. Prima dell'uso reale occorrono:

1. Autenticazione verificata dal server, con identità non accettata dal payload del client; ruoli redazionali gestiti esclusivamente da soggetti autorizzati.
2. Tabelle organizzazioni, utenti e membership molti-a-molti; contenuti con organizationId immutabile per l'operatore; revisioni e media collegati al contenuto e alla stessa organizzazione. Vincoli referenziali impediscono associazioni fra organizzazioni diverse.
3. Autorizzazioni database per ogni lettura/scrittura: appartenenza attiva all'organizzazione, oppure ruolo redazionale verificato. Nessuna fiducia in organizationId/userId passati dalla UI.
4. Bozze, invii e media non pubblicati privati. Il pubblico può leggere solo la proiezione esplicita dell'ultima versione pubblicata e non sospesa, senza campi amministrativi, revisioni o riferimenti commerciali.
5. Permessi di colonna/operazioni server: operatore autorizzato solo sui campi editoriali elencati; esclusi organizationId, contentOwner, planId, subscriptionId, contratto, pagamento, scadenze, ruoli e pubblicazione. RLS sulle righe da sola non basta a proteggere le colonne.
6. Invio, revisione e pubblicazione come operazioni atomiche server con transizioni validate e controllo di versione; audit di autore, data ed esito. Pubblicazione consentita solo alla redazione e solo da una revisione approvata.
7. Storage con autorizzazioni per organizzazione e contenuto, URL privati a scadenza per bozze, immagini pubbliche solo dopo pubblicazione. Validare realmente tipo/dimensioni/contenuto del file lato server, oltre ai controlli UX del browser.
8. Test negativi API/database/storage con due organizzazioni, più utenti e tentativi di modificare campi vietati; mai includere chiavi privilegiate nel browser.

Il workflow pubblica normalmente ogni push su main. Dopo l’approvazione del prototipo, `operatori/**` è stato escluso dalla sincronizzazione FTP per impedirne la pubblicazione accidentale. Il commit di salvataggio include [skip ci] per saltare anche il deploy di questo push. Non rimuovere l’esclusione prima della futura autorizzazione alla pubblicazione con database e autenticazione reale.

## Collaudo locale

- `node tools/check-operator-area.cjs`: isolamento di due organizzazioni, membri multipli, più schede e tipi, campi vietati, conflitti, salvataggio/invio/revisione/approvazione/richiesta modifiche, separazione delle versioni, stati editoriali, metadati media.
- `node tools/check-operator-profile.cjs`: modello pubblico, CTA demo, codici servizi, dati sconosciuti e cinque lingue.
- `node tools/check-i18n-keys.js`: allineamento dizionari esistenti. La UI gestionale v1 è in italiano.
- Controllo sintattico di tutti i moduli nuovi e di territory.js.
- Browser: Salva → riapertura → Anteprima → Invio → Admin → Richiedi modifiche → correzione/reinvio → Approva; visualizzazione dello storico; Anna/Luca stessa scheda, Marta separata e accesso diretto alla scheda altrui negato.
- Foto demo caricata da asset esistente, didascalia/ALT modificati, riordinamento, salvataggio e riapertura; fotografia caricata visibile nella gallery condivisa.
- Login, dashboard, editor, preview e Admin controllati a 390/768/1024/1440 px, senza overflow orizzontale della pagina. Le sezioni editor scorrono orizzontalmente sullo smartphone.

Prototipo funzionale approvato: commit e push autorizzati per il salvataggio, senza deploy. Prossima fase: database e autenticazione reale. La verifica locale non equivale a un test di sicurezza backend o a un collaudo su dispositivi fisici.
