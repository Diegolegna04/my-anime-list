import { Component, input, output, model } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LIST_STATUS_META, UserListService } from '../../services/user-list.service';

/**
 * Anteprima dei risultati sotto la barra di ricerca (desktop e mobile).
 * L'host è il pannello: l'header lo posiziona dentro il suo `.search-form`.
 */
@Component({
  selector: 'app-search-suggest',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './search-suggest.component.html',
  styleUrls: ['./search-suggest.component.css']
})
export class SearchSuggestComponent {
  /** Id della lista: serve a `aria-controls` e `aria-activedescendant` della barra */
  listId = input.required<string>();
  suggestions = input<any[]>([]);
  loading = input(false);
  query = input('');
  /** Voce scelta con le frecce o sotto il mouse */
  activeIndex = model(-1);
  chosen = output<any>();

  constructor(private userList: UserListService) {}

  /** Titolo nella lingua scelta dall'utente nelle liste */
  suggestionTitle(anime: any): string {
    const english = localStorage.getItem('titleLanguage') === 'english';
    return (english ? anime.title_english : null) || anime.title || anime.title_english || '';
  }

  suggestionMeta(anime: any): string {
    const parts = [anime.type, anime.year || anime.aired?.prop?.from?.year].filter(Boolean);
    return parts.join(' · ');
  }

  suggestionBadge(anime: any) {
    const status = this.userList.statusOf(anime?.mal_id);
    return status ? LIST_STATUS_META[status] : null;
  }
}
