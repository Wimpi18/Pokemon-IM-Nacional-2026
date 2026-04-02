import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

/**
 * Guardian secundario que lee la propiedad `data: { roles: ['rol'] }`
 * de la ruta, validando OCP (Open/Closed Principle) para el enrutamiento.
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isAuthReady).pipe(
    filter((isReady) => isReady),
    map(() => {
      const profile = authService.userProfile();
      const allowedRoles = route.data['roles'] as string[] | undefined;

      // Si la ruta específica un rol y el usuario lo tiene, o si la ruta no tiene restricciones
      if (!allowedRoles || (profile && allowedRoles.includes(profile.role))) {
        return true;
      }

      // Si se prohíbe el acceso y es un cursante, enviarlo a su jaula
      if (profile?.role === 'cursante') {
        return router.createUrlTree(['/perfil']);
      }

      // Si otra cosa extraña ocurre, enviarlo a login
      return router.createUrlTree(['/login']);
    }),
  );
};
