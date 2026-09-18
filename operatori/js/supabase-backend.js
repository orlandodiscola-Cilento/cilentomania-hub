import {BackendUnavailableError} from './configuration.js';

// Step 3.1: reserved provider, intentionally unavailable.
// No SDK, network request, session, browser storage or credentials are initialized.
// Database/RLS and real authentication require subsequent authorized steps.
export async function connectBackend() {
  throw new BackendUnavailableError();
}
