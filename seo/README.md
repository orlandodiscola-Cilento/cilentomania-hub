# SEO Foundation

La cartella contiene la configurazione SEO centrale, i profili delle pagine e il registro delle rotte pubbliche.

I recapiti istituzionali e i profili social utilizzati dalla Home e dallo schema `Organization` sono centralizzati in `data/site-contacts.json`. Il loader condiviso `js/site-config.js` applica i collegamenti visibili e integra nel dato strutturato email, telefono e `sameAs`, evitando duplicazioni nei profili pagina.

## Integrazione futura delle pagine

I dati specifici delle pagine integrate sono registrati in `pages.json`. Ogni documento dichiara il proprio identificatore con `data-seo-page` e carica `js/seo-manager.js` insieme a `js/seo-bootstrap.js`.

Un profilo pagina contiene soltanto:

```js
{
  title: 'Titolo pagina',
  description: 'Descrizione pagina',
  image: '/images/immagine.jpg',
  url: '/percorso/',
  type: 'website',
  structuredData: []
}
```

Il bootstrap carica automaticamente il profilo corrispondente. Il manager genera title, description, canonical, favicon, Open Graph, Twitter Card, robots e JSON-LD. Sono disponibili helper per breadcrumb, FAQ, schemi generici e attributi alt; questi ultimi non sovrascrivono mai un attributo `alt` già presente, compreso `alt=""` per le immagini decorative.

## Sitemap e robots

Aggiornare `routes.json`, quindi eseguire dalla radice del repository:

```powershell
powershell -ExecutionPolicy Bypass -File tools/generate-seo.ps1
```

Le URL pulite indicate da `cleanPath` richiederanno regole di rewrite definite sulla piattaforma di pubblicazione. Finché tali regole non saranno attive, la sitemap usa i percorsi realmente raggiungibili dichiarati in `path`.
