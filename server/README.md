# Cilentino Fase 1 - Backend portabile

## Obiettivo
Fornire un primo motore AI/retrieval per la chat Cilentino, mantenendo UI frontend invariata e usando solo dati interni verificati del repository.

## Architettura
- Frontend: widget esistente, invio messaggi e rendering risposta.
- Backend (`server/src`): validazione, intent/location detection, retrieval interno, composizione risposta, fonti.
- AI provider abstraction:
  - `src/ai/provider.js`
  - `src/ai/providers/mock.js`
  - `src/ai/providers/openai.js`

## Requisiti
- Node.js >= 18

## Installazione locale
Nessuna dipendenza obbligatoria per la Fase 1.

## Configurazione ambiente
Copia `.env.example` in `.env` e configura le variabili.

Variabili principali:
- `PORT`
- `CORS_ORIGIN`
- `AI_PROVIDER` (`mock` oppure `openai`)
- `OPENAI_API_KEY` (opzionale)
- `OPENAI_MODEL`
- `CHAT_MAX_MESSAGE_LENGTH`
- `CHAT_REQUEST_TIMEOUT_MS`

Se `OPENAI_API_KEY` non e impostata, il sistema continua in modalita mock/retrieval-only.

## Avvio backend
Dalla cartella `server`:

```bash
node src/app.js
```

Endpoint:
- `GET /health`
- `POST /api/chat`

Esempio payload minimo:

```json
{
  "message": "Vorrei dormire a Castellabate",
  "conversation": [],
  "location": null,
  "language": "it"
}
```

## Configurazione frontend
Il frontend legge una configurazione unica globale:

```js
window.CILENTINO_CONFIG = {
  apiBaseUrl: "http://localhost:8787",
  enableDemoFallback: true,
  requestTimeoutMs: 7000
};
```

Se backend non raggiungibile e `enableDemoFallback=true`, Cilentino usa temporaneamente il motore demo con messaggio marcato come modalita demo.

## Dati interni interrogati in Fase 1
- `data/comuni.json`
- `data/strutture-ricettive.json`
- `data/ristorazione.json`
- `data/eventi.json`
- `data/infopoint.json`
- `data/itinerari.json`
- `data/contatti-utili-comuni.json`
- `data/partner.json`
- `data/home-modules.json`

## Test
Dalla cartella `server`:

```bash
node --test
```

La suite copre i casi richiesti di intent, localita, fallback, fonti e backend non disponibile.

## Limiti attuali
- Nessuna ricerca web esterna.
- Nessuna persistenza server-side della conversazione.
- Rilevamento intent/location deterministico di prima fase.
- AI opzionale, non usata come fonte fattuale autonoma.

## Deploy futuro
Hosting statico attuale resta invariato; backend e separato e puo essere distribuito su servizio compatibile Node senza modificare la UI.

## Passo successivo (Fase 2)
- Indicizzazione semantica e RAG.
- Web retrieval controllato con whitelist.
- Policy citazioni esterne e scoring affidabilita.
