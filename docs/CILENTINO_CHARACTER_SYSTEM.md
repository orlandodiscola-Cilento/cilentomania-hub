# CILENTINO CHARACTER SYSTEM

Data: 1 agosto 2026

## Scopo del documento

Questo documento definisce il Character System ufficiale di Cilentino per Cilentomania HUB. In questa fase non sono stati modificati PNG, codice, cartelle, nomi file, riferimenti o configurazioni. Il documento fotografa lo stato attuale degli asset in `assets/cileo/avatar/` e fissa lo standard grafico e tecnico da applicare nelle fasi successive.

## Esito sintetico

- Gli avatar storici e gli avatar tematici condividono la stessa identita di marca, ma non appartengono ancora alla stessa famiglia di produzione.
- Le pose storiche sono un set legacy a bassa risoluzione, con resa grafica piatta e dimensioni non uniformi.
- Gli avatar tematici costituiscono un insieme di riferimenti utili per il futuro master system: hanno resa 3D coerente, stessa tela quadrata e struttura facciale in larga parte allineata.
- Nessuno degli avatar professionali attualmente esistenti costituisce il Master definitivo. Gli avatar presenti sono riferimenti visivi e bozze di ruolo. Il Master ufficiale dovra essere progettato come versione neutra autonoma.

## Audit tecnico dei PNG

### Gruppo A. Pose storiche

| File | Canvas | Rapporto | Peso | Trasparenza | Bounding box | Margini T/B/L/R | Altezza visiva | Centratura | Qualita grafica | Incoerenze |
|---|---:|---:|---:|---|---|---|---:|---|---|---|
| `Avatar_Cileo_Ciao.png` | 184x200 | 0.9200 | 45.9 KB | Si | x12 y19 w157 h172 | 19 / 9 / 12 / 15 | 172 px | quasi centrato | buona per usi piccoli, resa legacy | top margin alto |
| `Avatar_Cileo_Pensa.png` | 185x200 | 0.9250 | 38.5 KB | Si | x34 y11 w108 h177 | 11 / 12 / 34 / 43 | 177 px | decentrato | discreta, ma silhouette stretta | troppo vuoto laterale |
| `Avatar_Cileo_Cerca.png` | 128x190 | 0.6737 | 44.3 KB | Si | x11 y2 w114 h186 | 2 / 2 / 11 / 3 | 186 px | spostato a destra | discreta, ma molto compressa | canvas molto stretto |
| `Avatar_Cileo_Indica.png` | 176x190 | 0.9263 | 45.1 KB | Si | x7 y4 w154 h180 | 4 / 6 / 7 / 15 | 180 px | lieve shift a sinistra | buona per il set storico | margini laterali diseguali |
| `Avatar_Cileo_Ok.png` | 180x190 | 0.9474 | 46.9 KB | Si | x8 y5 w162 h178 | 5 / 7 / 8 / 10 | 178 px | equilibrato | la piu coerente del set storico | nessuna anomalia grave |
| `Avatar_Cileo_Cartina.png` | 150x200 | 0.7500 | 43.5 KB | Si | x18 y18 w124 h173 | 18 / 9 / 18 / 8 | 173 px | spostato a destra | discreta | margine alto e canvas stretto |
| `Avatar_Cileo_Idea.png` | 162x190 | 0.8526 | 46.1 KB | Si | x6 y13 w146 h171 | 13 / 6 / 6 / 10 | 171 px | lieve shift a sinistra | buona | top margin un po' alto |
| `Avatar_Cileo_Arrivederci.png` | 172x194 | 0.8866 | 41.7 KB | Si | x19 y19 w140 h162 | 19 / 13 / 19 / 13 | 162 px | quasi centrato | discreta | figura visivamente piu piccola |
| `Avatar_Cileo_Abbraccio.png` | 160x190 | 0.8421 | 39.5 KB | Si | x16 y7 w132 h170 | 7 / 13 / 16 / 12 | 170 px | quasi centrato | buona | leggermente stretta |

### Valutazione del gruppo storico

- Coerenti nel proprio set: `Avatar_Cileo_Ok`, `Avatar_Cileo_Indica`, `Avatar_Cileo_Ciao`, `Avatar_Cileo_Abbraccio`.
- Troppo piccoli: `Avatar_Cileo_Arrivederci`, `Avatar_Cileo_Pensa`.
- Troppo alti o compressi nel canvas: `Avatar_Cileo_Cerca`.
- Con margini anomali: `Avatar_Cileo_Pensa`, `Avatar_Cileo_Cartina`, `Avatar_Cileo_Cerca`.
- Da normalizzare integralmente: tutti i file del gruppo storico.

