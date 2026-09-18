# Step 3.1 — contratti e selezione esplicita del backend

Aggiornamento Step 3.2: le specifiche citate sotto sono state sostituite da migrazioni SQL
reali, verificate esclusivamente in locale. Vedi `supabase-step-3.2.md` e `../supabase/README.md`.
Il frontend, il selettore e il provider non collegato descritti qui restano invariati.
Il resto di questa nota conserva il resoconto storico dello Step 3.1.

Stato: implementazione locale. Nessun collegamento Supabase, SDK remoto, autenticazione reale,
migrazione applicata o modifica al sito pubblico. Lo Step 3.2 è predisposto come specifiche,
non implementato. Nessun commit/push/deploy autorizzato per questo step.

## Selezione e configurazione

Unica fonte runtime: `operatori/config.json`. Il campo `backend` deve essere esattamente
`demo` oppure `supabase`. La selezione consegnata è `demo`. I campi pubblici Supabase
`url` e `publishableKey` sono vuoti; non servono per usare la demo.

- `demo`: importa solo il provider demo, conserva lo stesso database IndexedDB e sessione esistente.
- `supabase`: importa solo il provider riservato, che nello Step 3.1 rifiuta sempre la connessione
  con un messaggio controllato. Non crea client, non legge/scrive sessioni locali e non apre IndexedDB.
- Configurazione assente, non valida o provider indisponibile: errore, nessun provider alternativo.
- Nessun override tramite query string, localStorage o rilevamento automatico delle chiavi.
- Se la configurazione cambia, ricaricare la pagina. Anche una connessione fallita rimane tale
  fino a una ricarica esplicita, senza tentativi su backend diversi.

`.env.example` contiene soltanto nomi e valori vuoti. Il browser statico non legge file `.env`:
questo template è preparatorio per il successivo tooling di configurazione, non una seconda
fonte runtime. Solo URL e chiave pubblicabile potranno essere trasferiti al frontend. Le
credenziali privilegiate restano fuori dal frontend, dal repository, dai log e dai documenti.

## Contratto backend e identità

`getBackend()` restituisce asincronamente `{kind, repo, auth, capabilities}`.
Le viste app/admin/preview non importano più demo-session o demo-repository.

Il contratto `OperatorSession` definisce:

- `current({area})`: sessione corrente oppure null; `area` indica la vista richiesta, non un ruolo.
- `login(email,password)`: sessione dopo autenticazione.
- `logout()`: conclusione della sessione.
- `recoverPassword(email)`: esito comprensibile all'utente.
- `changePassword(password)`: operazione predisposta ma non attiva in demo.

Soltanto DemoSession può costruire l'identità di redazione simulata per la vista admin.
Il futuro provider reale deve derivare l'identità da Auth e verificare i permessi server-side:
né `area: admin` né il parametro `admin=1` concedono autorizzazioni reali.

## Contratto repository

Interfaccia asincrona compatibile con i metodi esistenti:

| Metodo | Risultato/regola |
|---|---|
| context(session) | Utente essenziale e sole organizzazioni visibili. Niente seed o elenco globale utenti alle viste. |
| list(session) | Schede autorizzate; versione pubblicata e revisione corrente separate. |
| get(session,id) | Singola scheda autorizzata o errore. |
| previewContext(session,id) | Contenuti territoriali e flag demo/foto illustrative dopo autorizzazione. |
| save(session,{id,version,patch,media}) | Salvataggio con verifica versione; restituisce scheda aggiornata. |
| submit(session,{id,version}) | Invio, non pubblicazione. |
| queue(session) | Invii visibili alla redazione; paginazione e filtri server da completare con backend reale. |
| review(session,{id,version,revisionId,target,feedback}) | Esito su invio preciso, senza cambiare il pubblicato. |
| compare(session,{id,revisionId}) | Predisposto: confronto proposta/pubblicato, non implementato in questo step. |
| publish(session,{id,revisionId,version}) | Predisposto: sempre indisponibile nel contratto base; futura verifica server e transazione. |
| suspend(session,{id,version}) | Predisposto: sempre indisponibile nel contratto base; futura verifica server. |

`simulate` resta un'estensione esclusiva del repository demo, non una pubblicazione reale.
`session` resta nella firma per compatibilità con la demo: il provider reale non dovrà inoltrare
userId/ruoli dichiarati dalla UI come autorità; userà l'identità verificata dal backend.

La UI riceve lo stesso formato di scheda della Fase 2. Il provider risolve anche i riferimenti
pubblici delle bozze già salvate, senza resettare o migrare IndexedDB. I metodi di mutazione
rigettano la promessa in caso di errore: non restituiscono successi o salvataggi locali fittizi.

## Confini dello step

Il provider Supabase è un blocco intenzionale, non un repository online incompleto utilizzabile.
Non sono ancora attivi login reale, upload remoto, notifiche, inviti, database, RLS o pagamenti.
Il codice UI conserva testi e comportamento demo, che saranno adattati nello step Auth reale.
Il renderer, modello e dati pubblici della Master e Dove Mangiare non sono modificati.

La cartella `supabase/planned-migrations/` prepara sei specifiche non eseguibili per il prossimo
step. Il workflow FTP esclude `operatori/`, `supabase/`, `tests/`, file ambiente e manifest di
sviluppo. Nessun workflow è stato avviato.

## Verifiche

- `node tools/check-operator-backend.cjs`: selezione esplicita, assenza fallback, configurazione
  invalida/non disponibile, zero rete/IndexedDB sul provider Supabase riservato, sessione demo
  asincrona, contesto organizzazioni isolato, template ambiente vuoto.
- Test Fase 2, Scheda Master, traduzioni e conversazioni invariati.
- Browser: login/logout/recupero demo, salvataggio, anteprima e Admin; indisponibilità Supabase
  su tutte e tre le pagine, quindi ripristino demo senza perdita della bozza.

## Prima di creare il progetto insieme

Scegliere account proprietario, nome del progetto di sviluppo e regione; creare il progetto
dalla dashboard ufficiale conservando le credenziali in un gestore sicuro. Non condividerle
in chat. In questo step non servono valori Supabase e non va collegato il repository al progetto.
Nel successivo passaggio guidato configureremo email/password, inviti/conferma email, redirect
esatti, SMTP e account amministrativo. Migrazioni, Storage e policy seguiranno i test locali e
l'autorizzazione all'applicazione remota. Il sito pubblico rimarrà separato.
