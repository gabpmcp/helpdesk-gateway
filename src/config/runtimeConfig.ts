let config: any = null;

export async function loadRuntimeConfig() {
  if (config) return config;
  const response = await fetch('/config.json');
  config = await response.json();
  return config;
}

export function getRuntimeConfig() {
  if (!config) {
    throw new Error('Config not loaded! Llama a loadRuntimeConfig() antes de usarla.');
  }
  return config;
}
