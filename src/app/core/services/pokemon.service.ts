import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface PokemonSummary {
  name: string;
  url: string;
}

export interface PokemonDetail {
  id: number;
  name: string;
  sprites: {
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'https://pokeapi.co/api/v2';

  // Cache names to avoid multiple big requests
  private pokemonNames = signal<string[]>([]);

  /**
   * Fetch all pokemon names (limit 1500 to catch 'em all)
   */
  async getPokemonNames(): Promise<string[]> {
    if (this.pokemonNames().length > 0) return this.pokemonNames();

    try {
      const data = await firstValueFrom(
        this.http.get<{ results: PokemonSummary[] }>(
          `${this.API_URL}/pokemon?limit=1500`,
        ),
      );
      const names = data.results.map((p) => p.name);
      this.pokemonNames.set(names);
      return names;
    } catch (error) {
      console.error('Error fetching pokemon names:', error);
      return [];
    }
  }

  /**
   * Get details for a specific pokemon by name
   */
  async getPokemonDetails(name: string): Promise<PokemonDetail | null> {
    if (!name) return null;
    try {
      return await firstValueFrom(
        this.http.get<PokemonDetail>(
          `${this.API_URL}/pokemon/${name.toLowerCase()}`,
        ),
      );
    } catch (error) {
      console.error(`Error fetching details for ${name}:`, error);
      return null;
    }
  }

  /**
   * Get a random pokemon name for proposal
   */
  async getRandomPokemonName(): Promise<string> {
    const names = await this.getPokemonNames();
    if (names.length === 0) return 'pikachu';
    const randomIndex = Math.floor(Math.random() * names.length);
    return names[randomIndex];
  }

  /**
   * Get official artwork URL by name
   */
  getArtworkUrl(name: string): string {
    // We can also use direct URL if we trust the API structure to save a call
    // But PokeApi IDs don't always match indices if there are gaps (unlikely for first 1000)
    // For safety, we can construct the URL if we had the ID, but name is what we store.
    return `https://img.pokemondb.net/artwork/large/${name.toLowerCase()}.jpg`;
  }
}
