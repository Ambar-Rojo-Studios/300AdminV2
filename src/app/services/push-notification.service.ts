import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PushNotificationRequest {
  titulo: string;
  cuerpo: string;
  imagenUrl?: string;
  data?: Record<string, string>;
  topic?: string;
  tokens?: string[];
  idCliente?: number;
}

export interface PushNotificationResponse {
  messageId: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/push-notification';

  /**
   * Enviar notificación a un cliente específico por ID
   */
  enviarPorCliente(idCliente: number, titulo: string, cuerpo: string, imagenUrl?: string): Observable<any> {
    const payload: PushNotificationRequest = {
      titulo,
      cuerpo,
      imagenUrl,
      idCliente
    };
    return this.http.post(`${this.apiUrl}/enviar`, payload);
  }

  /**
   * Enviar notificación a varios clientes
   */
  enviarPorIds(idsClientes: number[], titulo: string, cuerpo: string, imagenUrl?: string): Observable<any> {
    const payload: PushNotificationRequest = {
      titulo,
      cuerpo,
      imagenUrl,
      data: { idsClientes: idsClientes.join(',') }
    };
    return this.http.post(`${this.apiUrl}/enviar-varios`, payload);
  }

  /**
   * Enviar notificación a un topic (todos los usuarios suscritos)
   */
  enviarPorTopic(topic: string, titulo: string, cuerpo: string, imagenUrl?: string): Observable<any> {
    const payload: PushNotificationRequest = {
      titulo,
      cuerpo,
      imagenUrl,
      topic
    };
    return this.http.post(`${this.apiUrl}/topic`, payload);
  }

  /**
   * Enviar notificación a tokens específicos
   */
  enviarPorTokens(tokens: string[], titulo: string, cuerpo: string, imagenUrl?: string): Observable<any> {
    const payload: PushNotificationRequest = {
      titulo,
      cuerpo,
      imagenUrl,
      tokens
    };
    return this.http.post(`${this.apiUrl}/tokens`, payload);
  }

  /**
   * Enviar notificación multicast (a múltiples dispositivos)
   */
  enviarMulticast(tokens: string[], titulo: string, cuerpo: string, data?: Record<string, string>): Observable<any> {
    const payload: PushNotificationRequest = {
      titulo,
      cuerpo,
      data
    };
    return this.http.post(`${this.apiUrl}/multicast`, { tokens, ...payload });
  }

  /**
   * Enviar notificación de prueba
   */
  enviarPrueba(): Observable<any> {
    return this.http.post(`${this.apiUrl}/prueba`, {
      titulo: 'Notificación de Prueba',
      cuerpo: 'Esta es una notificación de prueba desde el admin'
    });
  }
}

