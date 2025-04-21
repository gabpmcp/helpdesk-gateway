/**
 * Gestor de configuración que sigue los principios FCIS
 * (Separación de Interfaces Funcionales y Composicionales)
 * 
 * En desarrollo: Usa variables de entorno de Vite (.env)
 * En producción: Carga configuración desde /public/config.json
 */

import { Map as ImmutableMap } from 'immutable';

// Interfaz para la configuración tipada
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  n8n: {
    webhookUrl: string;
  };
  auth: {
    tokenKey: string;
  };
  env: string;
}

// Estado para almacenar la configuración
let configState: ImmutableMap<string, any> | null = null;

/**
 * Obtiene la configuración de desarrollo desde las variables de entorno de Vite
 */
function getDevConfig(): AppConfig {
  return {
    api: {
      baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 30000,
    },
    n8n: {
      webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.advancio.io/webhook',
    },
    auth: {
      tokenKey: 'helpdesk-auth',
    },
    env: 'development',
  };
}

/**
 * Carga la configuración para producción desde /public/config.json
 */
async function loadProductionConfig(): Promise<AppConfig> {
  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      console.error('Error cargando configuración:', response.statusText);
      throw new Error(`Error cargando configuración: ${response.statusText}`);
    }
    
    const config = await response.json();
    return {
      api: {
        baseUrl: config.api?.baseUrl || '',
        timeout: config.api?.timeout || 30000,
      },
      n8n: {
        webhookUrl: config.n8n?.webhookUrl || '',
      },
      auth: {
        tokenKey: config.auth?.tokenKey || 'helpdesk-auth',
      },
      env: 'production',
    };
  } catch (error) {
    console.error('Error fatal cargando configuración:', error);
    throw new Error('No se pudo cargar la configuración de producción. Verifica que el archivo config.json exista en /public/');
  }
}

/**
 * Inicializa la configuración según el entorno
 */
export async function initConfig(): Promise<ImmutableMap<string, any>> {
  if (configState) {
    return configState;
  }
  
  let config: AppConfig;
  
  // Determinar si estamos en desarrollo o producción
  const isDevelopment = import.meta.env.MODE === 'development';
  
  if (isDevelopment) {
    console.log('🔧 Modo desarrollo: Usando variables de entorno Vite');
    config = getDevConfig();
  } else {
    console.log('🚀 Modo producción: Cargando configuración desde /public/config.json');
    config = await loadProductionConfig();
  }
  
  // Convertir a estructura inmutable según los principios de diseño
  configState = ImmutableMap(config);
  return configState;
}

/**
 * Obtiene la configuración actual
 * Lanza error si no se ha inicializado
 */
export function getConfig(): ImmutableMap<string, any> {
  if (!configState) {
    throw new Error('La configuración no ha sido inicializada. Llama a initConfig() primero.');
  }
  return configState;
}

/**
 * Hook para React que inicializa y devuelve configuración asíncrona
 */
export async function useConfig(): Promise<ImmutableMap<string, any>> {
  if (!configState) {
    return await initConfig();
  }
  return configState;
}

/**
 * Devuelve el baseUrl actual de la API.
 * Lanza error si la configuración no está inicializada.
 */
export function getBaseUrl(): string {
  const config = getConfig();
  return config.getIn(['api', 'baseUrl']) || config.get('baseUrl') || 'http://localhost:3000';
}

export default { initConfig, getConfig, useConfig, getBaseUrl };
