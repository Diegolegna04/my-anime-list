import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgForOf, NgIf} from '@angular/common';
import {AnimeService} from '../services/anime.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [
    RouterLink,
    NgForOf,
    NgIf
  ],
  standalone: true
})
export class ProfileComponent implements OnInit {
  profileImage: string = 'assets/default-profile.png'; // Default profile image
  username: string = 'Utente';
  watchedAnimeCount: number = 0;
  inEvidenza: any[] = [];
  animePreferiti: number = 0;
  titleLanguage: 'english' | 'original' = 'original';

  constructor(private animeService: AnimeService, private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.loadProfile();
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
  }

  loadProfile(): void {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) this.profileImage = savedImage;

    const watchedAnime = JSON.parse(localStorage.getItem('animeStates') || '{}');
    this.watchedAnimeCount = Object.keys(watchedAnime).length;

    const inEvidenza = JSON.parse(localStorage.getItem('inEvidenza') || '[]');

    const preferiti = JSON.parse(localStorage.getItem('elencoPreferiti') || '{}');
    this.animePreferiti = Object.keys(preferiti).length;

    if (inEvidenza.length > 0) {
      this.inEvidenza = [];
      const requests = inEvidenza.map((id: string) =>
        this.animeService.getAnimeById(id).toPromise()
      );

      Promise.all(requests).then((responses) => {
        this.inEvidenza = responses.map((res) => res.data);
        this.cdr.detectChanges(); // 🔥 Forza l'aggiornamento della vista
      });
    }
  }

  changeProfileImage(): void {
    document.getElementById('profileImageInput')?.click();
  }

  uploadProfileImage(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileImage = e.target?.result as string;
        localStorage.setItem('profileImage', this.profileImage);
      };
      reader.readAsDataURL(file);
    }
  }

  goToDetails(id: number): void {
    this.animeService.goToDetails(id);
  }

  toggleTitleLanguage(): void {
    this.titleLanguage = this.titleLanguage === 'english' ? 'original' : 'english';
    localStorage.setItem('titleLanguage', this.titleLanguage);
    this.cdr.detectChanges(); // Forza l'aggiornamento della vista
  }

  getTitle(anime: any): string {
    if (!anime) return 'Titolo non disponibile';
    if (this.titleLanguage === 'english') {
      return anime.title_english || anime.title || 'Titolo non disponibile';
    } else {
      return anime.title || anime.title_english || 'Titolo non disponibile';
    }
  }
}
