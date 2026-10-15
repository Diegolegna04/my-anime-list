import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnInit,
  OnDestroy,
  ViewChild,
  afterNextRender,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { AnimeService } from '../services/anime.service';
import { UserAnimeService } from '../services/userAnimeService.service';
import { AuthService, DEFAULT_PROFILE_IMAGE } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { TitleLanguageToggleComponent } from '../services/shared/title-language-toggle.component';
import { ProfileUpdate } from '../loginrequest';
import { FriendsPanelComponent } from './friends-panel/friends-panel.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [
    TitleLanguageToggleComponent,
    RouterLink,
    DragDropModule,
    FormsModule,
    FriendsPanelComponent,
    CdkTrapFocus,
  ],
  standalone: true,
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileImage: string = DEFAULT_PROFILE_IMAGE;
  username = '';
  email = '';
  totalAnimeCount = 0;
  watchedAnimeCount = 0;
  watchingAnimeCount = 0;
  planToWatchCount = 0;
  inEvidenza: any[] = [];
  animePreferiti = 0;
  titleLanguage: 'english' | 'original' = 'original';
  showOverlay = false;
  isLoading = true;

  showSettings = false;
  isSaving = false;
  pendingProfileImage: string | null = null;
  /** Chiusura chiesta con modifiche non salvate: si mostra la conferma */
  confirmDiscard = false;
  showNewPassword = false;
  showCurrentPassword = false;

  /** Pannello "Elimina account" aperto dentro le impostazioni */
  showDeleteAccount = false;
  deletePassword = '';
  isDeleting = false;

  @ViewChild('keepEditingButton') keepEditingButton?: ElementRef<HTMLButtonElement>;
  private focusBeforeConfirm: HTMLElement | null = null;

  settingsData = {
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  private userDataSubscription!: Subscription;

  constructor(
    private animeService: AnimeService,
    private cdr: ChangeDetectorRef,
    private userAnimeService: UserAnimeService,
    private authService: AuthService,
    private toastService: ToastService,
    private injector: Injector,
  ) {}

  async ngOnInit(): Promise<void> {
    this.titleLanguage =
      (localStorage.getItem('titleLanguage') as 'english' | 'original') || 'original';

    this.userDataSubscription = this.authService.userData$.subscribe((userData) => {
      if (userData) {
        this.username = userData.username || '';
        this.email = userData.email || '';
        this.profileImage = userData.profileImage || DEFAULT_PROFILE_IMAGE;
        this.settingsData.username = this.username;
        this.settingsData.email = this.email;
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
        this.loadInEvidenza(),
      ]);

      // "Tutti gli anime" = quelli iniziati (visti, in visione, in pausa, droppati):
      // i "Da vedere" hanno il loro riquadro e non si contano qui
      this.totalAnimeCount =
        (statsData.watchedCount || 0) +
        (statsData.watchingCount || 0) +
        (statsData.onHoldCount || 0) +
        (statsData.droppedCount || 0);
      this.planToWatchCount = statsData.planToWatchCount || 0;
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
        firstValueFrom(this.animeService.getAnimeById(userAnime.animeId)),
      );

      const responses = await Promise.all(animeDetailsPromises);

      return responses.map((res, index) => ({
        ...res.data,
        animeId: evidenzaData[index].animeId,
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

  /** Esc chiude il dialog come un clic fuori; con la conferma aperta torna alla modifica */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmDiscard) {
      this.keepEditing();
    } else if (this.showDeleteAccount) {
      this.cancelDeleteAccount();
    } else if (this.showOverlay) {
      this.requestClose();
    }
  }

  get emailChanged(): boolean {
    const email = this.settingsData.email.trim();
    return email !== '' && email !== this.email;
  }

  /** La password attuale serve per cambiare email o password */
  get needsCurrentPassword(): boolean {
    return !!this.settingsData.newPassword || this.emailChanged;
  }

  get hasUnsavedChanges(): boolean {
    return (
      !!this.pendingProfileImage ||
      this.settingsData.username.trim() !== this.username ||
      this.emailChanged ||
      !!(
        this.settingsData.newPassword ||
        this.settingsData.confirmPassword ||
        this.settingsData.currentPassword
      )
    );
  }

  /** Esc, clic fuori e "Chiudi": con modifiche non salvate chiede prima conferma */
  requestClose(): void {
    if (!this.hasUnsavedChanges) {
      this.closeOverlay();
      return;
    }
    this.focusBeforeConfirm = document.activeElement as HTMLElement | null;
    this.confirmDiscard = true;
    // Il focus va su "Continua a modificare" appena la conferma è nel DOM
    afterNextRender(() => this.keepEditingButton?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  /** Chiude la conferma e riporta il focus dove era (per esempio nel campo che si stava modificando) */
  keepEditing(): void {
    this.confirmDiscard = false;
    this.focusBeforeConfirm?.focus();
    this.focusBeforeConfirm = null;
  }

  discardChanges(): void {
    this.closeOverlay();
  }

  closeOverlay(): void {
    this.showOverlay = false;
    this.showSettings = false;
    this.confirmDiscard = false;
    this.showNewPassword = false;
    this.showCurrentPassword = false;
    this.cancelDeleteAccount();

    // Se c'era un'anteprima non salvata, ripristina l'immagine effettivamente persistita
    if (this.pendingProfileImage) {
      const currentUserData = this.authService.getCurrentUserData();
      this.profileImage = currentUserData?.profileImage || DEFAULT_PROFILE_IMAGE;
    }
    this.pendingProfileImage = null;

    this.settingsData.username = this.username;
    this.settingsData.email = this.email;
    this.settingsData.currentPassword = '';
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
  private async resizeImage(file: File, maxDimension = 512, quality = 0.8): Promise<string> {
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

        img.onerror = () => reject(new Error("Impossibile caricare l'immagine selezionata"));
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
      this.toastService.show("Errore durante l'elaborazione dell'immagine.", 'error');
    }
  }

  // Salvataggio dedicato per la sola immagine profilo,
  // così non dipende dal form impostazioni per essere persistita
  /** La foto salvata è personalizzata (non l'avatar predefinito) */
  get hasCustomProfileImage(): boolean {
    return !!this.authService.getCurrentUserData()?.profileImage && !this.pendingProfileImage;
  }

  /** Toglie la foto salvata e torna all'avatar predefinito */
  async removeProfileImage(): Promise<void> {
    this.isSaving = true;
    try {
      const response = await firstValueFrom(this.authService.updateProfile({ profileImage: '' }));
      this.authService.updateLocalUserData(response);
      this.profileImage = response.profileImage || DEFAULT_PROFILE_IMAGE;
      this.toastService.show('Foto profilo rimossa.', 'success');
    } catch {
      this.toastService.show('Impossibile rimuovere la foto. Riprova.', 'error');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  openDeleteAccount(): void {
    this.showDeleteAccount = true;
    this.deletePassword = '';
    this.focusAfterRender('delete-current-password');
  }

  cancelDeleteAccount(): void {
    if (!this.showDeleteAccount) return;
    this.showDeleteAccount = false;
    this.deletePassword = '';
    if (this.showOverlay) this.focusAfterRender('delete-account-open');
  }

  private focusAfterRender(elementId: string): void {
    afterNextRender(() => document.getElementById(elementId)?.focus(), { injector: this.injector });
  }

  /** Elimina l'account: AuthService pulisce lo stato locale e torna alla home */
  async deleteAccount(): Promise<void> {
    if (!this.deletePassword) {
      this.toastService.show('Inserisci la password attuale per confermare.', 'error');
      return;
    }

    this.isDeleting = true;
    try {
      await firstValueFrom(this.authService.deleteAccount(this.deletePassword));
      this.closeOverlay();
      this.toastService.show('Account eliminato. Ci dispiace vederti andare via.', 'success');
    } catch (error: any) {
      if (error.status === 403) {
        this.toastService.show('Password attuale errata.', 'error');
      } else if (error.status === 429) {
        this.toastService.show('Troppi tentativi. Riprova tra qualche minuto.', 'error');
      } else if (error.status === 401) {
        this.toastService.show('Sessione scaduta, effettua di nuovo il login.', 'error');
      } else {
        this.toastService.show("Errore durante l'eliminazione. Riprova.", 'error');
      }
    } finally {
      this.isDeleting = false;
      this.cdr.detectChanges();
    }
  }

  async saveProfileImage(): Promise<void> {
    if (!this.pendingProfileImage) return;

    this.isSaving = true;

    try {
      const response = await firstValueFrom(
        this.authService.updateProfile({ profileImage: this.pendingProfileImage }),
      );

      this.authService.updateLocalUserData(response);
      this.profileImage = response.profileImage || this.profileImage;
      this.pendingProfileImage = null;

      this.toastService.show('Immagine profilo aggiornata!', 'success');
    } catch {
      this.toastService.show("Errore durante il salvataggio dell'immagine. Riprova.", 'error');
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

    const emailChanged = this.emailChanged;
    if (this.needsCurrentPassword && !this.settingsData.currentPassword) {
      this.toastService.show('Inserisci la password attuale per confermare.', 'error');
      return;
    }

    const payload: ProfileUpdate = {};

    const username = this.settingsData.username.trim();
    if (username && username !== this.username) {
      payload.username = username;
    }

    if (emailChanged) {
      payload.email = this.settingsData.email.trim();
    }

    // La password viaggia in chiaro su HTTPS: è il backend a fare l'hash con bcrypt
    if (this.settingsData.newPassword) {
      payload.password = this.settingsData.newPassword;
    }
    if (payload.email || payload.password) {
      payload.currentPassword = this.settingsData.currentPassword;
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
      this.email = response.email || this.email;
      this.profileImage = response.profileImage || this.profileImage;
      this.pendingProfileImage = null;

      this.toastService.show(
        emailChanged
          ? 'Impostazioni aggiornate. Ti abbiamo mandato un link per confermare la nuova email.'
          : 'Impostazioni aggiornate con successo!',
        'success',
      );
      this.closeOverlay();
    } catch (error: any) {
      if (error.status === 409) {
        // Il backend dice se il conflitto è sull'email o sul nome utente
        this.toastService.show(error.error?.error || 'Username già in uso.', 'error');
      } else if (error.status === 403) {
        this.toastService.show('Password attuale errata.', 'error');
      } else if (error.status === 429) {
        this.toastService.show('Troppi tentativi. Riprova tra qualche minuto.', 'error');
      } else if (error.status === 401) {
        this.toastService.show('Sessione scaduta, effettua di nuovo il login.', 'error');
      } else if (error.status === 400) {
        this.toastService.show(error.error?.error || 'Dati non validi.', 'error');
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
      const updatedOrder = this.inEvidenza.map((anime) => anime.animeId);
      await firstValueFrom(this.userAnimeService.updateEvidenzaOrder(updatedOrder));
    } catch (error) {
      console.error("Errore nell'aggiornamento ordine:", error);
      moveItemInArray(this.inEvidenza, event.currentIndex, event.previousIndex);
    }

    this.cdr.detectChanges();
  }

  async refreshProfile(): Promise<void> {
    await this.loadProfileFromBackend();
  }
}
