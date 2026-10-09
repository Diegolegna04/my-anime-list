/** Tipi minimi delle risposte del proxy anime (formato Jikan): solo i campi che l'app legge. */

export interface JikanPagination {
  last_visible_page?: number;
  has_next_page?: boolean;
  current_page?: number;
}

export interface JikanItemResponse<T> {
  data: T;
}

export interface JikanListResponse<T> extends JikanItemResponse<T[]> {
  pagination?: JikanPagination;
}

export interface AnimeData {
  mal_id: number;
  title: string;
  title_english?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis?: string;
  score?: number;
  members?: number;
  episodes?: number;
  status: string;
  year?: number;
  genres: Array<{ name: string }>;
}

/** Elemento di /anime/{id}/recommendations: l'anime consigliato sta in `entry` */
export interface AnimeRecommendation {
  entry: unknown;
}

/** Elemento di /anime/{id}/streaming */
export interface AnimeStreamingLink {
  name: string;
  url: string;
}

/** Elemento di /anime/{id}/news */
export interface AnimeNews {
  mal_id: number;
  url: string;
  title: string;
  excerpt: string;
  date?: string;
  author_username?: string;
  author_url?: string;
  forum_url?: string;
  images?: { jpg?: { image_url?: string } };
  comments?: number;
}
