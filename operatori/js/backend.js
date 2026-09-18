import {loadConfiguration, validateConfiguration, BackendUnavailableError} from './configuration.js';

const providers = {
  demo: () => import('./demo-backend.js'),
  supabase: () => import('./supabase-backend.js')
};

export async function createBackend(configuration, loaders = providers) {
  const config = validateConfiguration(configuration);
  try {
    if (config.backend === 'demo' && config.auth === 'supabase') {
      // Auth-only stage: never manufacture a demo identity or open demo storage
      // for a real user. Content provider selection stays unchanged in config.
      const {connectAuthStage} = await import('./supabase-auth.js');
      return await connectAuthStage(config);
    }
    // Exactly one provider is loaded. No retry against demo on any error.
    const provider = await loaders[config.backend]();
    return await provider.connectBackend(config);
  } catch { throw new BackendUnavailableError(); }
}

let connection;
export function getBackend() {
  // Keep failures rejected, too. Retry requires an explicit page reload.
  connection ||= loadConfiguration().then(config => createBackend(config));
  return connection;
}

export function showBackendError(root) {
  const banner = document.querySelector('.demo-banner');
  if (banner) banner.textContent = 'Area non disponibile';
  const previewTitle = document.querySelector('.preview-bar strong');
  if (previewTitle) previewTitle.textContent = 'Anteprima non disponibile';
  root.replaceChildren();
  const message = document.createElement('p');
  message.className = 'notice error';
  message.setAttribute('role', 'alert');
  message.textContent = new BackendUnavailableError().message;
  root.append(message);
}
