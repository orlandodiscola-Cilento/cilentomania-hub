# Immagini dei Comuni

La configurazione tecnica condivisa si trova in `data/immagini-comuni.config.json`. Le fotografie e i relativi crediti restano censiti in `data/crediti-immagini-comuni.json`.

Per sostituire una fotografia mantenendo lo stesso nome è sufficiente sostituire il file. Se cambia il percorso, occorre aggiornare soltanto il campo `file` del record immagine; JavaScript e HTML non devono essere modificati.

Ogni record può dichiarare varianti responsive opzionali nel campo `sources`:

```json
{
  "id": "IMG-ESEMPIO-CARD-001",
  "municipality": "Comune di esempio",
  "type": "card",
  "file": "images/comuni/esempio-card-1280.webp",
  "sources": [
    {"src": "images/comuni/esempio-card-480.webp", "width": 480},
    {"src": "images/comuni/esempio-card-800.webp", "width": 800},
    {"src": "images/comuni/esempio-card-1280.webp", "width": 1280}
  ],
  "alt": "Veduta documentata del Comune di esempio"
}
```

I tipi utilizzati sono `card` e `cover`. In assenza di una fotografia valida viene mostrato automaticamente `assets/placeholder-comune.svg`. Un ALT editoriale presente nell'archivio ha sempre priorità; se manca, il sistema usa il template configurato con il nome del Comune tramite l'helper della SEO Foundation.
