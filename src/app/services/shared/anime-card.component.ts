import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-anime-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './anime-card.component.html',
  styleUrl: './anime-card.component.css'
})
export class AnimeCardComponent {
  @Input({ required: true }) anime: any;
  @Input() rank: number | null = null;
  @Input() titleLanguage: 'english' | 'original' = 'original';
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() showSynopsis: boolean = false;

  get title(): string {
    if (!this.anime) return '';
    if (this.titleLanguage === 'english') {
      return this.anime.title_english || this.anime.title;
    }
    return this.anime.title || this.anime.title_english;
  }

  get truncatedSynopsis(): string {
    const synopsis = this.anime?.synopsis;
    if (!synopsis) return '';
    return synopsis.length > 150 ? synopsis.slice(0, 150) + '...' : synopsis;
  }
}