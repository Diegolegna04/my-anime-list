import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimeNews } from '../../../services/anime.models';

export type { AnimeNews };

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news-list.component.html',
  styleUrls: ['./news-list.component.css']
})
export class NewsListComponent implements OnChanges {
  @Input() news: AnimeNews[] = [];
  /** Prima "Nessuna news" compariva anche durante il caricamento e quando il servizio era giù */
  @Input() status: 'loading' | 'ready' | 'error' = 'ready';
  @Output() retry = new EventEmitter<void>();

  displayedNews: AnimeNews[] = [];
  isExpanded: boolean = false;
  private itemsToShow: number = 3;
  private readonly increment: number = 3;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['news'] && this.news) {
      this.reset();
    }
  }

  private reset(): void {
    this.isExpanded = false;
    this.itemsToShow = 3;
    this.updateDisplayedNews();
  }

  private updateDisplayedNews(): void {
    this.displayedNews = this.news.slice(0, this.itemsToShow);
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.updateDisplayedNews();
    }
  }

  collapse(): void {
    this.isExpanded = false;
  }

  loadMore(): void {
    this.itemsToShow += this.increment;
    this.updateDisplayedNews();
  }

  get hasMoreNews(): boolean {
    return this.displayedNews.length < this.news.length;
  }
}