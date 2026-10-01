import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeasonRef, seasonLabel, seasonSlug } from '../../services/anime-utils';

@Component({
  selector: 'app-seasonal-anime',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './seasonal-anime.component.html',
  styleUrl: './seasonal-anime.component.css'
})
export class SeasonalAnimeComponent implements OnInit, OnChanges {
  @Input() seasonalAnimeList: any[] = [];
  /** Stagione mostrata, decisa dalla home (null finché non è nota) */
  @Input() season: SeasonRef | null = null;
  @ViewChild('track') trackRef!: ElementRef<HTMLDivElement>;

  filteredSeasonalAnime: any[] = [];
  titleLanguage: 'english' | 'original' = 'original';

  canScrollPrev: boolean = false;
  canScrollNext: boolean = true;

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['seasonalAnimeList'] && this.seasonalAnimeList.length > 0) {
      this.filteredSeasonalAnime = [...this.seasonalAnimeList];
      setTimeout(() => this.updateScrollState(), 0);
    }
  }

  getTitle(anime: any): string {
    return this.titleLanguage === 'english'
      ? anime.title_english || anime.title
      : anime.title || anime.title_english;
  }

  get seasonTag(): string {
    return this.season ? seasonLabel(this.season) : '';
  }

  get seasonLink(): string {
    return this.season ? seasonSlug(this.season) : 'now';
  }

  private scrollByAmount(direction: 1 | -1): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;

    const scrollAmount = el.clientWidth * 0.9 * direction;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  nextSlide(): void {
    this.scrollByAmount(1);
  }

  prevSlide(): void {
    this.scrollByAmount(-1);
  }

  onScroll(): void {
    this.updateScrollState();
  }

  private updateScrollState(): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    this.canScrollPrev = el.scrollLeft > 4;
    this.canScrollNext = el.scrollLeft < maxScroll - 4;
  }

  canGoNext(): boolean {
    return this.canScrollNext;
  }

  canGoPrev(): boolean {
    return this.canScrollPrev;
  }
}