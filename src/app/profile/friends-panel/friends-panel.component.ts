import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FriendService, FriendsOverview, friendErrorMessage } from '../../services/friend.service';
import { ToastService } from '../../services/toast.service';

/**
 * Sezione "Amici" del profilo: aggiungi per username, richieste ricevute e
 * inviate, elenco degli amici con il link alla loro lista.
 */
@Component({
  selector: 'app-friends-panel',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './friends-panel.component.html',
  styleUrls: ['./friends-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendsPanelComponent implements OnInit {
  overview: FriendsOverview = { friends: [], incoming: [], outgoing: [] };
  isLoading = true;
  loadError = false;

  username = '';
  isSending = false;
  sendError = '';

  /** Id dell'amicizia su cui c'è un'azione in corso (pulsanti spenti) */
  busyId: string | null = null;
  /** Amico per cui è aperta la conferma di rimozione */
  confirmRemoveId: string | null = null;

  constructor(
    private friendService: FriendService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  /** "2 ottobre 2026": Intl evita di registrare i dati del locale italiano solo per questo */
  formatDate(iso: string): string {
    const date = new Date(iso);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get isEmpty(): boolean {
    const o = this.overview;
    return !o.friends.length && !o.incoming.length && !o.outgoing.length;
  }

  load(): void {
    this.isLoading = true;
    this.loadError = false;
    this.friendService.getOverview().subscribe({
      next: (overview) => {
        this.overview = overview;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.loadError = true;
        this.cdr.markForCheck();
      }
    });
  }

  sendRequest(): void {
    const username = this.username.trim();
    if (!username || this.isSending) {
      this.sendError = username ? '' : 'Scrivi lo username del tuo amico';
      return;
    }
    this.isSending = true;
    this.sendError = '';
    this.friendService.sendRequest(username).subscribe({
      next: (request) => {
        this.isSending = false;
        this.username = '';
        this.toastService.show(`Richiesta inviata a ${request.username}`, 'success');
        // Se l'altro ci aveva già scritto, l'amicizia è già accettata: si ricarica tutto
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.isSending = false;
        this.sendError = friendErrorMessage(error, 'Non sono riuscito a inviare la richiesta. Riprova.');
        this.cdr.markForCheck();
      }
    });
  }

  accept(id: string, username: string): void {
    this.runAction(id, this.friendService.accept(id), `Ora tu e ${username} siete amici`, 'Non sono riuscito ad accettare la richiesta.');
  }

  decline(id: string): void {
    this.runAction(id, this.friendService.remove(id), 'Richiesta rifiutata', 'Non sono riuscito a rifiutare la richiesta.');
  }

  cancel(id: string): void {
    this.runAction(id, this.friendService.remove(id), 'Richiesta annullata', 'Non sono riuscito ad annullare la richiesta.');
  }

  askRemove(id: string): void {
    this.confirmRemoveId = id;
  }

  keepFriend(): void {
    this.confirmRemoveId = null;
  }

  remove(id: string, username: string): void {
    this.confirmRemoveId = null;
    this.runAction(id, this.friendService.remove(id), `${username} non è più tra i tuoi amici`, 'Non sono riuscito a rimuovere l\'amico.');
  }

  private runAction(id: string, action: ReturnType<FriendService['remove']>, success: string, failure: string): void {
    this.busyId = id;
    action.subscribe({
      next: () => {
        this.busyId = null;
        this.toastService.show(success, 'success');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.busyId = null;
        this.toastService.show(friendErrorMessage(error, failure + ' Riprova.'), 'error');
        this.load();
      }
    });
  }
}
