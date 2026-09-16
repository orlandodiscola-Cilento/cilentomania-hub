# Note di progetto — Cilentomania HUB

Riepiloghi sintetici di stato raggiunto, commit pubblicati e verifiche effettuate. File di documentazione interna: escluso dal deploy su Aruba (`docs/**` non viene pubblicato, vedi `.github/workflows/deploy-aruba.yml`).

## 2026-09-16 — Ospitalità e chat contestuale di Cilentino

**Commit pubblicato:** `d25d9312f168ee03e363c7f073e8ec00357dc784` — `feat: aggiorna ospitalità e chat contestuale di Cilentino`
**Deploy:** Run #25 "Deploy Cilentomania HUB su Aruba", completato con successo (19s).
**Destinazione:** `https://www.cilentomania.it/hub/` (nessuna modifica alla homepage principale, visibilità o indicizzazione).

### Contenuto pubblicato
- Restyling di "Dove mangiare" con identità verde (pulsanti Comuni uniformi, hero fotografica, categorie orizzontali, filtri cucina/esigenze/orari, card, griglia 1/2/3 colonne).
- Intestazioni delle schede: categoria di sezione piccola, nome del Comune grande e dinamico, senza dicitura "Cilentomania".
- Apertura della chat sopra la scheda corrente (z-index, gestione Esc, scroll e focus preservati).
- Cilentino Chef per "Dove mangiare" e Cilentino Concierge per "Dove dormire", con presentazioni e primi messaggi contestuali (Comune dinamico, gestione italiana "a/ad") tradotti in IT/EN/DE/FR/ES.
- Ritorno immediato allo stato dormiente in homepage (nessuna attesa del timer) e ripristino del personaggio classico alla riapertura della chat dalla home, senza perdere conversazioni in corso.

### Verifiche effettuate
- `git diff --check`, `node --check` su tutti i file JS toccati, `node tools/check-i18n-keys.js` → tutti superati.
- Verifica funzionale su anteprima locale e poi sul sito pubblicato, smartphone e desktop: pulsanti verdi "Dove mangiare", gerarchia intestazioni, chat sopra la scheda, Chef/Concierge con presentazioni corrette, ritorno dormiente immediato in home, riapertura con Cilentino classico.
- "Dove dormire" verificato invariato (identità blu, comportamento preesistente).

### Stato repository
- Push su `origin/main` eseguito senza force, nessuna divergenza residua.
- File esclusi dal commit/deploy: `.vscode/`, `node_modules/`, `review-cilentino/`, screenshot temporanei — rimasti solo in locale, non pubblicati.