### Gruppo B. Avatar tematici

| File | Canvas | Rapporto | Peso | Trasparenza | Bounding box | Margini T/B/L/R | Altezza visiva | Centratura | Qualita grafica | Incoerenze |
|---|---:|---:|---:|---|---|---|---:|---|---|---|
| `cilentino-chef.png` | 1254x1254 | 1.0000 | 609.7 KB | Si | x0 y66 w1254 h1188 | 66 / 0 / 0 / 0 | 1188 px | non centrato | alta, render 3D pulito | tocca tutti i bordi |
| `cilentino-concierge.png` | 1254x1254 | 1.0000 | 758.7 KB | Si | x258 y92 w816 h1026 | 92 / 136 / 258 / 180 | 1026 px | spostato a destra | molto alta | lieve decentratura |
| `cilentino-marinaio.png` | 1254x1254 | 1.0000 | 682.9 KB | Si | x335 y103 w602 h995 | 103 / 156 / 335 / 317 | 995 px | quasi centrato | alta | figura un po' piccola |
| `cilentino-bagnino.png` | 1254x1254 | 1.0000 | 645.5 KB | Si | x333 y133 w654 h959 | 133 / 162 / 333 / 267 | 959 px | spostato a destra | alta | troppo piccolo |
| `cilentino-archeologo.png` | 1254x1254 | 1.0000 | 789.1 KB | Si | x236 y94 w787 h995 | 94 / 165 / 236 / 231 | 995 px | molto buono | molto alta | lieve altezza contenuta |
| `cilentino-guida.png` | 1254x1254 | 1.0000 | 941.3 KB | Si | x118 y63 w965 h1106 | 63 / 85 / 118 / 171 | 1106 px | spostato a sinistra | molto alta | troppo grande |
| `cilentino-escursionista.png` | 1254x1254 | 1.0000 | 662.1 KB | Si | x383 y90 w533 h968 | 90 / 196 / 383 / 338 | 968 px | leggero shift a destra | alta | troppo piccolo e alto nel frame |
| `cilentino-agricoltore.png` | 1254x1254 | 1.0000 | 905.2 KB | Si | x298 y96 w762 h1058 | 96 / 100 / 298 / 194 | 1058 px | spostato a destra | molto alta | scala un po' grande |

### Valutazione del gruppo tematico

- Gia vicini allo standard: `cilentino-concierge`, `cilentino-archeologo`, `cilentino-marinaio`.
- Troppo piccoli: `cilentino-bagnino`, `cilentino-escursionista`.
- Troppo grandi: `cilentino-chef`, `cilentino-guida`, `cilentino-agricoltore`.
- Con margini anomali: `cilentino-chef`, `cilentino-escursionista`, `cilentino-guida`, `cilentino-agricoltore`.
- Decentrati: `cilentino-concierge`, `cilentino-bagnino`, `cilentino-guida`, `cilentino-agricoltore`.
- Da normalizzare: tutti gli avatar tematici, ma con interventi leggeri su `cilentino-concierge`, `cilentino-archeologo` e `cilentino-marinaio`.

## Stato degli asset attuali

- Gli avatar tematici attuali sono bozze o riferimenti di ruolo, non il set definitivo del Character System.
- Non devono essere assunti come standard finale solo perche gia esistenti in versione 3D.
- Gli avatar storici restano un archivio utile di espressioni e comportamento, ma non costituiscono il nuovo standard tecnico.
- Tutti gli asset attuali dovranno essere confrontati con il futuro Cilentino Master approvato.
- Se necessario, ruoli ed espressioni saranno rigenerati o uniformati a partire dal Cilentino Master, non viceversa.

## Gerarchia del Character System

- Un solo personaggio principale: `Cilentino` o `Cilentino Master`.
- Piu ruoli derivati: `Cilentino Chef`, `Cilentino Concierge`, `Cilentino Guida`, `Cilentino Escursionista`, `Cilentino Marinaio`, `Cilentino Bagnino`, `Cilentino Archeologo`, `Cilentino Agricoltore`.
- Piu espressioni applicabili al personaggio e ai suoi ruoli, senza alterarne l'identita di base.
- Nessun ruolo professionale e gerarchicamente superiore agli altri.
- Nessun ruolo professionale costituisce il modello identitario del sistema.

