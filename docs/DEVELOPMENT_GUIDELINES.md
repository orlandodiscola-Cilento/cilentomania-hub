# Cilentomania HUB

## Standard permanente di sviluppo

Questo documento costituisce il riferimento ufficiale per tutte le future implementazioni di Cilentomania HUB. Le regole qui definite devono essere applicate automaticamente durante ogni attività di analisi, progettazione, sviluppo, verifica e consegna.

## 1. Responsive Design

Ogni nuova implementazione deve funzionare correttamente su:

- desktop;
- tablet;
- smartphone.

Nessuna nuova funzionalità deve essere progettata esclusivamente per desktop.

Prima di considerare conclusa un’attività è obbligatorio verificare:

- assenza di overflow orizzontale involontario;
- corretta leggibilità dei testi;
- immagini responsive e prive di deformazioni;
- pulsanti facilmente utilizzabili e con dimensioni tattili adeguate;
- modali completamente contenuti nel viewport;
- griglie adattive rispetto allo spazio disponibile;
- corretta navigazione mobile;
- assenza di elementi tagliati, sovrapposti o irraggiungibili.

Le cause dei problemi responsive devono essere corrette direttamente. Non è consentito limitarsi a nasconderle tramite `overflow-x: hidden` o soluzioni equivalenti.

## 2. Design System

Ogni nuovo componente deve rispettare il Design System esistente.

Devono rimanere coerenti:

- colori;
- tipografia;
- pulsanti;
- card;
- modali;
- icone;
- spaziature;
- bordi e raggi;
- ombre;
- animazioni e transizioni.

I componenti comuni devono essere riutilizzati. Non devono essere introdotti stili o varianti differenti senza esplicita autorizzazione progettuale.

## 3. Navigazione

Ogni nuova pagina o modale deve prevedere, quando applicabile:

- pulsante **Indietro**;
- pulsante **Torna su**;
- pulsante **Chiudi**.

I controlli devono:

- riutilizzare i componenti di navigazione esistenti;
- essere coerenti tra le diverse sezioni;
- essere facilmente raggiungibili;
- rimanere interamente visibili nel viewport;
- essere ottimizzati per smartphone e dispositivi touch;
- non sovrapporsi ai contenuti o alle aree riservate del browser.

Il pulsante Indietro deve essere presente quando esiste una vista precedente significativa. Il pulsante Chiudi è richiesto nei modali, mentre non è necessario nelle normali pagine pubbliche.

## 4. SEO Foundation

Ogni nuova pagina pubblica deve utilizzare automaticamente la SEO Foundation già presente nel progetto.

È vietato duplicare codice o configurazioni SEO. Titoli, descrizioni, canonical URL, Open Graph, Twitter/X Card, dati strutturati e altri metadati devono essere gestiti attraverso l’infrastruttura centralizzata esistente.

Non devono essere generati metadati vuoti, non supportati o basati su informazioni inventate.

## 5. Accessibilità

Ogni implementazione deve verificare almeno:

- ALT appropriati per le immagini informative;
- `alt=""` o gestione equivalente per le immagini decorative;
- contrasto sufficiente tra testo e sfondo;
- leggibilità dei testi;
- stati focus visibili;
- nomi accessibili per pulsanti, link e controlli iconografici;
- dimensioni tattili adeguate;
- navigazione coerente tramite tastiera e dispositivi touch;
- corretta gestione semantica di modali e controlli.

## 6. Performance

Preferire sempre:

- lazy loading per immagini e risorse non immediatamente necessarie;
- immagini ottimizzate e responsive;
- dimensioni esplicite per ridurre gli spostamenti del layout;
- codice riutilizzabile;
- configurazioni centralizzate;
- caricamento proporzionato alle necessità della pagina;
- assenza di duplicazioni di logica e risorse.

Ogni scelta deve evitare complessità e costi di caricamento non giustificati.

## 7. Manutenibilità

Preferire sempre:

- componenti modulari;
- dati separati dalla struttura e dalla logica;
- configurazioni centralizzate;
- un’unica fonte attendibile per ciascun dato condiviso;
- classi e funzioni riutilizzabili;
- architettura facilmente estendibile;
- nomi chiari e coerenti.

Le modifiche future devono poter essere effettuate dal minor numero possibile di punti, senza interventi ripetitivi su HTML, CSS o JavaScript.

## 8. Architettura

Non modificare autonomamente:

- struttura del sito;
- organizzazione dei moduli;
- flussi di navigazione;
- Responsive System;
- Design System;
- SEO Foundation.

Qualsiasi cambiamento architetturale significativo richiede approvazione preventiva.

Se una richiesta comporta una scelta progettuale, modifica i flussi esistenti oppure presenta più soluzioni con conseguenze sostanzialmente differenti, l’implementazione deve essere sospesa e deve essere richiesta una decisione progettuale.

## 9. Qualità del codice

Ogni soluzione deve privilegiare:

- semplicità;
- chiarezza;
- modularità;
- riuso del codice;
- facilità di manutenzione;
- scalabilità;
- comportamento prevedibile;
- gestione esplicita degli errori e dei fallback.

Non introdurre codice morto, duplicazioni, dipendenze inutili o soluzioni temporanee non documentate.

## 10. Verifica finale obbligatoria

Ogni attività deve terminare con verifiche proporzionate all’intervento e con un report contenente almeno:

- file modificati;
- eventuali nuovi file;
- verifiche effettuate;
- eventuali limitazioni o criticità residue;
- **Desktop verificato ✅**;
- **Tablet verificato ✅**;
- **Smartphone verificato ✅**.

Se una delle tre classi di dispositivi non può essere verificata direttamente, il limite deve essere dichiarato chiaramente e non può essere presentato come verifica completata.

Quando applicabile, la verifica deve comprendere:

- sintassi JavaScript;
- validità dei file JSON;
- assenza di regressioni;
- accessibilità dei controlli;
- collegamenti e navigazione;
- assenza di overflow anomalo;
- `git diff --check`.

### Operazioni Git vietate senza approvazione

Non eseguire mai automaticamente:

- `git add`;
- `git commit`;
- `git push`;
- creazione di tag.

Attendere sempre l’approvazione esplicita prima di qualsiasi operazione Git che prepari o pubblichi modifiche.

## Applicazione permanente

Questa guida è una regola permanente del progetto. Deve essere consultata e applicata come riferimento operativo in tutte le future implementazioni di Cilentomania HUB, senza che sia necessario ripeterne ogni volta i contenuti.
