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

## 2026-09-16 — Correzioni chat salvate localmente, non pubblicate

- Cronologie separate per lingua, sezione e Comune; vecchie cronologie globali lasciate intatte e non importate.
- Suggerimenti multipli per ospitalità e ristorazione, tradotti nelle cinque lingue, invio di una sola richiesta con le preferenze selezionate.
- Risposta breve localizzata quando mancano risultati o il servizio non è disponibile; eliminato il ricorso alle risposte demo.
- Protezione delle cronologie più recenti o cancellate dalle risposte tardive; preservata la bozza nel salvataggio di una risposta tardiva.
- Istruzione e pulsante di conferma a larghezza piena nella griglia dei suggerimenti.
- Anteprima locale allineata al progetto principale.

Verifiche: sintassi dei due JavaScript, allineamento delle chiavi i18n, diff senza errori; test ripetibile `node tools/check-cileo-conversations.cjs` per risposte tardive (cronologia invariata, aggiornata, cancellata e assenza di risposta); controllo visivo del pulsante nell'anteprima italiana di Agropoli. Controlli precedenti confermano separazione/ripristino delle cronologie e gestione di risposte mancanti o verificate.

Limiti: la selezione multipla compone una richiesta; non certifica che il backend applichi tutti i filtri ai dati. Non sono stati aggiunti servizi AI o credenziali. Le conversazioni già salvate possono contenere risposte demo storiche: non sono state cancellate. La verifica responsive completa nelle cinque lingue resta da effettuare prima della pubblicazione. Una risposta tardiva viene ignorata se la sua cronologia è stata modificata nel frattempo, per evitare sovrascritture.

Stato: solo salvataggio locale; nessun push/deploy. I file temporanei e personali restano esclusi.

### Verifica pre-pubblicazione
- Autorizzata la pubblicazione dall'utente dopo i controlli.
- Smartphone 390x844 e tablet 768x1024: verifica visiva di chat e suggerimenti, nessun overflow orizzontale della pagina, conferma a larghezza piena.
- Invio unico Hotel/Piscina/Parcheggio verificato; risposta di indisponibilità corretta.
- IT/EN/DE/FR/ES: controllati gli otto suggerimenti di entrambe le sezioni e i testi necessari; allineamento i18n superato. Non effettuato un collaudo visivo di ogni combinazione lingua/dispositivo.
- Test automatici delle risposte tardive superati. Il limite della ricerca effettiva nei dati rimane quello descritto sopra.
- Commit applicativo: ace1006. In avvio il push/deploy autorizzato; l'esito sarà verificato separatamente.

## 2026-09-16 — Avatar contestuali e movimenti

- Chef e Concierge restano il personaggio della sezione anche durante ricerca, risposta e indisponibilità; comportamento della homepage conservato.
- Movimenti discreti di ricerca, ascolto, presentazione e mancata risposta sulle immagini esistenti, con ritorno automatico in attesa; nessuna nuova espressione del volto.
- Animazioni disattivate per chi preferisce movimento ridotto.
- Verifiche: sintassi JavaScript e test delle conversazioni superati; test degli stati per Chef/Concierge e ritorno alla home superato nella sessione di sviluppo; anteprima controllata dopo una richiesta, con avatar concierge e animazione cileoContextUnavailable.
- Pubblicazione su /hub autorizzata dall'utente; deploy avviato dal push di questo commit. Esito disponibile nel workflow GitHub Actions associato.
- File personali e temporanei esclusi dal commit e dalla pubblicazione.

## 2026-09-17 — Prima Scheda Master Operatore, solo locale

- Nuovo dettaglio Dove Dormire con hero, gallery, servizi a codici stabili, caratteristiche a tre stati, CTA, contatti, mappa e collegamenti al territorio. Demo “Dimora del Mare — Demo” a Castellabate chiaramente identificata; nessuna adesione o verifica implicita.
- Modello pubblico separato dalla predisposizione amministrativa/commerciale (soli segnaposto, nessuna logica abbonamenti). Documentazione in `docs/operator-profile.md`.
- Responsive controllato a 390/768/1024/1440 px; gallery, ritorno all'elenco, cinque lingue e Concierge verificati. Dove Mangiare conserva il dettaglio precedente.
- Test automatici del modello e sintassi superati. Limite: cartografia OpenStreetMap incorporata non visibile nel browser locale; presente collegamento esterno. CTA della demo volutamente inattive.
- File modificati solo localmente. Nessun commit, push, deploy o pubblicazione: attesa approvazione dell'utente.

### Secondo passaggio grafico Scheda Master (solo locale)

- Hero immersiva, badge DEMO separato, logo opzionale, CTA immediate e sticky mobile.
- Servizi compatti, caratteristiche strutturate con icone, gallery estesa a sette immagini demo.
- Quattro blocchi territoriali dimostrativi (Eventi, Esperienze, Dove mangiare, Itinerari) e CTA Concierge nei dintorni.
- Verifiche responsive 390/768/1024/1440 e test del modello superati; resta il limite della mappa esterna nel browser locale.
- Nessun commit, push o deploy; in attesa di revisione grafica.

### Pubblicazione Scheda Master autorizzata

- Versione finale semplificata, senza barra interna, riquadro Concierge o gallery separata. Gallery completa dalla hero; chat generale invariata.
- Test Scheda Master, i18n e conversazioni superati; dati preesistenti e traduzioni esterne al nuovo namespace invariati; Dove Mangiare verificato.
- Commit e push autorizzati dall’utente; deploy previsto dal workflow esistente su main in /hub/. Esito da verificare dopo il push.
- Esclusi file locali, screenshot, node_modules e server di anteprima LAN.
