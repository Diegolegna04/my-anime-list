import { Component, Input } from '@angular/core';
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
export class NewsListComponent {
  @Input() news: AnimeNews[] = [];
}