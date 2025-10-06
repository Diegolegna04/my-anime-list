import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-episodes-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './episodes-tracker.component.html',
  styleUrls: ['./episodes-tracker.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EpisodesTrackerComponent implements OnInit {
  @Input() currentEpisodes: number = 0;
  @Input() totalEpisodes: number = 0;
  @Input() disabled: boolean = false;
  @Input() showQuickActions: boolean = true;
  
  @Output() episodesUpdated = new EventEmitter<number>();

  // Stato interno per gestire l'input
  localEpisodes: number = 0;
  
  ngOnInit(): void {
    this.localEpisodes = this.currentEpisodes;
  }

  /**
   * Calcola la percentuale di completamento
   */
  get progressPercentage(): number {
    if (!this.totalEpisodes || this.totalEpisodes === 0) {
      return 0;
    }
    
    const percentage = (this.currentEpisodes / this.totalEpisodes) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  /**
   * Determina la classe CSS della progress bar in base alla percentuale
   */
  get progressBarClass(): string {
    const percentage = this.progressPercentage;
    
    if (percentage >= 100) return 'progress-complete';
    if (percentage >= 75) return 'progress-high';
    if (percentage >= 50) return 'progress-medium';
    if (percentage >= 25) return 'progress-low';
    
    return 'progress-start';
  }

  /**
   * Ottiene il messaggio di stato testuale
   */
  get statusMessage(): string {
    if (this.currentEpisodes === 0) {
      return 'Inizia a guardare!';
    }
    
    if (this.progressPercentage >= 100) {
      return 'Serie completata! 🎉';
    }
    
    const remaining = this.totalEpisodes - this.currentEpisodes;
    
    if (remaining === 1) {
      return 'Ultimo episodio! 🔥';
    }
    
    if (remaining <= 3) {
      return `Solo ${remaining} episodi alla fine!`;
    }
    
    return `Ancora ${remaining} episodi`;
  }

  /**
   * Ottiene l'icona appropriata per lo stato
   */
  get statusIcon(): string {
    if (this.progressPercentage >= 100) return '🎉';
    if (this.progressPercentage >= 75) return '🔥';
    if (this.progressPercentage >= 50) return '💪';
    if (this.progressPercentage >= 25) return '📺';
    
    return '▶️';
  }

  /**
   * Gestisce il cambio di valore nell'input
   */
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = parseInt(input.value, 10);

    // Validazione
    if (isNaN(value) || value < 0) {
      value = 0;
    } else if (this.totalEpisodes > 0 && value > this.totalEpisodes) {
      value = this.totalEpisodes;
    }

    this.localEpisodes = value;
  }

  /**
   * Emette l'evento quando l'utente finisce di modificare (blur)
   */
  onInputBlur(): void {
    if (this.localEpisodes !== this.currentEpisodes) {
      this.episodesUpdated.emit(this.localEpisodes);
    }
  }

  /**
   * Gestisce il keypress Enter per salvare immediatamente
   */
  onInputKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    }
  }

  /**
   * Quick action: incrementa di 1
   */
  incrementEpisode(): void {
    if (this.disabled || this.currentEpisodes >= this.totalEpisodes) {
      return;
    }
    
    const newValue = this.currentEpisodes + 1;
    this.localEpisodes = newValue;
    this.episodesUpdated.emit(newValue);
  }

  /**
   * Quick action: decrementa di 1
   */
  decrementEpisode(): void {
    if (this.disabled || this.currentEpisodes <= 0) {
      return;
    }
    
    const newValue = this.currentEpisodes - 1;
    this.localEpisodes = newValue;
    this.episodesUpdated.emit(newValue);
  }

  /**
   * Quick action: segna come completato
   */
  markAsComplete(): void {
    if (this.disabled || this.currentEpisodes >= this.totalEpisodes) {
      return;
    }
    
    this.localEpisodes = this.totalEpisodes;
    this.episodesUpdated.emit(this.totalEpisodes);
  }

  /**
   * Quick action: reset a 0
   */
  resetProgress(): void {
    if (this.disabled || this.currentEpisodes === 0) {
      return;
    }
    
    this.localEpisodes = 0;
    this.episodesUpdated.emit(0);
  }

  /**
   * Verifica se il pulsante + è disabilitato
   */
  get isIncrementDisabled(): boolean {
    return this.disabled || this.currentEpisodes >= this.totalEpisodes;
  }

  /**
   * Verifica se il pulsante - è disabilitato
   */
  get isDecrementDisabled(): boolean {
    return this.disabled || this.currentEpisodes <= 0;
  }

  /**
   * Verifica se il pulsante "Completa" è disabilitato
   */
  get isCompleteDisabled(): boolean {
    return this.disabled || this.currentEpisodes >= this.totalEpisodes;
  }

  /**
   * Verifica se il pulsante "Reset" è disabilitato
   */
  get isResetDisabled(): boolean {
    return this.disabled || this.currentEpisodes === 0;
  }

  /**
   * Verifica se mostrare il badge "Nuovo episodio"
   */
  get shouldShowNewEpisodeBadge(): boolean {
    return this.progressPercentage > 0 && this.progressPercentage < 100;
  }
}