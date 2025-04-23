import { getRuntimeConfig } from '../../config/runtimeConfig';
import { getBaseUrl, initConfig } from '../../config';

// API configuration type
export interface ApiConfig {
  baseUrl: string;
  defaultHeaders: Record<string, string>;
}

// API client interface
export type ApiClient = {
  get: <T>(endpoint: string, customHeaders?: Record<string, string>) => Promise<T>;
  post: <T>(endpoint: string, data?: unknown, customHeaders?: Record<string, string>) => Promise<T>;
  put: <T>(endpoint: string, data?: unknown, customHeaders?: Record<string, string>) => Promise<T>;
  delete: <T>(endpoint: string, customHeaders?: Record<string, string>) => Promise<T>;
};

// Variable para rastrear si ya se verificó la disponibilidad del servidor
let serverAvailabilityChecked = false;
let serverAvailable = false;

/**
 * Verifica si el servidor backend está disponible
 * @param baseUrl URL base del servidor a verificar
 * @returns Promise<boolean> true si está disponible, false si no
 */
const checkServerAvailability = async (baseUrl: string): Promise<boolean> => {
  try {
    console.log(`🔍 Verificando disponibilidad del servidor: ${baseUrl}`);
    
    // Intentar una petición simple al servidor (health check)
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      // No enviamos credenciales en el health check para evitar problemas CORS
      credentials: 'omit'
    });
    
    // Si responde con cualquier código (incluso 404), consideramos que el servidor está activo
    console.log(`✅ Servidor respondió con status: ${response.status}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ No se pudo conectar al servidor: ${baseUrl}`, error);
    return false;
  }
};

// Create API client with dependency injection
export function getApiClient(): ApiClient {
  // Intentamos obtener la URL base, pero manejamos el caso de que la configuración no esté inicializada
  let baseUrl: string;
  
  try {
    baseUrl = getBaseUrl();
    console.log(`🔌 Conectando a API: ${baseUrl}`);
  } catch (error) {
    console.warn('⚠️ Configuración no inicializada. Intentando inicializar automáticamente...');
    // Intentamos inicializar la configuración de forma sincrónica (solo para fallback)
    // Esto no es lo ideal y debería ser solo como último recurso
    // La inicialización correcta debe hacerse en main.tsx
    baseUrl = 'http://localhost:3000'; // URL por defecto como fallback
    
    // Inicializamos la configuración de forma asíncrona para futuras llamadas
    initConfig().then(() => {
      console.log('✅ Configuración inicializada automáticamente');
    }).catch(err => {
      console.error('❌ Error al inicializar configuración automáticamente:', err);
    });
  }

  // Verificar disponibilidad del servidor en el primer uso del cliente API
  if (!serverAvailabilityChecked) {
    serverAvailabilityChecked = true;
    
    // Verificamos de forma asíncrona pero no esperamos el resultado
    // para no bloquear la creación del cliente
    checkServerAvailability(baseUrl).then(available => {
      serverAvailable = available;
      console.log(`🔄 Estado del servidor: ${serverAvailable ? 'Disponible' : 'No disponible'}`);
    });
  }
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Utility to get token from localStorage
  const getToken = (): string | null => {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsedData = JSON.parse(authData);
        return parsedData.tokens?.accessToken || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  // Generic request function using fetch
  async function request<T>(endpoint: string, method: string, data?: unknown, customHeaders?: Record<string, string>): Promise<T> {
    const url = baseUrl + endpoint;
    const token = getToken();
    const headers: Record<string, string> = {
      ...defaultHeaders,
      ...(customHeaders || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
      mode: 'cors'
    };
    
    if (data !== undefined) {
      options.body = JSON.stringify(data);
    }

    // Logging detallado para depuración
    console.log(`📤 Request: ${method} ${url}`);
    console.log(`🔧 Request Options:`, JSON.stringify({
      method,
      credentials: options.credentials,
      mode: options.mode,
      headers: {...headers, Authorization: token ? '**REDACTED**' : undefined}
    }, null, 2));
    
    // Si ya sabemos que el servidor no está disponible, advertimos pero intentamos igual
    if (serverAvailabilityChecked && !serverAvailable) {
      console.warn(`⚠️ Intentando request a un servidor que previamente no estaba disponible: ${url}`);
    }
    
    try {
      console.log(`🌐 Iniciando fetch a: ${url}`);
      
      // Para endpoints específicos que sabemos que tienen problemas con CORS y credenciales,
      // podemos optar por usar 'same-origin' o 'omit' en lugar de 'include'
      if (endpoint === '/api/zoho/reports-overview') {
        console.log(`⚠️ Endpoint sensible a CORS detectado, ajustando configuración`);
        options.credentials = 'omit'; // Probar primero con 'omit' para ver si resuelve el problema
      }
      
      const response = await fetch(url, options);
      let responseData;
      
      console.log(`✅ Respuesta recibida - Status: ${response.status}`);
      
      try {
        responseData = await response.json();
        console.log(`📊 Datos recibidos:`, typeof responseData === 'object' ? 
          JSON.stringify(responseData).substring(0, 200) + '...' : responseData);
      } catch (err) {
        console.error(`❌ Error al parsear respuesta JSON:`, err);
        responseData = null;
      }
      
      if (!response.ok) {
        console.error(`❌ API error: ${response.status}`, responseData);
        throw new Error(responseData?.message || `API error: ${response.status}`);
      }
      
      return responseData as T;
    } catch (error) {
      console.error(`❌ Fetch error:`, error);
      console.error(`❌ URL que falló: ${url}`);
      console.error(`❌ Método: ${method}`);
      console.error(`❌ Headers:`, JSON.stringify({...headers, Authorization: token ? '**REDACTED**' : undefined}));
      throw error;
    }
  }

  // HTTP methods
  return {
    get: <T>(endpoint: string, customHeaders?: Record<string, string>) => request<T>(endpoint, 'GET', undefined, customHeaders),
    post: <T>(endpoint: string, data?: unknown, customHeaders?: Record<string, string>) => request<T>(endpoint, 'POST', data, customHeaders),
    put: <T>(endpoint: string, data?: unknown, customHeaders?: Record<string, string>) => request<T>(endpoint, 'PUT', data, customHeaders),
    delete: <T>(endpoint: string, customHeaders?: Record<string, string>) => request<T>(endpoint, 'DELETE', undefined, customHeaders),
  };
}

// Create a default API client instance
// Lazy initialization pattern to avoid creating the client before config is loaded
let _apiClient: ApiClient | null = null;

export function apiClient(): ApiClient {
  if (!_apiClient) {
    _apiClient = getApiClient();
  }
  return _apiClient;
}
