# Schede per attività — prototipo locale

## Stato e confini
Implementati editor distinti per strutture ricettive e ristorazione, mantenendo l’Area Operatori in italiano. La tipologia appartiene alla scheda, non all’account. Una stessa organizzazione può avere più utenti e più schede, anche di tipi diversi.

La demo aggiunge La Tavola del Mare alla stessa organizzazione di Dimora del Mare. Casa del Borgo appartiene a un’altra organizzazione. Sono esempi locali, non clienti né schede create su Supabase. L’aggiornamento della demo è additivo: non sostituisce bozze o foto già salvate.

Il modulo viene scelto in base al tipo assegnato alla scheda. L’operatore non può trasformare arbitrariamente una scheda ricettiva in ristorante né modificare proprietà, pubblicazione o campi amministrativi. La scelta del tipo in una futura richiesta di nuova scheda dovrà essere validata dal backend.

## Tipi e prossimi moduli
- accommodation: ricettività, operativo nella demo.
- restaurant: ristorazione, operativo nella demo; cucina, specialità, coperti, orari, menu, servizi specifici.
- experience: esperienze ed escursioni, da completare.
- event: eventi, da completare.
- service: servizi, da completare. Sottocategoria stabile beach_club per stabilimenti balneari, con futuro modulo dedicato: arenile, ombrelloni, lettini, docce, spogliatoi, accessibilità spiaggia, assistenza bagnanti, bar, apertura e prenotazione. Non viene presentata come già disponibile.
- itinerary: itinerari, da completare.

## Regola commerciale approvata, non attivata
Unità commerciale: singola scheda (listing), con futuro canone annuale. Albergo + ristorante + stabilimento balneare = tre schede, tre attivazioni/abbonamenti; un unico account può modificarle tutte se autorizzato. L’appartenenza a un’organizzazione non concede nuove schede illimitate.

Ogni scheda dispone di un blocco privato con listingId, billingUnit=listing, planId, subscriptionId, stato, decorrenza, scadenza e rinnovo. I valori assenti restano null. Nessun importo, contratto, pagamento, adesione o abbonamento attivo viene inventato. La pagina pubblica non espone tale blocco.

Le tabelle private Supabase subscriptions e contracts prevedono già listing_id. Nello step commerciale serviranno: richiesta separata di nuova scheda con tipo/sottotipo; verifica organizzazione; piano e prezzo gestiti dal server; pagamento verificato tramite evento server idempotente; attivazione e rinnovo per listing_id; vincolo sulla sola sottoscrizione corrente per scheda; storico rinnovi. La richiesta non deve generare automaticamente una scheda attiva o pubblicata. Eventuali pacchetti/sconti non sono definiti. Pubblicazione editoriale e stato commerciale rimangono distinti.

## Architettura e database
content-types.js registra moduli, servizi con codici indipendenti dalle traduzioni e categorie future. schemas/ raccoglie campi comuni e specifici. Il validatore rifiuta campi e servizi di un altro tipo. Zero è un dato valido; null rimane Non specificato, mai No.

La migrazione 20260918000800_restaurant_profiles.sql è preparata e testata SOLO nel database locale effimero. Aggiunge restaurants collegata alla revisione, codici servizi, RLS, protezione delle revisioni inviate e adegua salvataggio/copia/proiezioni. Preserva separazione versione pubblicata/bozza, ruoli e campi amministrativi. Nessuna modifica ad Auth/Storage gestiti, nessuna attivazione commerciale. Non è applicata al DEV remoto: lì restano le sette migrazioni approvate.

Prima del collegamento reale serve l’adapter che traduce i nomi italiani del modello demo nei campi SQL (es. coperti_interni → indoor_seats). Il campo claim già presente nella demo ricettiva non è ancora nel contratto SQL: va progettato prima dell’integrazione reale, senza perderlo silenziosamente. Traduzioni dei nuovi contenuti/servizi e localizzazione della futura scheda ristorante pubblica restano da completare; l’anteprima attuale è italiana e non è collegata a Dove Mangiare.

## Anteprima e verifiche
Anteprima separata: http://127.0.0.1:8766/operatori/ e http://127.0.0.1:8766/operatori/admin.html. Il server locale esterno al repository sceglie esplicitamente demo/demo; non è un fallback in caso di errore Supabase. La configurazione reale sulla porta 8765 resta invariata.

Account esclusivamente demo: anna@example.test / demo (due schede), luca@example.test / demo (stessa organizzazione), marta@example.test / demo (altra organizzazione).

Test: check-operator-area.cjs, check-operator-types.cjs, check-operator-backend.cjs, check-operator-auth.cjs, check-operator-profile.cjs, check-i18n-keys.js, supabase/tests/run.mjs. Build pubblica verificata separatamente: esclude ancora tutti i moduli demo/editor/Admin. Nessun commit, push, deploy o inserimento remoto effettuato in questo passaggio.

Verificati nel browser salvataggio/riapertura, anteprima, gallery, ritorno, invio, richiesta modifiche e approvazione locale del ristorante. Controlli responsive a 390, 768, 1024, 1440 px. I test database includono isolamento, permessi, copia revisione, blocco dopo invio e approvazione distinta dalla pubblicazione.

## File interessati
Modificati: operatori/js/model.js, demo-repository.js, editor.js, app.js, preview.js; operatori/data/demo.json; operatori/anteprima.html; tools/check-operator-area.cjs; supabase/tests/run.mjs; docs/note-progetto.md.
Creati: operatori/js/content-types.js; operatori/js/schemas/common.js, accommodation.js, restaurant.js; operatori/js/restaurant-preview.js; operatori/css/restaurant-preview.css; tools/check-operator-types.cjs; supabase/migrations/20260918000800_restaurant_profiles.sql; questo documento.

Il renderer della prima anteprima ristorante è confinato in operatori/ ed escluso dal pacchetto pubblico. Il riuso pubblico sarà valutato dopo approvazione grafica, completamento mappa/contatti e traduzioni; nessun renderer ricettivo o Dove Mangiare esistente è stato modificato.
