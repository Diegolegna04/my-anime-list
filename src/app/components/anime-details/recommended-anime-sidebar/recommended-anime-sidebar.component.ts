import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface RecommendedAnime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
    }
  };
}

@Component({
  selector: 'app-recommended-anime-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recommended-anime-sidebar.component.html',
  styleUrls: ['./recommended-anime-sidebar.component.css']
})
export class RecommendedAnimeSidebarComponent implements OnChanges {
  @Input() recommendedAnime: RecommendedAnime[] = [];
  @Output() animeClicked = new EventEmitter<number>();

  displayedAnime: RecommendedAnime[] = [];
  private itemsToShow = 5;
  private readonly increment = 5;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recommendedAnime'] && this.recommendedAnime) {
      this.resetDisplay();
    }
  }

  private resetDisplay(): void {
    this.itemsToShow = 5;
    this.updateDisplayedAnime();
  }

  private updateDisplayedAnime(): void {
    this.displayedAnime = this.recommendedAnime.slice(0, this.itemsToShow);
  }

  loadMore(): void {
    this.itemsToShow += this.increment;
    this.updateDisplayedAnime();
  }
}