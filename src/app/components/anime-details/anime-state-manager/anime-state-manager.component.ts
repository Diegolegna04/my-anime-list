import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AnimeState = 'non visto' | 'in visione' | 'completato' | 'da vedere' | 'droppato' | 'in pausa';

export interface StateOption {
  value: AnimeState;
  label: string;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-anime-state-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './anime-state-manager.component.html',
  styleUrls: ['./anime-state-manager.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeStateManagerComponent {
  @Input() currentState: AnimeState = 'non visto';
  @Input() isLoading: boolean = false;
  @Input() disabled: boolean = false;
  
  @Output() stateChanged = new EventEmitter<AnimeState>();

  /**
   * Definizione degli stati disponibili con metadati
   */
  readonly stateOptions: StateOption[] = [
    {
      value: 'non visto',
      label: 'Non Visto',
      icon: '👁️',
      color: 'grey',
      description: 'Rimuovi dalla tua lista'
    },
    {
      value: 'in visione',
      label: 'In Visione',
      icon: '▶️',
      color: 'blue',
      description: 'Stai guardando questo anime'
    },
    {
      value: 'completato',
      label: 'Completato',
      icon: '✅',
      color: 'orange',
      description: 'Hai completato questo anime'
    }
  ];

  /**
   * Stati estesi (opzionali, attivabili con feature flag)
   */
  readonly extendedStates: StateOption[] = [
    {
      value: 'da vedere',
      label: 'Da Vedere',
      icon: '📋',
      color: 'purple',
      description: 'Pianificato per il futuro'
    },
    {
      value: 'droppato',
      label: 'Droppato',
      icon: '❌',
      color: 'red',
      description: 'Hai abbandonato questo anime'
    },
    {
      value: 'in pausa',
      label: 'In Pausa',
      icon: '⏸️',
      color: 'yellow',
      description: 'Temporaneamente sospeso'
    }
  ];

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
    return this.disabled || this.isLoading || this.currentState === state;
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