## Analisi della famiglia grafica

### Appartengono alla stessa famiglia?

Si a livello identitario, non ancora a livello esecutivo.

Elementi condivisi:

- testa sferica bianca e blu;
- occhi grandi con iride azzurra e pupilla nera;
- sorriso ampio e accogliente;
- guanti e arti blu;
- scarpe rosse e verdi come firma visiva;
- indole positiva, turistica, rassicurante.

Differenze rilevate:

| Area | Pose storiche | Avatar tematici | Esito |
|---|---|---|---|
| Testa | piu piccola rispetto al corpo, piu schiacciata in alcune pose | molto dominante, quasi meta del personaggio | non allineati |
| Occhi | piu grafici, meno volumetrici, espressivita semplice | piu profondi, lucidi, scolpiti, meglio rifiniti | non allineati |
| Sorriso | semplice, quasi vettoriale | piu tridimensionale, bocca incassata | non allineati |
| Corpo | sintetico, torace molto ridotto | piu strutturato, massa piu credibile | non allineati |
| Braccia | corte e molto caricaturali | piu lunghe, gestualita piu leggibile | parzialmente allineati |
| Gambe | corte, quasi decorative | piu presenti e utili alla posa | non allineati |
| Piedi | firma cromatica gia corretta | firma cromatica confermata, piu voluminosa | allineati |
| Accessori | assenti o minimi | centrali nella lettura del ruolo | non allineati |
| Colori | piatti e saturi | saturi ma meglio modulati da luci e ombre | parzialmente allineati |
| Ombre | ridotte o quasi assenti | modellazione 3D piena, materiali leggibili | non allineati |
| Linee | silhouette nette, look legacy | forme morbide senza outline evidente | non allineati |
| Proporzioni | mascotte 2D compatta | mascotte 3D con testa dominante e corpo intermedio | non allineati |
| Prospettiva | quasi frontale illustrativa | prospettiva 3D coerente | non allineati |
| Illuminazione | uniforme e semplice | piu studiata, highlight e shadow coerenti | non allineati |

### Conclusione stilistica

Il DNA visivo e lo stesso, ma i due gruppi non possono essere considerati intercambiabili come output finale di uno stesso character pipeline. Le pose storiche devono essere trattate come archivio espressivo e riferimento comportamentale. Gli avatar tematici devono diventare il nuovo standard produttivo.

## Definizione del Cilentino Master

### Principio ufficiale

Nessuno degli avatar professionali attualmente esistenti costituisce il Master definitivo. Gli avatar presenti sono riferimenti visivi e bozze di ruolo. Il Master ufficiale dovra essere progettato come versione neutra autonoma.

### Definizione

Il `Cilentino Master` rappresenta Cilentino nella sua forma:

- neutra;
- istituzionale;
- riconoscibile;
- non professionale;
- priva di accessori di mestiere;
- adatta all'apertura della chat;
- adatta alle domande generiche;
- adatta ai saluti;
- adatta come fallback;
- adatta come riferimento costruttivo per tutti i ruoli futuri.

### Riferimenti utili dagli asset esistenti

- `cilentino-concierge` puo essere citato soltanto come riferimento utile per alcune qualita tecniche e come esempio di equilibrio generale, non come base identitaria o gerarchica del personaggio.
- `cilentino-archeologo` e `cilentino-marinaio` sono riferimenti utili per controllare scala, pulizia dei volumi e leggibilita del volto.
- Gli avatar professionali esistenti aiutano a valutare resa 3D, materiali e silhouette, ma non definiscono da soli il Master ufficiale.

### Criterio progettuale del Master

Il Cilentino Master dovra fissare in modo definitivo:

- testa;
- occhi;
- sorriso;
- corpo;
- proporzioni;
- mani;
- piedi;
- palette;
- stile;
- illuminazione;
- scala;
- punto d'appoggio.

Nei ruoli dovranno cambiare soltanto:

- abbigliamento;
- accessori;
- piccoli dettagli funzionali;
- eventuale postura coerente con il ruolo, senza alterare l'identita del personaggio.

## Standard grafico ufficiale

### Testa

- Testa sferica dominante.
- Occupazione consigliata: tra il 42% e il 46% dell'altezza visiva del personaggio.
- Centro della testa leggermente sopra il baricentro della figura.
- Pattern bianco/blu obbligatorio con banda blu frontale continua e lettura immediata del brand.

### Occhi

