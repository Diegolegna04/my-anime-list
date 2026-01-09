import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AnimeNews {
  mal_id: number;
  url: string;
  title: string;
  excerpt: string;
  date?: string;
  author_username?: string;
  author_url?: string;
  forum_url?: string;
  images?: {
    jpg?: {
      image_url?: string;
    }
  };
  comments?: number;
}

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news-list.component.html',
  styleUrls: ['./news-list.component.css']
})
export class NewsListComponent implements OnChanges {
  @Input() news: AnimeNews[] = [];

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