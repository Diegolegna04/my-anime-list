import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';
import { AnimeService } from '../services/anime.service';
import { UserAnimeService } from '../services/userAnimeService.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Subscription, firstValueFrom } from 'rxjs';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-user-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [
    RouterLink,
    DragDropModule,
    FormsModule
  ],
  standalone: true
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileImage: string = 'pfp-no-bg.png';
  username: string = '';
  watchedAnimeCount: number = 0;
  watchingAnimeCount: number = 0;
  inEvidenza: any[] = [];
  animePreferiti: number = 0;
  titleLanguage: 'english' | 'original' = 'original';
  showOverlay: boolean = false;
  isLoading: boolean = true;

  showSettings: boolean = false;
  isSaving: boolean = false;
  pendingProfileImage: string | null = null;

  settingsData = {
    username: '',
    newPassword: '',
    confirmPassword: ''
  };

  private userDataSubscription!: Subscription;

  constructor(
    private animeService: AnimeService,
    private cdr: ChangeDetectorRef,
    private userAnimeService: UserAnimeService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    this.titleLanguage = localStorage.getItem('titleLanguage') as 'english' | 'original' || 'original';

    this.userDataSubscription = this.authService.userData$.subscribe(userData => {
      if (userData) {
        this.username = userData.username || '';
        this.profileImage = userData.profileImage || this.profileImage;
        this.settingsData.username = this.username;
      }
    });

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
      const [statsData, evidenzaData] = await Promise.all([
        this.loadUserStats(),
        this.loadInEvidenza()
      ]);

      this.watchedAnimeCount = statsData.watchedCount || 0;
      this.watchingAnimeCount = statsData.watchingCount || 0;
      this.animePreferiti = statsData.favoritesCount || 0;

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
      return { watchedCount: 0, watchingCount: 0, favoritesCount: 0 };
    }
  }

  private async loadInEvidenza(): Promise<any[]> {
    try {
      const evidenzaData = await firstValueFrom(this.userAnimeService.getInEvidenza());

      if (!evidenzaData || evidenzaData.length === 0) {
        return [];
      }

      evidenzaData.sort((a: any, b: any) => a.evidenzaOrder - b.evidenzaOrder);

      const animeDetailsPromises = evidenzaData.map((userAnime: any) =>
        firstValueFrom(this.animeService.getAnimeById(userAnime.animeId))
      );

      const responses = await Promise.all(animeDetailsPromises);

      return responses.map((res, index) => ({
        ...res.data,
        animeId: evidenzaData[index].animeId
      }));

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
    this.showSettings = false;
  }

  closeOverlay(): void {
    this.showOverlay = false;
    this.showSettings = false;

    // Se c'era un'anteprima non salvata, ripristina l'immagine effettivamente persistita
    if (this.pendingProfileImage) {
      const currentUserData = this.authService.getCurrentUserData();
      this.profileImage = currentUserData?.profileImage || 'pfp-no-bg.png';
    }
    this.pendingProfileImage = null;

    this.settingsData.username = this.username;
    this.settingsData.newPassword = '';
    this.settingsData.confirmPassword = '';

    const input = document.getElementById('profileImageInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  openSettings(): void {
    this.showOverlay = true;
    this.showSettings = true;
  }

  // Ridimensiona e comprime l'immagine via canvas prima di convertirla in Base64,
  // così il documento MongoDB resta leggero indipendentemente dalla foto originale
  private async resizeImage(file: File, maxDimension: number = 512, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          let { width, height } = img;

          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Impossibile creare il contesto canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };

        img.onerror = () => reject(new Error('Impossibile caricare l\'immagine selezionata'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Impossibile leggere il file selezionato'));
      reader.readAsDataURL(file);
    });
  }

  async uploadProfileImage(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const resized = await this.resizeImage(file);
      this.profileImage = resized;
      this.pendingProfileImage = resized;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Errore nella compressione immagine:', error);
      this.toastService.show('Errore durante l\'elaborazione dell\'immagine.', 'error');
    }
  }

  // Salvataggio dedicato per la sola immagine profilo,
  // così non dipende dal form impostazioni per essere persistita
  async saveProfileImage(): Promise<void> {
    if (!this.pendingProfileImage) return;

    this.isSaving = true;

    try {
      const response = await firstValueFrom(
        this.authService.updateProfile({ profileImage: this.pendingProfileImage })
      );

      this.authService.updateLocalUserData(response);
      this.profileImage = response.profileImage || this.profileImage;
      this.pendingProfileImage = null;

      this.toastService.show('Immagine profilo aggiornata!', 'success');
    } catch (error) {
      this.toastService.show('Errore durante il salvataggio dell\'immagine. Riprova.', 'error');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async saveSettings(): Promise<void> {
    if (this.settingsData.newPassword || this.settingsData.confirmPassword) {
      if (this.settingsData.newPassword !== this.settingsData.confirmPassword) {
        this.toastService.show('Le password non coincidono.', 'error');
        return;
      }
      if (this.settingsData.newPassword.length < 6) {
        this.toastService.show('La password deve avere almeno 6 caratteri.', 'error');
        return;
      }
    }

    const payload: { username?: string; password?: string; profileImage?: string } = {};

    if (this.settingsData.username && this.settingsData.username !== this.username) {
      payload.username = this.settingsData.username;
    }

    if (this.settingsData.newPassword) {
      payload.password = CryptoJS.SHA256(this.settingsData.newPassword).toString();
    }

    if (this.pendingProfileImage) {
      payload.profileImage = this.pendingProfileImage;
    }

    if (Object.keys(payload).length === 0) {
      this.toastService.show('Nessuna modifica da salvare.', 'info');
      return;
    }

    this.isSaving = true;

    try {
      const response = await firstValueFrom(this.authService.updateProfile(payload));

      this.authService.updateLocalUserData(response);
      this.username = response.username || this.username;
      this.profileImage = response.profileImage || this.profileImage;
      this.pendingProfileImage = null;

      this.toastService.show('Impostazioni aggiornate con successo!', 'success');
      this.closeOverlay();
    } catch (error: any) {
      if (error.status === 409) {
        this.toastService.show('Username già in uso.', 'error');
      } else {
        this.toastService.show('Errore durante il salvataggio. Riprova.', 'error');
      }
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
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
      const updatedOrder = this.inEvidenza.map(anime => anime.animeId);
      await firstValueFrom(this.userAnimeService.updateEvidenzaOrder(updatedOrder));
    } catch (error) {
      console.error('Errore nell\'aggiornamento ordine:', error);
      moveItemInArray(this.inEvidenza, event.currentIndex, event.previousIndex);
    }

    this.cdr.detectChanges();
  }

  scrollToEvidenzaSection(): void {
    const evidenzaSection = document.getElementById('inEvidenzaSection');
    if (evidenzaSection) {
      evidenzaSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async refreshProfile(): Promise<void> {
    await this.loadProfileFromBackend();
  }
}
