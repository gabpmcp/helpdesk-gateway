let config: any = null;

export async function loadRuntimeConfig() {
  if (config) return config;
  
  console.log('📝 Intentando cargar configuración desde /config.json...');
  
  // Configurar fetch con los parámetros correctos para evitar problemas CORS
  const response = await fetch('/config.json', {
    method: 'GET',
    mode: 'cors',
    credentials: 'include',  // Importante para CORS con backend configurado para credenciales
    headers: {
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Error cargando configuración: ${response.status} ${response.statusText}`);
  }
  
  config = await response.json();
  console.log('✅ Configuración cargada correctamente');
  return config;
}

export function getRuntimeConfig() {
  if (!config) {
    throw new Error('Config not loaded! Llama a loadRuntimeConfig() antes de usarla.');
  }
  return config;
}
