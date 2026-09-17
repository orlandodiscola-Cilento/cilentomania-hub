# Scheda Master Operatore — prima versione locale

## Ambito

Prima scheda per Dove Dormire, integrata nel pannello esistente. Percorso: Dove dormire → Castellabate → Dimora del Mare (badge DEMO). Nessuna modifica al dettaglio Dove Mangiare. La struttura è immaginaria; fotografie del territorio, servizi e caratteristiche sono esempi, non informazioni verificate su un hotel reale.

## Architettura

- `js/operator-profile-model.js`: normalizzazione del record, codici servizi, URL e coordinate, azioni disponibili, riferimenti correlati.
- `js/operator-profile.js`: presentazione della sola `publicProfile`, gallery accessibile, navigazione interna, mappa su richiesta e Concierge.
- `css/operator-profile.css`: stili isolati, mobile-first, layout tablet/desktop, preferenza movimento ridotto.
- `js/territory.js`: integrazione limitata al dettaglio accommodation; conserva stato filtri e ritorno elenco. Non mostra il badge Partner su bozze ricettive.
- `data/strutture-ricettive.json`: nuova demo; i record precedenti sono conservati.
- `i18n/{it,en,de,fr,es}.json`: etichette nel namespace `operatorProfile`.

`normalize(record, language)` separa `publicProfile` e `administration`. Il renderer riceve solo la prima. Il modello include organizationId, contentOwner, editorialStatus, planId e subscriptionId; il blocco commercial contiene startsAt, expiresAt, subscriptionStatus e renewalAt. Sono predisposizioni senza logica di contratti, rinnovi o pagamenti e senza elementi commerciali pubblici.

ATTENZIONE: non renderizzare un campo non lo rende segreto. Il JSON statico è scaricabile. In questa versione contiene solo segnaposto null e stati dimostrativi. In futuro i dati amministrativi reali devono vivere in un backend autenticato e non essere inclusi nelle risposte pubbliche.

## Dati e riutilizzo

I servizi usano codici invarianti: wifi, pool, parking, breakfast, air_conditioning, sea_view, pets, accessible, spa, restaurant. Le etichette sono tradotte separatamente. Un adattatore legge anche le etichette italiane dei vecchi record. I booleani possono essere true, false o null: null viene visualizzato come “Non specificato”, mai come “No”. L'assenza di un codice servizio non costituisce prova che il servizio non esista.

Per estendere ad altri settori, mantenere identità, media, contatti e riferimenti correlati comuni; aggiungere adattatori e campi specifici per ciascun tipo. Non sono stati implementati altri settori, database, area operatore, abbonamenti, contratti, avvisi o pagamenti. L'apertura diretta tramite URL dedicata e l'indicizzazione autonoma della scheda restano evoluzioni future del pannello attuale.

## Azioni e media

Chiama, WhatsApp, Indicazioni e Prenota sono disponibili solo con destinazioni valide su un record pubblicato non demo. Nella demo sono dichiarati inattivi: nessuna telefonata, messaggio o prenotazione reale viene avviata. Anche contatti e social non vengono inventati. La gallery supporta pulsanti, frecce, Esc e ripristino del focus. Mappa caricata solo su richiesta; per la demo indica il Comune, non un hotel. Collegamento OpenStreetMap alternativo sempre presente dopo l'attivazione.

## Verifiche del 17 settembre 2026

- Anteprima locale a 390, 768, 1024 e 1440 px: controlli visivi e assenza di overflow orizzontale.
- Gallery: apertura, avanzamento, Esc senza chiudere la scheda e ritorno del focus.
- Ritorno all'elenco: ricerca precedente conservata. Collegamento al territorio verificato su Agropoli.
- Concierge: apre il personaggio e il contesto ricettivo di Castellabate.
- Italiano, inglese, tedesco, francese e spagnolo: testi della scheda controllati nel browser; chiavi e rendering verificati automaticamente. Non è stata collaudata ogni combinazione lingua/dispositivo.
- Dove Mangiare: elenco, dettaglio e ritorno all'elenco conservati.
- `node tools/check-operator-profile.cjs`: cinque lingue, separazione pubblico/amministrazione, null vs false, CTA demo e URL di fixture pubblicata, codici servizi, coordinate, riferimenti e immagini locali.
- Sintassi JavaScript e `git diff --check`: superati.

Limiti: nel browser dell'anteprima la cartografia incorporata OpenStreetMap è rimasta vuota; URL e collegamento alternativo presenti, causa non determinata. CTA reali validate con dati sintetici senza effettuare chiamate o prenotazioni. I testi italiani preesistenti nella homepage multilingue non sono stati modificati. Nessun commit, push o deploy eseguito.

## Secondo passaggio grafico — 17 settembre 2026

Hero immersiva con titolo sovrapposto e logo opzionale (`logo`, URL validato; omesso se assente), badge DEMO separato. CTA subito dopo la hero e sticky su smartphone; navigazione sticky da 701 px, scorrevole orizzontalmente su smartphone. Servizi compatti e caratteristiche visuali.

Nuovi campi: `numero_camere`, `posti_letto` (interi >= 0 oppure null), `check_in`, `check_out` (HH:mm oppure stringa vuota). Nessuna conversione implicita da sconosciuto a zero o No. La demo usa valori esemplificativi dichiarati.

Gallery senza limite fisso nel modello: sei anteprime, altre immagini espandibili e lightbox su tutte (demo con sette immagini). `territoryContent` è una collezione sostituibile da dati futuri: id, type (event/experience/restaurant/itinerary), municipalityId, title, description, image, demo e translations. Mostra solo record del Comune corrente, con dettagli espandibili e badge demo. Non è una ricerca live e non crea prenotazioni o eventi reali.

Mappa: caricamento diretto per record pubblicati non demo con coordinate valide; demo su richiesta con link esterno di fallback. Cartografia esterna ancora non visibile nel browser locale. Concierge apre la chat esistente, conserva il ruolo e non invia automaticamente domande.

Verifiche secondo passaggio: layout 390/768/1024/1440, CTA mobile visibili nella prima schermata, sticky e controlli di chiusura separati, gallery 7/7 ed Esc, quattro blocchi espandibili, chat sopra la scheda, test nuovi campi e traduzioni. Nessun commit, push o deploy.

## Versione approvata per pubblicazione

Flusso finale semplificato: Hero → CTA → Presentazione → Servizi → Caratteristiche → Mappa → Contenuti nei dintorni. Rimossi navigazione interna, riquadro Concierge e gallery separata. Tutte le sette foto restano accessibili dal pulsante della hero; chat generale invariata. Contatti reali, quando presenti, integrati nella presentazione. Desktop e 390 px verificati; test Scheda Master, traduzioni e conversazioni superati. Pubblicazione autorizzata dall’utente tramite workflow esistente su main. La demo rimane esplicitamente identificata e con CTA inattive.
