import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-seasonal-anime',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './seasonal-anime.component.html',
  styleUrl: './seasonal-anime.component.css'
})
export class SeasonalAnimeComponent implements OnInit, OnChanges {
  @Input() seasonalAnimeList: any[] = [];

  filteredSeasonalAnime: any[] = [];
  currentSlideIndex: number = 0;
  itemsPerSlide: number = 5;
  titleLanguage: 'english' | 'original' = 'original';

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['seasonalAnimeList'] && this.seasonalAnimeList.length > 0) {
      this.filteredSeasonalAnime = [...this.seasonalAnimeList];
    }
  }

  getTitle(anime: any): string {
    if (this.titleLanguage === 'english') {
      return anime.title_english || anime.title;
    } else {
      return anime.title || anime.title_english;
    }
  }

  getCurrentAnimeSeason(): string {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    let season = '';

    if (month >= 4 && month <= 6) {
      season = 'Spring';
    } else if (month >= 7 && month <= 9) {
      season = 'Summer';
    } else if (month >= 10 && month <= 12) {
      season = 'Fall';
    } else {
      season = 'Winter';
    }

    return season + ' ' + year;
  }

  getCurrentAnimeSeasonT(): string {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    let season = '';

    if (month >= 4 && month <= 6) {
      season = 'spring';
    } else if (month >= 7 && month <= 9) {
      season = 'summer';
    } else if (month >= 10 && month <= 12) {
      season = 'fall';
    } else {
      season = 'winter';
    }

    return season + '-' + year;
  }

  getCurrentSlideAnime(): any[] {
    const startIndex = this.currentSlideIndex;
    const endIndex = startIndex + this.itemsPerSlide;
    return this.filteredSeasonalAnime.slice(startIndex, endIndex);
  }

  nextSlide(): void {
    const maxIndex = Math.max(0, this.filteredSeasonalAnime.length - this.itemsPerSlide);
    if (this.currentSlideIndex < maxIndex) {
      this.currentSlideIndex += 4;
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex -= 4;
    }
  }

  canGoNext(): boolean {
    const maxIndex = Math.max(0, this.filteredSeasonalAnime.length - this.itemsPerSlide);
    return this.currentSlideIndex < maxIndex;
  }

  canGoPrev(): boolean {
    return this.currentSlideIndex > 0;
  }
}