- Forma ovale verticale morbida.
- Distanza tra gli occhi: circa il 18% della larghezza del volto visibile.
- Iride azzurra brillante con pupilla nera ampia.
- Highlight netto e coerente su entrambi gli occhi.
- Espressione prevalente: curiosa, positiva, intelligente.

### Sorriso

- Curva ampia verso l'alto.
- Bocca incassata e tridimensionale, non piatta.
- Leggera inclinazione possibile solo quando serve a suggerire intenzione o dinamismo, mai come difetto sistematico.

### Corpo

- Corpo compatto ma leggibile, con busto pieno e gambe corte.
- Rapporto testa/corpo consigliato: circa 1:1.35 sull'altezza visiva complessiva.
- Torace sempre semplificato, senza muscolatura o dettagli realistici fuori stile.

### Braccia

- Lunghezza consigliata: il braccio disteso deve arrivare indicativamente a meta coscia.
- Mani grandi e leggibili, con dita morbide e separate solo quanto basta per la posa.
- Le mani sono uno dei principali strumenti narrativi del sistema.

### Gambe

- Corte ma strutturate.
- Lunghezza consigliata: tra il 26% e il 30% dell'altezza visiva.
- Devono sostenere pose dinamiche senza sembrare decorative o inutili.

### Piedi

- Piede sinistro rosso, piede destro verde come firma permanente.
- Volume pieno e tondeggiante.
- Punto di appoggio visivo sempre chiaro e stabile.
- Niente tagli vicino alla base del canvas.

### Colori

- Blu saturo brillante per volto e arti.
- Bianco caldo per la testa.
- Rosso e verde saturi per le scarpe.
- Palette accessori dedicata per ruolo, ma sempre subordinata al volto come fulcro visivo.

### Ombre

- Ombre morbide, pulite, senza contrasto eccessivo.
- Materiali leggibili ma non fotorealistici.
- Niente ombre sporche, grigiastre o incoerenti tra accessori e personaggio.

### Illuminazione

- Key light morbida fronto-laterale.
- Rim light discreta per separare il personaggio dal fondo trasparente.
- Highlight coerenti su occhi, testa, scarpe e accessori principali.

### Spessore delle linee

- Non usare outline duro come regola principale.
- La separazione tra forme deve avvenire tramite modellazione, materiali, bordi di contatto e ombre leggere.

### Livello di dettaglio

- Alto abbastanza da sostenere usi marketing, social, video e close-up.
- Mai iper-carico: accessori chiari, silhouette leggibile, un ruolo alla volta.

### Stile grafico

- Mascotte 3D amichevole.
- Turismo esperienziale, ospitalita, divulgazione territoriale.
- Mix tra cartoon premium, infopoint digitale e character brand proprietario.
- Nessun realismo umano, nessuna ironia aggressiva, nessun tratto infantile eccessivo.

## Standard tecnico PNG ufficiale

- Dimensione ideale della tela: 1254x1254 px.
- Rapporto d'aspetto: 1:1.
- Risoluzione master: 1254 px lato lungo, fondo trasparente.
- Bounding box visivo target: 1020 px di altezza, con tolleranza ±40 px solo per accessori eccezionali.
- Margine superiore consigliato: 95 px.
- Margine inferiore consigliato: 135 px.
- Margini laterali consigliati: centrati, con differenza sinistra/destra non oltre 20 px.
- Margine laterale minimo assoluto: 90 px.
- Formato: PNG RGBA con trasparenza piena.
- Peso consigliato per il web: preferibilmente 250-450 KB dopo ottimizzazione, massimo 600 KB per versioni particolarmente accessoriate.
- Qualita web: massima leggibilita su retina e smartphone, nessun bordo bianco, nessun anti-aliasing sporco, nessun taglio alle estremita.

## Ruoli ufficiali del Character System

### Cilentino Master

- Funzione: accesso universale al sistema, assistente generale del brand.
- Accessori obbligatori: nessuno oppure un solo segno neutro di orientamento brand.
- Elementi caratteristici: posa aperta, sorriso accogliente, lettura immediata del volto.
- Elementi da evitare: accessori di settore, abiti troppo verticali, attributi che limitano l'uso generale.

### Cilentino Chef

- Funzione: gastronomia, ristorazione, prodotti tipici, esperienze culinarie.
- Accessori obbligatori: cappello da chef o campana da servizio, dettaglio cucina chiaramente leggibile.
- Elementi caratteristici: ospitalita, appetibilita, precisione.
- Elementi da evitare: look troppo alberghiero o troppo casalingo.

