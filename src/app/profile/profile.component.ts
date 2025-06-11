import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import { DragDropModule, moveItemInArray, CdkDragDrop} from '@angular/cdk/drag-drop';
import {AnimeService} from '../services/anime.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [
    RouterLink,
    DragDropModule
],
  standalone: true
})
export class ProfileComponent implements OnInit {
  profileImage: string = 'assets/default-profile.png';
  username: string = 'Utente';
  watchedAnimeCount: number = 0;
  inEvidenza: any[] = [];
  animePreferiti: number = 0;
  titleLanguage: 'english' | 'original' = 'original';
  showOverlay: boolean = false;

  constructor(private animeService: AnimeService, private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.loadProfile();
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    window.scroll(0, 0);
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
        this.cdr.detectChanges();
      });
    }
  }

  changeProfileImage(): void {
    const input = document.getElementById('profileImageInput');
    if (input) input.click();
  }

  openOverlay(): void {
    this.showOverlay = true;
  }

  closeOverlay(): void {
    this.showOverlay = false;
    const input = document.getElementById('profileImageInput') as HTMLInputElement;
    if (input) input.value = '';
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

  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.inEvidenza, event.previousIndex, event.currentIndex);

    const updatedInEvidenzaIds = this.inEvidenza.map(anime => anime.mal_id.toString());
    localStorage.setItem('inEvidenza', JSON.stringify(updatedInEvidenzaIds));

    this.cdr.detectChanges();
  }

  scrollToEvidenzaSection(): void {
    const evidenzaSection = document.getElementById('inEvidenzaSection');
    if (evidenzaSection) {
      evidenzaSection.scrollIntoView({behavior: 'smooth'});
    }
  }
}
