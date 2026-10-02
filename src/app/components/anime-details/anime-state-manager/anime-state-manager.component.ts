import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type AnimeState = 'non visto' | 'in visione' | 'completato' | 'da vedere' | 'droppato' | 'in pausa';

/** Etichette mostrate all'utente (pulsanti e conferme); i valori interni restano invariati */
export const STATE_LABELS: Record<AnimeState, string> = {
  'non visto': 'Non in lista',
  'in visione': 'In visione',
  'completato': 'Completato',
  'da vedere': 'Da vedere',
  'droppato': 'Abbandonato',
  'in pausa': 'In pausa'
};

export interface StateOption {
  value: AnimeState;
  label: string;
  /** Classe Font Awesome, es. 'fa-eye-slash' */
  icon: string;
  /** Tono di stato: genera la classe CSS state-<color> */
  color: string;
  description: string;
}

@Component({
  selector: 'app-anime-state-manager',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './anime-state-manager.component.html',
  styleUrls: ['./anime-state-manager.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeStateManagerComponent {
  @Input() currentState: AnimeState = 'non visto';
  @Input() isLoading: boolean = false;
  @Input() disabled: boolean = false;
  /** Da sloggati i pulsanti sono spenti e un avviso invita ad accedere */
  @Input() loggedIn: boolean = true;
  
  @Output() stateChanged = new EventEmitter<AnimeState>();

  /**
   * Definizione degli stati disponibili con metadati
   */
  readonly stateOptions: StateOption[] = [
    {
      value: 'non visto',
      label: STATE_LABELS['non visto'],
      icon: 'fa-eye-slash',
      color: 'neutral',
      description: 'Rimuovi dalla tua lista'
    },
    {
      value: 'in visione',
      label: STATE_LABELS['in visione'],
      icon: 'fa-play-circle',
      color: 'watching',
      description: 'Stai guardando questo anime'
    },
    {
      value: 'completato',
      label: STATE_LABELS['completato'],
      icon: 'fa-check-circle',
      color: 'completed',
      description: 'Hai completato questo anime'
    }
  ];

  /**
   * Stati estesi (opzionali, attivabili con feature flag)
   */
  readonly extendedStates: StateOption[] = [
    {
      value: 'da vedere',
      label: STATE_LABELS['da vedere'],
      icon: 'fa-bookmark',
      color: 'plan',
      description: 'Pianificato per il futuro'
    },
    {
      value: 'droppato',
      label: STATE_LABELS['droppato'],
      icon: 'fa-times-circle',
      color: 'dropped',
      description: 'Hai abbandonato questo anime'
    },
    {
      value: 'in pausa',
      label: STATE_LABELS['in pausa'],
      icon: 'fa-pause-circle',
      color: 'on-hold',
      description: 'Temporaneamente sospeso'
    }
  ];

  /** Tutti gli stati, mostrati insieme (prima 3 erano nascosti sotto "Altri stati") */
  readonly allStates: StateOption[] = [...this.stateOptions, ...this.extendedStates];

  /**
   * Gestisce il click su un bottone di stato
   */
  onStateClick(state: AnimeState): void {
    if (this.isDisabled(state)) {
      return;
    }

    this.stateChanged.emit(state);
  }

  /**
   * Verifica se un bottone è disabilitato
   */
  isDisabled(state: AnimeState): boolean {
    return !this.loggedIn || this.disabled || this.isLoading || this.currentState === state;
  }

  /**
   * Verifica se uno stato è attualmente selezionato
   */
  isActive(state: AnimeState): boolean {
    return this.currentState === state;
  }

  /**
   * Ottiene la classe CSS per un bottone specifico
   */
  getButtonClass(state: AnimeState): string {
    const option = this.getStateOption(state);
    const classes = ['state-btn', `state-${option.color}`];
    
    if (this.isActive(state)) {
      classes.push('active');
    }
    
    if (this.isDisabled(state)) {
      classes.push('disabled');
    }
    
    return classes.join(' ');
  }

  /**
   * Ottiene l'oggetto StateOption per uno stato specifico
   */
  private getStateOption(state: AnimeState): StateOption {
    const allStates = [...this.stateOptions, ...this.extendedStates];
    return allStates.find(s => s.value === state) || this.stateOptions[0];
  }

  /**
   * TrackBy function per ottimizzare ngFor
   */
  trackByState(index: number, option: StateOption): string {
    return option.value;
  }

  /**
   * Ottiene il testo del tooltip per un bottone
   */
  getTooltip(state: AnimeState): string {
    if (this.isActive(state)) {
      return 'Stato attuale';
    }
    
    const option = this.getStateOption(state);
    return option.description;
  }

  /**
   * Gestisce animazioni al cambio di stato
   */
  get showLoadingIndicator(): boolean {
    return this.isLoading;
  }
}
