import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ 
  providedIn: 'root' 
})

export class NavigationEventsService {
  private adminMenuSubject = new Subject<void>();
  adminMenu$ = this.adminMenuSubject.asObservable();

  openAdminMenu() {
    this.adminMenuSubject.next();
  }
}
