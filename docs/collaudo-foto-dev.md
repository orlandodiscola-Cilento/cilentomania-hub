# Collaudo remoto foto — 18 settembre 2026

## Ambiente e confini
Funzione photo-validation-lab distribuita solo su qgkwqzjapvjvzmvdfges (DEV Francoforte), versione 1, verify_jwt=true. È un laboratorio separato: nessun collegamento dell'editor pubblico, nessuna scrittura su Storage o database, nessuna chiamata finalize_media. Restituisce dimensioni, checksum e durata, non i file elaborati. Richiede utente Supabase valido, current_context abilitato e appartenenza alla sola organizzazione TEST già esistente. Origin consentita soltanto anteprima locale 8765 (controllo aggiuntivo, non sostitutivo dell'autenticazione). Una richiesta per isolate alla volta; non è un rate limiter distribuito da produzione.

Nessuna service_role usata. Il client server usa chiave anon di piattaforma con JWT del chiamante, mai loggati. JWT gateway e verifica getUser attivi. Prova anonima HTTP401.

## Packaging senza Docker
CLI ufficiale con --use-api. Modulo WASM 0.0.43 scaricato a freddo da jsDelivr, solo URL fisso, impronta SHA256 fissata uguale al pacchetto npm locale prima dell'inizializzazione. Nessun dato utente trasmesso al CDN. Dependency CDN e cold start da considerare prima della produzione; nessun segreto aggiunto. Questa modalità ha permesso il collaudo, senza installare Docker/Deno.

## Esiti reali
- JPEG 1280x851: 280234 -> 209926 byte, 450ms (prima prova 367ms).
- PNG 1280x851: 1576415 -> 209926 byte, 380ms.
- WebP 1280x851: 248462 -> 211942 byte, 359ms.
- JPEG sintetico 2000x2000: 633960 -> 289588 byte, 1600x1600, 1328ms.
- 2100x2100: HTTP422 pixel_limit.
- JPEG dichiarato PNG: HTTP422 mime_mismatch.
- File JPEG troncato: HTTP422 image_processing_failed.
- SVG: HTTP422 unsupported_image.
- Oltre5MB: HTTP413 file_size.
9/9 esiti attesi. Durate del solo processamento, non CPU né round trip; nessuna misura della memoria hosted. Corpus ristretto, non garanzia per tutte le immagini 4MP. Checksum JPEG identico al test locale.

## Audit dopo la prova
4 media pending, 0 file prepared, 0 schede pubblicate, 0 account staff, due bucket privati. Anon e authenticated non possono finalize_media; solo server_role autorizzato. Nessun dato operatore modificato.

## Stato e prossimi passi
Funzione DEV attiva ma non collegata al sito pubblico. Nessun commit/push/deploy Aruba. Nessun acquisto o cambio piano; invocazioni normali del progetto (non equivale a promessa di costo zero illimitato).
Limite laboratorio 4MP e5MB; limite editor 40MP invariato. Prima del collegamento: ampliare fixture con EXIF/animazioni/immagini rumorose, definire politica per foto oltre4MP senza ridurre silenziosamente il limite attuale; autenticazione/autorizzazione media ID, lease/retry idempotenti, coda/rate limit, scrittura copie private e finalize_media; cleanup, gestione rifiuti; ruolo staff e comando pubblicazione; integrazione del catalogo pubblico. Non promuovere questa funzione di prova a worker completo.

## Collegamento foto e pubblicazione — 18 settembre 2026
- Migrazione 011 applicata al solo DEV Francoforte dopo test locali e dry-run: lease elaborazione, accesso ai candidati privati e catalogo pubblico paginato. Nessuna modifica Auth o alle strutture Storage gestite.
- Funzione process-listing-photo distribuita nel DEV: identità verificata e autorizzazione alla scheda prima della copia; percorsi derivati dal database, niente percorsi arbitrari; chiave privilegiata esclusivamente nell'ambiente server Supabase. Nessuna chiave segreta nel codice/browser.
- Nuove foto: originale privato (limite editor 5 MB/40 MP) + candidato WebP fino a 1600 px sul lato maggiore, creato proporzionalmente nel browser. Il server decodifica indipendentemente, rimuove metadati e ricodifica prima di finalize_media. Foto pregresse prive di candidato: utilizzabile originale solo entro 4 MP; oltre il limite occorre sostituirle/salvarle con il nuovo editor.
- Collaudo browser 40 MP sintetico: 8000x5000 -> 1600x1000; originale JPEG intatto. Il candidato supera la stessa validazione server, non viene considerato attendibile solo perché creato dal browser.
- Tutte le quattro foto già presenti nelle due schede TEST: validate e quattro copie preparate nel bucket privato. Originali preservati.
- Collaudo remoto in transazione annullata: entrambe le revisioni approvate pubblicabili, proiezione pubblica e policy Storage anonime funzionanti; DEMO escluse dal catalogo. Dopo rollback zero schede pubblicate.
- Frontend locale: Verifica foto / Pubblica scheda per amministratore; pubblicazione bloccata in caso di errore foto. Catalogo sito unisce JSON esistente e sole schede online pubblicate non DEMO, senza dati amministrativi.
- Nessuna modifica alle dimensioni CSS approvate; hero 355px a 390, 420px a 768, 490px a 1024/1440; object-fit cover e punto focale, CTA statiche, nessun overflow. Gallery apre correttamente.
- 122 controlli DB locali + suite editor/auth/media/tipi/traduzioni/Master e build pubblica superati. UI revisione verificata ai quattro breakpoint con fixture locale; sessione amministratore reale nel browser esterno dell'utente, non nel browser di automazione.
- Link immagini firmati per 300 secondi: una sospensione blocca nuovi accessi, ma un link già firmato può restare valido fino alla scadenza. Il catalogo si ricarica all'apertura.
- Limiti residui: dipendenza CDN WASM fissata e verificata con SHA256; rate limit solo per foto/lease, nessuna quota distribuita per organizzazione; pulizia oggetti orfani e controllo editoriale del contenuto restano separati dalla validazione tecnica. Nessun rilevamento automatico di contenuti inappropriati promesso.
- Nessun commit/push o deploy Aruba di questo aggiornamento; codice conservato localmente. Account info@cilentomania.it abilitato staff admin nel DEV con autorizzazione utente; Outlook resta operator.
