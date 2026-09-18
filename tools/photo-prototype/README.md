# Prototipo elaborazione fotografie — non collegato e non distribuito

Stato: prova locale con ImageMagick WASM 0.0.43, dipendenza fissata e lockfile. Nessuna chiamata al database/Storage, nessuna credenziale, nessuna modifica degli originali. Non è un endpoint server né un validatore antivirus. Non abilita la pubblicazione e non deve essere importato nel frontend.

## Esecuzione
`npm ci --prefix tools/photo-prototype --ignore-scripts`
`npm test --prefix tools/photo-prototype`
`node tools/photo-prototype/benchmark.mjs`

## Comportamento verificato
JPEG/PNG/WebP decodificati e riscritti in WebP; whitelist coder e delegati esterni disabilitati. Controllo firma/formato dichiarato, massimo 5 MB, controllo dimensioni prima della decodifica completa. Prototipo limitato a 4 MP (NON cambia il limite attuale di 40 MP nell'editor). Lato massimo 1600, proporzioni conservate, nessun ingrandimento di immagini piccole. Orientamento applicato prima della rimozione metadati. Non viene ritagliata l'immagine: focalX/Y restano proprietà della revisione. Trasparenza PNG conservata nella copia WebP. Originali invariati. File corrotti, SVG e MIME discordanti respinti. Sequenze rilevate con più frame respinte.

Test locale: foto 1280x851, 280234 byte -> 209926 byte; circa 454–547 ms CPU. Picco RSS del processo della suite circa 147 MB. Prova 2000x2000: circa 1124 ms CPU, output 289588 byte; 2100x2100 respinta per pixel_limit. Numeri Node/Windows, NON equivalenti a limiti o garanzie Supabase. Fixture quadrata soltanto sintetica per benchmark. Da ampliare il corpus con EXIF orientati, animazioni/APNG, decompression bomb, profili colore e immagini rumorose al limite.

## Prima di un endpoint DEV
Deno e Docker non risultano disponibili in questo ambiente. L'esempio Supabase usa magick.wasm come file statico: il suo packaging richiede una pipeline CLI con Docker secondo i limiti documentati. Nessuna installazione runtime né deploy effettuati.

Endpoint autenticato, una foto per richiesta: verifica JWT, current_context, organizzazione attiva e accesso alla revisione PRIMA di qualunque privilegio server. Accetta solo media ID, mai URL arbitrari/path forniti dal client. Una RPC riservata deve restituire il percorso autorizzato e gestire claim/lease/riprova; limitare concorrenza, frequenza e byte letti. Scaricare l'originale via Storage API, elaborare in ambiente con timeout/memoria, creare copia senza upsert, verificare checksum e dimensioni, quindi finalize_media con credenziale disponibile solo nel server. Nessun contenuto/URL firmato/token nei log. Riprese idempotenti devono verificare la copia esistente, mai sovrascriverla. Rejected va registrato con errore leggibile e possibilità di sostituzione; pulizia orfani tramite Storage API e finestra di conservazione, mai DELETE diretto di storage.objects.

La funzione finalize_media già presente non sostituisce il controllo byte: è l'ultimo passo riservato al worker. Non verrà chiamata dal prototipo. Il bucket published resta privato e accessibile ai visitatori solo per revisione realmente pubblicata; non creare URL permanenti pubblici agli originali.

## Decisione aperta
Il limite editor 40MP non è validato per Edge (256MB, 2s CPU). Occorre benchmark hosted e poi scegliere un limite esplicito/conversione accompagnata da messaggio, oppure un worker con più risorse. Non imporre silenziosamente 4MP agli utenti esistenti. Non attivare un piano a pagamento senza approvazione.

## Passaggi separati ancora necessari
Account staff autorizzato dall'utente; comando Admin pubblica/sospendi; lettura pubblica delle sole revisioni approvate (il sito legge ancora JSON); test aggiornamento/sospensione e immagini non accessibili di altre organizzazioni. Nessun bypass del workflow e nessuna pubblicazione di schede TEST.

Fonti: https://supabase.com/docs/guides/functions/limits ; https://supabase.com/docs/guides/functions/examples/image-manipulation ; https://github.com/dlemstra/magick-wasm
