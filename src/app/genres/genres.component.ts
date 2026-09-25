import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GenreService, Genre, GenreCategory } from '../services/genre.service';
import { getGenreShortDescription } from '../services/constants/anime-genre-descriptions';

type CategoryFilter = GenreCategory | 'all';
type SortOrder = 'name' | 'count';

interface CategoryMeta {
  id: GenreCategory;
  label: string;
  intro: string;
}

interface GenreItem extends Genre {
  description: string;
  searchText: string;
}

// Ordine delle sezioni: prima ciò che si esplora di più, gli espliciti in fondo
const CATEGORIES: CategoryMeta[] = [
  { id: 'genres', label: 'Generi', intro: 'Il tipo di storia: cosa racconta e che emozioni cerca.' },
  { id: 'themes', label: 'Temi', intro: 'Ambientazioni, argomenti e motivi ricorrenti.' },
  { id: 'demographics', label: 'Demografie', intro: 'Il pubblico a cui l\'opera è rivolta.' },
  { id: 'explicit_genres', label: 'Espliciti', intro: 'Contenuti a sfondo sessuale, per un pubblico adulto.' }
];

// Minuscolo e senza accenti, così "comedia" o "citta" trovano comunque il testo
function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

@Component({
  selector: 'app-genres',
  standalone: true,
  templateUrl: './genres.component.html',
  styleUrls: ['./genres.component.css'],
  imports: [RouterLink]
})
export class GenresComponent implements OnInit {
  private genreService = inject(GenreService);

  readonly categories = CATEGORIES;
  readonly skeletonRows = Array.from({ length: 12 });
  private readonly numberFormat = new Intl.NumberFormat('it-IT');

  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly query = signal('');
  readonly activeCategory = signal<CategoryFilter>('all');
  readonly sortOrder = signal<SortOrder>('name');
  private readonly genres = signal<GenreItem[]>([]);

  /** Generi che corrispondono alla ricerca, prima del filtro per categoria */
  private readonly matching = computed(() => {
    const q = normalize(this.query().trim());
    const all = this.genres();
    return q ? all.filter(g => g.searchText.includes(q)) : all;
  });

  readonly totalCount = computed(() => this.genres().length);
  readonly matchingCount = computed(() => this.matching().length);

  /** Quanti risultati ha ogni categoria con la ricerca attuale (per i filtri) */
  readonly countByCategory = computed(() => {
    const counts: Record<GenreCategory, number> = { genres: 0, themes: 0, demographics: 0, explicit_genres: 0 };
    for (const g of this.matching()) counts[g.category]++;
    return counts;
  });

  readonly sections = computed(() => {
    const active = this.activeCategory();
    const byCount = this.sortOrder() === 'count';
    return CATEGORIES
      .filter(c => active === 'all' || c.id === active)
      .map(c => ({
        ...c,
        items: this.matching()
          .filter(g => g.category === c.id)
          .sort((a, b) => byCount ? b.count - a.count : a.name.localeCompare(b.name, 'en'))
      }))
      .filter(s => s.items.length > 0);
  });

  ngOnInit(): void {
    this.loadGenres();
  }

  loadGenres(): void {
    this.status.set('loading');
    this.genreService.getAllGenres().subscribe({
      next: genres => {
        this.genres.set(genres.map(g => {
          const description = getGenreShortDescription(g.id) ?? '';
          return { ...g, description, searchText: normalize(`${g.name} ${description}`) };
        }));
        this.status.set('ready');
      },
      error: error => {
        console.error('Errore nel caricamento dei generi:', error);
        this.status.set('error');
      }
    });
  }

  onSearch(value: string): void {
    this.query.set(value);
  }

  clearSearch(input: HTMLInputElement): void {
    this.query.set('');
    input.value = '';
    input.focus();
  }

  formatCount(count: number): string {
    return this.numberFormat.format(count);
  }
}
