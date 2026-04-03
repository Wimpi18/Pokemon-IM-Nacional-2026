import { Pipe, PipeTransform, inject } from '@angular/core';
import { PokemonService } from '../../core/services/pokemon.service';

@Pipe({
  name: 'pokemonArtwork',
  standalone: true,
})
export class PokemonArtworkPipe implements PipeTransform {
  private readonly pokemonService = inject(PokemonService);

  transform(name: string | undefined | null): string | null {
    if (!name) return null;
    return this.pokemonService.getArtworkUrl(name);
  }
}
