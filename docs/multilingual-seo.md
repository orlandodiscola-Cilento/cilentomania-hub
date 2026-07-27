# SEO multilingua - nota tecnica

## Stato attuale
L'i18n frontend basato su JavaScript migliora UX, ma **non e sufficiente** per una SEO multilingua completa.

## Strategia consigliata (fase successiva)
1. URL localizzati indicizzabili:
   - /it/
   - /en/
   - /de/
   - /fr/
   - /es/
2. `hreflang` completo per ogni variante + `x-default`.
3. `title` e `meta description` tradotti server-side o static generation.
4. Open Graph e Twitter Card localizzati.
5. Canonical coerenti per ogni lingua.
6. Sitemap separate per lingua + indice sitemap.

## Perche non basta il solo cambio client-side
I crawler potrebbero indicizzare prevalentemente la versione italiana se i contenuti tradotti esistono solo dopo esecuzione JS. Per contenuti SEO critici servono URL locali con HTML gia localizzato.

## Evitare contenuti duplicati
- una sola canonical per URL lingua corrente
- hreflang reciproco tra tutte le versioni
- niente pagine identiche con lingua diversa senza differenze reali

## Contenuti lunghi e traduzioni AI
Per contenuti editoriali estesi:
- mantenere italiano come sorgente verificata
- usare file traduzioni separati per lingua e ID
- pubblicare per SEO solo traduzioni con stato `verificata` o policy esplicita
- marcare `da_aggiornare` se cambia la sorgente italiana

## Rollout consigliato
1. Fase UX (completata): switch lingua client-side, fallback italiano.
2. Fase metadata: title/description tradotti per URL localizzate.
3. Fase routing: introduzione percorsi /it /en /de /fr /es.
4. Fase indexing: sitemap per lingua e monitoraggio Search Console.

## Compatibilita progetto
La strategia e compatibile con hosting statico e backend Node separato, senza introdurre SSR obbligatorio nella fase iniziale.
