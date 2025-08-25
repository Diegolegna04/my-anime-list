import {ChangeDetectorRef, Component, OnInit, OnDestroy} from '@angular/core';
import {RouterLink} from '@angular/router';
import { DragDropModule, moveItemInArray, CdkDragDrop} from '@angular/cdk/drag-drop';
import {AnimeService} from '../services/anime.service';
import { UserAnimeService } from '../services/userAnimeService.service';
import {AuthService} from '../services/auth.service';
import { Subscription, firstValueFrom } from 'rxjs';

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

  constructor(
    private animeService: AnimeService, 
    private cdr: ChangeDetectorRef,
    private userAnimeService: UserAnimeService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';
    
    // Sottoscrivi ai dati dell'utente
    this.userDataSubscription = this.authService.userData$.subscribe(userData => {
      if (userData) {
        this.username = userData.username || '';
        this.profileImage = userData.profileImage || this.profileImage;
      }
    });

    // Attendi il caricamento di tutti i dati dal backend
    await this.loadProfileFromBackend();
    
    window.scroll(0, 0);
  }

  ngOnDestroy(): void {
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
  }

  async loadProfileFromBackend(): Promise<void> {
    this.isLoading = true;

    try {
      // Carica tutti i dati in parallelo
      const [statsData, evidenzaData] = await Promise.all([
        this.loadUserStats(),
        this.loadInEvidenza()
      ]);

      // Aggiorna le statistiche
      this.watchedAnimeCount = statsData.watchedCount || 0;
      this.animePreferiti = statsData.favoritesCount || 0;

      // Aggiorna gli anime in evidenza
      this.inEvidenza = evidenzaData;

    } catch (error) {
      console.error('Errore nel caricamento dei dati del profilo:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadUserStats(): Promise<any> {
    try {
      return await firstValueFrom(this.userAnimeService.getUserStats());
    } catch (error) {
      console.error('Errore nel caricamento statistiche:', error);
      return { watchedCount: 0, favoritesCount: 0 };
    }
  }

  private async loadInEvidenza(): Promise<any[]> {
    try {
      const evidenzaData = await firstValueFrom(this.userAnimeService.getInEvidenza());
      
      if (!evidenzaData || evidenzaData.length === 0) {
        return [];
      }

      // Ordina per evidenzaOrder
      evidenzaData.sort((a: any, b: any) => a.evidenzaOrder - b.evidenzaOrder);
      
      // Recupera i dettagli degli anime dall'API esterna
      const animeDetailsPromises = evidenzaData.map((userAnime: any) =>
        firstValueFrom(this.animeService.getAnimeById(userAnime.animeId))
      );

      const responses = await Promise.all(animeDetailsPromises);
      return responses.map((res) => res.data);

    } catch (error) {
      console.error('Errore nel caricamento anime in evidenza:', error);
      return [];
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

  async drop(event: CdkDragDrop<any[]>): Promise<void> {
    moveItemInArray(this.inEvidenza, event.previousIndex, event.currentIndex);

    try {
      // Aggiorna l'ordine nel backend
      const updatedOrder = this.inEvidenza.map(anime => anime.mal_id);
      await firstValueFrom(this.userAnimeService.updateEvidenzaOrder(updatedOrder));
      console.log('Ordine aggiornato con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento ordine:', error);
      // Ripristina l'ordine originale in caso di errore
      moveItemInArray(this.inEvidenza, event.currentIndex, event.previousIndex);
    }

    this.cdr.detectChanges();
  }

  scrollToEvidenzaSection(): void {
    const evidenzaSection = document.getElementById('inEvidenzaSection');
    if (evidenzaSection) {
      evidenzaSection.scrollIntoView({behavior: 'smooth'});
    }
  }

  async refreshProfile(): Promise<void> {
    await this.loadProfileFromBackend();
  }
}
