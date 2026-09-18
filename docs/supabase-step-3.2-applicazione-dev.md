# Step 3.2 — applicazione autorizzata sul DEV e verifica remota

Esito: tutte le sette migrazioni applicate senza errori con CLI ufficiale 2.117.0.
Solo progetto Cilentomania HUB - DEV UE, organizzazione Cilentomania APS,
regione eu-central-1 (Francoforte), riferimento qgkwqzjapvjvzmvdfges.
Nessun altro progetto interessato; frontend non collegato; nessun commit, push o deploy web.

Comando utilizzato: `supabase db push --linked --skip-vault --yes --agent no --output pretty`.
Nessun seed, roles.sql, reset, repair o modifica manuale remota. Nessun aggiornamento Vault.

## Storico applicato, identico a quello locale

1. 20260918000100_identity.sql
2. 20260918000200_content.sql
3. 20260918000300_media_commercial.sql
4. 20260918000400_permissions.sql
5. 20260918000500_workflow.sql
6. 20260918000600_public_storage.sql
7. 20260918000700_read_api_hardening.sql

## Controlli remoti completati

- 19 tabelle hub_private, tutte con RLS attiva e proprietario hub_owner.
- 117 vincoli validati: 35 FK, 19 chiavi primarie, 16 UNIQUE e 47 CHECK.
- 49 indici, tutti validi e pronti; nessun trigger applicativo disabilitato.
- Colonne, tipi, valori predefiniti, NOT NULL, vincoli, indici, policy, corpi e permessi delle
  funzioni confrontati con le sette migrazioni rieseguite in un database locale effimero:
  corrispondenza completa dopo normalizzazione del nome del principal di migrazione.
- hub_owner/hub_executor senza login, superuser, creazione ruoli o bypass RLS;
  authenticated non è membro di hub_executor.
- Nessun grant di SELECT/INSERT/UPDATE/DELETE anonimo sulle tabelle private e nessuna
  scrittura diretta di tabella per il ruolo authenticated.
- Prova effettiva `SET LOCAL ROLE anon`: SELECT su hub_private.listings negata con 42501.
  È l'esito atteso di un test negativo, non un errore di migrazione.
- Prova effettiva anon: public_listing restituisce null, Storage non mostra oggetti,
  USAGE sullo schema hub_private negato.
- Prova authenticated senza identità: context null, elenco schede vuoto, nessun profilo
  o revisione visibile. Nessun utente o JWT reale creato per effettuare questi controlli.

## Proiezione pubblica

La definizione remota coincide con quella locale approvata. Campi radice espliciti:
id, slug, type, isDemo, name, category, shortDescription, description, location, contacts,
features, amenities, translations, media. Anche i sotto-oggetti pubblici hanno whitelist.
Esclusi dati commerciali, organization_id, autori, storico e revisioni private.
La selezione usa published_revision_id, revisione approved, listing published e organizzazione
attiva. Nessuna scheda esiste ancora: il risultato null è corretto; non sono stati creati
contenuti sintetici nel database remoto per produrre una risposta di esempio.

## Storage

Presenti soltanto listing-drafts e listing-published, entrambi privati, 5 MiB per immagine,
JPEG/PNG/WebP. Nessun oggetto caricato.
Le sole quattro policy su storage.objects sono:

- hub_draft_read;
- hub_draft_insert;
- hub_published_read;
- hub_prepared_media_lookup.

Confronto esatto delle definizioni e dei ruoli con lo schema previsto. Aggiunti soltanto
bucket, policy e grants di lettura programmati; proprietà e struttura delle tabelle Storage
sono identiche prima e dopo l'applicazione.

## Dati e integrità Auth

Conteggi zero: auth.users, profiles, organizations, organization_members, staff_roles,
listings, listing_revisions, media, plans, contracts, subscriptions, payments, notifications.
Nessun cliente, account reale, Dimora del Mare o dato commerciale inserito. Sono presenti
soltanto i dieci codici servizi previsti e le due configurazioni bucket.

Confronto delle impronte dei cataloghi Auth prima/dopo: identici schema/proprietario/ACL,
relazioni/proprietari/ACL/RLS, colonne/default, funzioni/definizioni/ACL, vincoli dello schema
Auth, policy e trigger non interni. Utenti Auth sempre zero. Nessuna configurazione Auth
modificata. La FK profiles → auth.users è un vincolo del nuovo schema HUB; PostgreSQL ne
gestisce normalmente i trigger referenziali interni, non modificati manualmente.

## Differenze e limiti del collaudo

Il remoto usa PostgreSQL 17.6; PGlite 0.5.8 usa PostgreSQL 18.3. PostgreSQL 18 espone 92
NOT NULL anche in pg_constraint, mentre 17 li rappresenta tramite gli attributi delle
colonne. Il confronto degli attributi conferma gli stessi obblighi: nessuna differenza
funzionale di schema rilevata.

La precedente emulazione locale delle quattro policy Storage è ora riscontrata dalle
policy effettivamente create sul DEV. Restano futuri i test di login/JWT reali, upload HTTP,
worker immagini e concorrenza multi-connessione. Richiedono una fase autorizzata distinta;
questo controllo non ha creato utenti o schede di test remoti.

Esito complessivo positivo. La demo frontend resta selezionata, nessun import o collegamento
applicativo a Supabase. Fermarsi e attendere le istruzioni per il prossimo step.
