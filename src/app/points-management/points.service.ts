import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PointsAdjustment } from './points-adjustment.model';

@Injectable({ providedIn: 'root' })
export class PointsService {
  saveAdjustment(data: PointsAdjustment): Observable<void> {
    // TODO: Replace with real HTTP call when backend is ready
    console.log('[PointsService] Saving adjustment:', data);
    return of(void 0);
  }
}
