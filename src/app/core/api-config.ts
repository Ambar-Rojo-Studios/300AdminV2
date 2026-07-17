/**
 * Configuración central de la URL base de la API.
 * Se obtiene dinámicamente desde las variables de entorno del proyecto.
 */
import { environment } from '../../environments/environments';

export const API_BASE_URL: string = environment.apiBaseUrl;
