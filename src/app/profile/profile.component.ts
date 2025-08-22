import {ChangeDetectorRef, Component, OnInit, OnDestroy} from '@angular/core';
import {RouterLink} from '@angular/router';
import { DragDropModule, moveItemInArray, CdkDragDrop} from '@angular/cdk/drag-drop';
import {AnimeService} from '../services/anime.service';
import { UserAnimeService } from '../services/userAnimeService.service';
import {AuthService} from '../services/auth.service';
import { Subscription } from 'rxjs';

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
export class ProfileComponent implements OnInit, OnDestroy {
  profileImage: string = 'pfp-no-bg.png';
  username: string = '';
  watchedAnimeCount: number = 0;
  inEvidenza: any[] = [];
  animePreferiti: number = 0;
  titleLanguage: 'english' | 'original' = 'original';
  showOverlay: boolean = false;
  isLoading: boolean = true;

  private userDataSubscription!: Subscription;
  private userStatsSubscription!: Subscription;
  private inEvidenzaSubscription!: Subscription;

  constructor(
    private animeService: AnimeService, 
    private cdr: ChangeDetectorRef,
    private userAnimeService: UserAnimeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    
    // Sottoscrivi ai dati dell'utente
    this.userDataSubscription = this.authService.userData$.subscribe(userData => {
      if (userData) {
        this.username = userData.username || '';
        this.profileImage = userData.profileImage || this.profileImage;
      }
    });

    // Carica i dati dal backend
    this.loadProfileFromBackend();
    
    window.scroll(0, 0);
  }

  ngOnDestroy(): void {
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
    if (this.userStatsSubscription) {
      this.userStatsSubscription.unsubscribe();
    }
    if (this.inEvidenzaSubscription) {
      this.inEvidenzaSubscription.unsubscribe();
    }
  }

  loadProfileFromBackend(): void {
    this.isLoading = true;

    // Carica statistiche
    this.userStatsSubscription = this.userAnimeService.getUserStats().subscribe({
      next: (stats) => {
        this.watchedAnimeCount = stats.watchedCount || 0;
        this.animePreferiti = stats.favoritesCount || 0;
        this.userAnimeService.userStats$.subscribe(s => this.userStatsSubscription = s);
      },
      error: (error) => {
        console.error('Errore nel caricamento statistiche:', error);
      }
    });

    // Carica anime in evidenza
    this.inEvidenzaSubscription = this.userAnimeService.getInEvidenza().subscribe({
      next: (evidenzaData) => {
        if (evidenzaData && evidenzaData.length > 0) {
          // Ordina per evidenzaOrder
          evidenzaData.sort((a: any, b: any) => a.evidenzaOrder - b.evidenzaOrder);
          
          // Recupera i dettagli degli anime dall'API esterna
          const requests = evidenzaData.map((userAnime: any) =>
            this.animeService.getAnimeById(userAnime.animeId).toPromise()
          );

          Promise.all(requests).then((responses) => {
            this.inEvidenza = responses.map((res) => res.data);
            this.isLoading = false;
            this.cdr.detectChanges();
          }).catch((error) => {
            console.error('Errore nel caricamento dettagli anime:', error);
            this.isLoading = false;
          });
        } else {
          this.inEvidenza = [];
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Errore nel caricamento anime in evidenza:', error);
        this.isLoading = false;
      }
    });
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
    this.cdr.detectChanges();
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

    // Aggiorna l'ordine nel backend
    const updatedOrder = this.inEvidenza.map(anime => anime.mal_id);
    this.userAnimeService.updateEvidenzaOrder(updatedOrder).subscribe({
      next: () => {
        console.log('Ordine aggiornato con successo');
      },
      error: (error) => {
        console.error('Errore nell\'aggiornamento ordine:', error);
        // Ripristina l'ordine originale in caso di errore
        moveItemInArray(this.inEvidenza, event.currentIndex, event.previousIndex);
      }
    });

    this.cdr.detectChanges();
  }

  scrollToEvidenzaSection(): void {
    const evidenzaSection = document.getElementById('inEvidenzaSection');
    if (evidenzaSection) {
      evidenzaSection.scrollIntoView({behavior: 'smooth'});
    }
  }

  refreshProfile(): void {
    this.loadProfileFromBackend();
  }
}