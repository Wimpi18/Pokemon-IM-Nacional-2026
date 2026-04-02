import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Convertimos el signal `isAuthReady` a un Observable.
  // El Router se pausará mágicamente hasta que isAuthReady sea true.
  return toObservable(authService.isAuthReady).pipe(
    filter((isReady) => isReady),
    map(() => {
      // Una vez que Firebase revisó localmente si hay sesión, comprobamos:
      if (authService.currentUser()) {
        return true;
      }
      return router.createUrlTree(['/login']);
    }),
  );
};
