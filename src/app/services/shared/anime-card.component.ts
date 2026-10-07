import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LIST_STATUS_META, UserListService } from '../user-list.service';
import { cleanSynopsis } from '../anime-utils';

@Component({
  selector: 'app-anime-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './anime-card.component.html',
  styleUrl: './anime-card.component.css'
})
export class AnimeCardComponent {
  @Input({ required: true }) anime: any;
  @Input() rank: number | null = null;
  @Input() titleLanguage: 'english' | 'original' = 'original';
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() showSynopsis: boolean = false;

  constructor(private userList: UserListService) {}

  /** Segnalino se l'anime è nella lista dell'utente (null se non c'è o non è loggato) */
  get listBadge() {
    const status = this.userList.statusOf(this.anime?.mal_id);
    return status ? LIST_STATUS_META[status] : null;
  }

  get title(): string {
    if (!this.anime) return '';
    if (this.titleLanguage === 'english') {
      return this.anime.title_english || this.anime.title;
    }
    return this.anime.title || this.anime.title_english;
  }

  get truncatedSynopsis(): string {
    const synopsis = cleanSynopsis(this.anime?.synopsis);
    if (!synopsis) return '';
    return synopsis.length > 150 ? synopsis.slice(0, 150) + '...' : synopsis;
  }
}