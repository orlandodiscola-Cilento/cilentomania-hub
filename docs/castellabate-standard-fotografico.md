# Castellabate — verifica rispetto allo standard Agropoli

Data della verifica: 18 luglio 2026

## Esito

**Stato: PARZIALE.** La scheda dispone di una fotografia reale per la card e di una fotografia reale di copertina, entrambe presenti nel repository e corredate da ALT, autore, fonte e licenza. Non sono presenti fotografie reali destinate alla galleria; Castellabate non può quindi essere portato allo standard fotografico di Agropoli utilizzando esclusivamente il materiale attualmente disponibile nel progetto.

Non sono stati aggiunti placeholder, non sono state riutilizzate impropriamente card o copertina come immagini di galleria e non sono stati inventati contenuti o metadati.

## Elementi verificati

| Elemento | Esito | Riferimento |
|---|---|---|
| Fotografia card | Completa | `images/comuni/castellabate-card.jpg` — `IMG-CASTELLABATE-CARD-001` |
| Fotografia copertina | Completa | `images/comuni/castellabate-cover.jpg` — `IMG-CASTELLABATE-COVER-001` |
| Galleria fotografica | Mancante | `galleria` e `galleria_fotografica` non contengono immagini |
| ALT | Completi per le due immagini disponibili | Registrati in `data/crediti-immagini-comuni.json` |
| Crediti fotografici | Completi per le due immagini disponibili | Autore, fonte, URL della fonte, licenza e URL della licenza presenti |
| Infopoint | Collegamenti presenti | `INF004` Centro Storico; `INF005` Villa Matarazzo |
| Contatto utile | Collegamento presente | `CST-COM-001`, Comune di Castellabate |
| Fonti editoriali | Presenti | Due fonti istituzionali del Comune di Castellabate |

### Metadati delle fotografie disponibili

- **Card:** “Castellabate sul golfo”, autore Francesco Boggia, fonte Wikimedia Commons, licenza CC BY 3.0. ALT: “Veduta panoramica di Castellabate e del golfo sottostante”.
- **Copertina:** “Strade del borgo di Castellabate”, autore Alessandro Cossu, fonte Wikimedia Commons, licenza CC BY-SA 4.0. ALT: “Strada in pietra nel centro storico di Castellabate”.

I collegamenti ai crediti sono già gestiti tramite gli ID immagine associati alla scheda e le rispettive voci centralizzate in `data/crediti-immagini-comuni.json`.

## Fotografie mancanti per l'equivalenza con Agropoli

Agropoli utilizza una card, una copertina e quattro immagini reali distinte in galleria. Per raggiungere lo stesso standard, Castellabate necessita quindi di **quattro fotografie reali aggiuntive**, specifiche del Comune e non duplicate rispetto alle due già disponibili:

1. **Santa Maria di Castellabate:** una veduta riconoscibile del centro costiero.
2. **San Marco di Castellabate:** una veduta riconoscibile del porto o del nucleo costiero.
3. **Ogliastro Marina:** una veduta riconoscibile della località e del suo tratto di costa.
4. **Licosa:** una veduta riconoscibile dell'isola, del promontorio o del paesaggio costiero.

Questi quattro soggetti corrispondono a località già registrate nella scheda editoriale di Castellabate. Per ogni futura fotografia dovranno essere disponibili e verificabili almeno: file locale, titolo, ALT descrittivo, autore, fonte, URL della fonte, licenza e URL della licenza. Soltanto dopo tale verifica gli ID potranno essere associati alla galleria della scheda.

## Standard risultante

La configurazione attuale conferma il modello da applicare agli altri Comuni:

- una fotografia reale e specifica per la card;
- una fotografia reale e distinta per la copertina;
- almeno quattro fotografie reali e distinte per la galleria;
- rapporto tra scheda e immagini basato su ID centralizzati;
- ALT descrittivo per ogni fotografia;
- crediti completi e verificabili per ogni file;
- nessun placeholder conteggiato come fotografia reale;
- nessun riuso artificiale della stessa immagine per colmare posizioni mancanti.