### Cilentino Concierge

- Funzione: accoglienza, hotel, servizi, informazioni pratiche.
- Accessori obbligatori: campanello, divisa ospitalita, gesto di benvenuto.
- Elementi caratteristici: servizio, eleganza, rassicurazione.
- Elementi da evitare: confusione con il Master neutro o con il receptionist generico non brandizzato.

### Cilentino Guida Turistica

- Funzione: orientamento generale, luoghi da vedere, itinerari introduttivi.
- Accessori obbligatori: mappa, fotocamera o elemento di esplorazione urbana.
- Elementi caratteristici: curiosita, scoperta, invito all'esplorazione.
- Elementi da evitare: accessori da montagna estrema o da hotel.

### Cilentino Escursionista

- Funzione: trekking, sentieri, natura, outdoor.
- Accessori obbligatori: zaino, cappello tecnico o elementi da cammino.
- Elementi caratteristici: energia, movimento, resistenza.
- Elementi da evitare: look cittadino o accessori marittimi.

### Cilentino Marinaio

- Funzione: porto, barca, escursioni in mare, cultura marina.
- Accessori obbligatori: segni nautici chiari, abbigliamento marino leggibile.
- Elementi caratteristici: affidabilita, esperienza, contatto con il mare.
- Elementi da evitare: tono militare o da comandante rigido.

### Cilentino Bagnino

- Funzione: spiagge, sicurezza balneare, mare accessibile, litorale.
- Accessori obbligatori: salvagente o rescue float, cappellino o divisa beach safety.
- Elementi caratteristici: vigilanza, energia, immediatezza.
- Elementi da evitare: erotizzazione, look sportivo generico, eccessiva aggressivita.

### Cilentino Archeologo

- Funzione: siti archeologici, storia antica, musei, Paestum, Velia.
- Accessori obbligatori: cappello esplorativo, trowel o borsa da campo.
- Elementi caratteristici: competenza, scoperta, cura del patrimonio.
- Elementi da evitare: stile avventuriero troppo cinematografico o caricaturale.

### Cilentino Agricoltore

- Funzione: ruralita, prodotti del territorio, tradizioni agricole, paesaggio interno.
- Accessori obbligatori: dettaglio agricolo leggibile, palette calda naturale.
- Elementi caratteristici: autenticita, concretezza, legame con la terra.
- Elementi da evitare: look folcloristico eccessivo o contadino stereotipato.

## Espressioni ufficiali

Le espressioni storiche diventano il set comportamentale ufficiale del sistema.

### Ciao

- Postura: aperta, frontale, peso ben distribuito.
- Mani: una mano in saluto, l'altra di supporto o sul fianco.
- Occhi: aperti e diretti verso l'utente.
- Sorriso: pieno, immediato.
- Inclinazione del corpo: lieve, dinamica ma stabile.

### Pensa

- Postura: raccolta, leggera torsione del busto.
- Mani: una mano al mento o vicino al volto.
- Occhi: orientati verso l'alto o lateralmente.
- Sorriso: attenuato, curioso.
- Inclinazione del corpo: minima, riflessiva.

### Cerca

- Postura: protesa in avanti.
- Mani: una mano in ricerca o con strumento dedicato.
- Occhi: focalizzati e attivi.
- Sorriso: secondario rispetto all'azione.
- Inclinazione del corpo: piu marcata, orientata alla scoperta.

### Idea

- Postura: eretta e reattiva.
- Mani: una mano che segnala intuizione.
- Occhi: brillanti, aperti.
- Sorriso: soddisfatto.
- Inclinazione del corpo: leggera apertura verso l'esterno.

### Indica

- Postura: stabile, di servizio.
- Mani: un braccio esteso verso il contenuto o la direzione.
- Occhi: seguono la direzione indicata o mantengono contatto con l'utente.
- Sorriso: presente ma non dominante.
- Inclinazione del corpo: orientata verso il punto indicato.

### Cartina

- Postura: informativa.
- Mani: una mano regge la mappa, l'altra accompagna.
- Occhi: interessati, leggibili.
- Sorriso: disponibile.
- Inclinazione del corpo: minima, per favorire la lettura dell'accessorio.

### OK

- Postura: compatta e positiva.
- Mani: gesto di approvazione o conferma.
- Occhi: sicuri e amichevoli.
- Sorriso: pieno.
- Inclinazione del corpo: leggera, con energia in avanti.

