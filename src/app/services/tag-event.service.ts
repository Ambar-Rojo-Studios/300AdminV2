import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class TagEventService {
  
  private tagChangeSource = new Subject<void>();
  tagChange$ = this.tagChangeSource.asObservable();

  notifyTagChange(): void {
    this.tagChangeSource.next();
  }

  private tagAgregadaSource = new Subject<void>();
  tagAgregada$ = this.tagAgregadaSource.asObservable();

  notificarEtiquetaAgregada(): void {
    this.tagAgregadaSource.next();
    this.notifyTagChange();
  }
}
