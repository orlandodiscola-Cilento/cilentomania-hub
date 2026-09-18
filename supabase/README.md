# Step 3.2 — schema e permessi, solo locale

**Aggiornamento:** le sette migrazioni sono ora applicate, su autorizzazione separata,
al solo DEV UE di Francoforte. Controlli remoti completati con esito positivo:
`../docs/supabase-step-3.2-applicazione-dev.md`. Il frontend resta demo.
Le descrizioni sotto conservano il contesto della preparazione e dei dry-run precedenti.

Sette migrazioni SQL versionate sostituiscono i sei template preparatori. Non sono state
applicate a Supabase. Collegamento CLI e dry-run DEV completati su autorizzazione separata;
nessuna credenziale nel repository, account reale o cliente creato.
Il frontend resta demo; Scheda Master e Dove Mangiare non cambiano.

Destinazione futura autorizzabile: **Cilentomania APS / Cilentomania HUB - DEV EU /
Francoforte eu-central-1** (nome verificato in dashboard/CLI: DEV UE). Il progetto irlandese
è escluso. Il collegamento locale è conservato in supabase/.temp, escluso da Git.

| Migrazione | Contenuto |
|---|---|
| 20260918000100_identity.sql | Schemi privati/API, ruoli SQL senza login, profili, organizzazioni, membership, staff |
| 20260918000200_content.sql | Schede, revisioni, Comuni, caratteristiche, servizi, traduzioni, storico |
| 20260918000300_media_commercial.sql | Media versionati; tabelle commerciali vuote |
| 20260918000400_permissions.sql | Grants, RLS, controllo campi, contenuto congelato dopo invio |
| 20260918000500_workflow.sql | Salvataggio, invio, revisione, nuova bozza, pubblicazione/sospensione |
| 20260918000600_public_storage.sql | Bucket privati, policy Storage e proiezione pubblica |
| 20260918000700_read_api_hardening.sql | API lettura/coda/confronto, validazione server, indici e storico immutabile |

Applicare nell'ordine, una volta, attraverso lo storico delle migrazioni. Le collisioni
devono fermare l'operazione. Nessun seed automatico: soltanto i dieci codici servizi reali
vengono inseriti; utenti, organizzazioni e tabelle commerciali rimangono vuoti.

## Test senza Supabase

Da questa cartella:

```powershell
npm.cmd ci --prefix tests --ignore-scripts --no-audit --no-fund
npm.cmd test --prefix tests
```

Dipendenza bloccata nel lockfile: PGlite 0.5.8, PostgreSQL locale WASM. Il runner crea un
database effimero in memoria, applica SQL con un ruolo **non superuser**, poi verifica
anon/authenticated/service_role con identità simulate. Fixture: due organizzazioni, sei
utenti, tre schede di più tipologie e più revisioni. Nessun ambiente Supabase viene letto.

`tests/bootstrap-local.sql` sostituisce solo localmente gli oggetti Auth/Storage:
**non applicarlo mai a Supabase**. Anche run.mjs contiene solo fixture locali, non Dimora
del Mare. I test non verificano JWT reali, email, PostgREST, Storage HTTP, byte delle foto
o concorrenza multi-connessione. Queste prove seguiranno sul DEV autorizzato.

Correzione successiva al preflight DEV: nessuna concessione o modifica di privilegi Auth.
L'helper privato HUB conserva l'uso di auth.uid(). I test verificano ACL Auth immutati e
privilegi del migratore equivalenti a quelli osservati, con 87 controlli superati.
Eccezione esplicita del simulatore: le quattro CREATE POLICY Storage sono eseguite dal
bootstrap per emulare supautils.policy_grants, assente in PGlite. Non vengono concessi al
migratore ownership o ruoli gestiti. Vedere il documento di dettaglio prima di applicare.

Architettura, permessi, limiti e procedura remota: `../docs/supabase-step-3.2.md`.
Non esporre hub_private nella Data API; la futura esposizione è limitata a hub_api con
EXECUTE espliciti. Autenticazione, worker foto e provider frontend non sono collegati.