### Arrivederci

- Postura: apertura laterale o retro-movimento lieve.
- Mani: saluto di uscita.
- Occhi: ancora in contatto con l'utente.
- Sorriso: caldo, di chiusura.
- Inclinazione del corpo: verso la direzione di uscita, senza perdere leggibilita.

### Abbraccio

- Postura: molto aperta e centrata.
- Mani: entrambe in accoglienza.
- Occhi: morbidi, rassicuranti.
- Sorriso: massimo livello di empatia.
- Inclinazione del corpo: in lieve avanzamento verso l'utente.

## Regole di progettazione

- Un solo ruolo principale per avatar.
- Una sola azione primaria per posa.
- Il volto resta sempre il primo punto di attenzione.
- Gli accessori devono chiarire il ruolo, non coprire l'identita.
- La lettura del personaggio deve funzionare anche in miniatura.
- Nessun taglio di mani, piedi o accessori critici nel master PNG.
- Nessuna posa aggressiva, sarcastica o ambigua.
- Nessuna variazione arbitraria di palette, occhi o scarpe-firma.
- Nessun ruolo professionale puo essere trattato come origine gerarchica del sistema.

## Regole per creare nuovi avatar

- Partire dal Cilentino Master approvato, non da reinterpretazioni libere o da un ruolo esistente.
- Rispettare testa, occhi, sorriso, mani, scarpe e rapporti generali.
- Introdurre un solo dominio semantico chiaro per personaggio.
- Mantenere la stessa illuminazione e la stessa famiglia di materiali.
- Posizionare sempre il personaggio sul canvas tecnico ufficiale.
- Verificare coerenza visiva su desktop e smartphone prima dell'approvazione.
- Ogni nuovo ruolo deve derivare dal Cilentino Master mantenendo identita, proporzioni e punto di appoggio costanti.
- Ogni nuovo avatar deve avere almeno una posa neutra, una posa `Pensa`, una posa `Indica` e una posa `OK` se il ruolo lo richiede.

## Utilizzo futuro del Character System

Comportamento ideale, senza implementazione in questa fase:

- Domanda su un hotel -> Cilentino Concierge -> Pensa -> Indica -> OK.
- Domanda su un ristorante -> Cilentino Chef -> Pensa -> Indica -> OK.
- Domanda su Paestum o Velia -> Cilentino Archeologo -> Indica.
- Domanda su una spiaggia -> Cilentino Bagnino -> Indica o OK.
- Domanda su un trekking -> Cilentino Escursionista -> Pensa -> Indica.
- Domanda su itinerari generici -> Cilentino Guida Turistica -> Cartina -> Indica.
- Domanda su porto, escursioni in barca o mare -> Cilentino Marinaio -> Indica.
- Domanda su prodotti locali o ruralita -> Cilentino Agricoltore -> Idea o Indica.
- Domanda generica o ingresso nella piattaforma -> Cilentino Master -> Ciao.

## Roadmap consigliata

1. Fase 1 – Character System documentale.
2. Fase 2 – Progettazione Cilentino Master neutro.
3. Fase 3 – Approvazione del Master definitivo.
4. Fase 4 – Normalizzazione tecnica del Master.
5. Fase 5 – Rigenerazione o uniformazione dei ruoli dal Master.
6. Fase 6 – Ricostruzione delle espressioni sul Master.
7. Fase 7 – Rinomina cartelle e file.
8. Fase 8 – Aggiornamento riferimenti.
9. Fase 9 – Integrazione nella chat.
10. Fase 10 – Avatar dinamici.
11. Fase 11 – Animazioni.
12. Fase 12 – Video.
13. Fase 13 – Stampa 3D.

## Criticita principali emerse nell'analisi

- I due gruppi non sono allineati per linguaggio produttivo.
- Le pose storiche non possono essere usate come standard tecnico futuro.
- I nuovi avatar sono visivamente coerenti ma non ancora normalizzati.
- Alcuni PNG nuovi hanno pesi elevati per uso web.
- `cilentino-chef` non e sicuro come riferimento tecnico diretto perche tocca i bordi del canvas.

## Decisione operativa di fase 1

Il Character System ufficiale deve nascere dalla progettazione di un Cilentino Master neutro e autonomo. I nuovi avatar tematici restano riferimenti utili di ruolo e qualita tecnica, mentre il set storico resta il vocabolario di espressioni e comportamento da ricostruire sul Master approvato.