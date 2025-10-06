import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RatingSize = 'small' | 'medium' | 'large';
export type RatingColor = 'default' | 'gold' | 'red' | 'blue' | 'purple';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() maxRating: number = 10;
  @Input() readonly: boolean = false;
  @Input() disabled: boolean = false;
  @Input() size: RatingSize = 'medium';
  @Input() color: RatingColor = 'gold';
  @Input() showLabel: boolean = true;
  @Input() showHalfStars: boolean = false;
  @Input() allowClear: boolean = true;
  @Input() customLabels: string[] = [];
  
  @Output() ratingChanged = new EventEmitter<number>();
  @Output() ratingHovered = new EventEmitter<number>();

  // Stato interno per hover
  hoveredRating: number = 0;

  /**
   * Genera array di stelle da visualizzare
   */
  get stars(): number[] {
    return Array.from({ length: this.maxRating }, (_, i) => i + 1);
  }

  /**
   * Ottiene il rating da visualizzare (hover o effettivo)
   */
  get displayRating(): number {
    return this.hoveredRating > 0 ? this.hoveredRating : this.rating;
  }

  /**
   * Determina lo stato di una stella specifica
   */
  getStarState(starNumber: number): 'empty' | 'half' | 'full' {
    const rating = this.displayRating;
    
    if (starNumber <= rating) {
      return 'full';
    }
    
    if (this.showHalfStars && starNumber - 0.5 === rating) {
      return 'half';
    }
    
    return 'empty';
  }

  /**
   * Gestisce il click su una stella
   */
  onStarClick(starNumber: number): void {
    if (this.readonly || this.disabled) {
      return;
    }

    // Se clicco sulla stessa stella e allowClear è true, azzera
    if (this.allowClear && starNumber === this.rating) {
      this.rating = 0;
      this.ratingChanged.emit(0);
      return;
    }

    this.rating = starNumber;
    this.ratingChanged.emit(starNumber);
  }

  /**
   * Gestisce l'hover su una stella
   */
  onStarHover(starNumber: number): void {
    if (this.readonly || this.disabled) {
      return;
    }

    this.hoveredRating = starNumber;
    this.ratingHovered.emit(starNumber);
  }

  /**
   * Gestisce l'uscita dall'hover
   */
  onStarLeave(): void {
    if (this.readonly || this.disabled) {
      return;
    }

    this.hoveredRating = 0;
    this.ratingHovered.emit(0);
  }

  /**
   * Ottiene la classe CSS per una stella
   */
  getStarClass(starNumber: number): string {
    const state = this.getStarState(starNumber);
    const classes = ['rating-star', `star-${state}`, `size-${this.size}`, `color-${this.color}`];
    
    if (this.readonly) {
      classes.push('readonly');
    }
    
    if (this.disabled) {
      classes.push('disabled');
    }

    if (this.hoveredRating > 0 && starNumber <= this.hoveredRating) {
      classes.push('hovered');
    }
    
    return classes.join(' ');
  }

  /**
   * Ottiene il testo del label basato sul rating
   */
  get ratingLabel(): string {
    const rating = this.displayRating;
    
    // Usa custom labels se forniti
    if (this.customLabels.length > 0 && rating > 0 && rating <= this.customLabels.length) {
      return this.customLabels[rating - 1];
    }

    // Labels predefinite
    const defaultLabels: { [key: number]: string } = {
      1: 'Pessimo',
      2: 'Molto Male',
      3: 'Male',
      4: 'Insufficiente',
      5: 'Mediocre',
      6: 'Sufficiente',
      7: 'Discreto',
      8: 'Buono',
      9: 'Ottimo',
      10: 'Capolavoro'
    };

    return defaultLabels[rating] || 'Non valutato';
  }

  /**
   * Ottiene la classe CSS per il label
   */
  get labelClass(): string {
    const rating = this.displayRating;
    
    if (rating >= 8) return 'label-excellent';
    if (rating >= 6) return 'label-good';
    if (rating >= 4) return 'label-average';
    if (rating > 0) return 'label-poor';
    
    return 'label-none';
  }

  /**
   * Calcola la percentuale del rating
   */
  get ratingPercentage(): number {
    return (this.rating / this.maxRating) * 100;
  }

  /**
   * Verifica se è interattivo
   */
  get isInteractive(): boolean {
    return !this.readonly && !this.disabled;
  }

  /**
   * TrackBy function per ottimizzare ngFor
   */
  trackByStar(index: number, star: number): number {
    return star;
  }

  /**
   * Ottiene il titolo per accessibilità
   */
  getStarTitle(starNumber: number): string {
    if (this.readonly) {
      return `${starNumber} di ${this.maxRating}`;
    }
    return `Vota ${starNumber} ${starNumber === 1 ? 'stella' : 'stelle'}`;
  }

  /**
   * Gestisce la navigazione da tastiera
   */
  onKeyDown(event: KeyboardEvent, starNumber: number): void {
    if (this.readonly || this.disabled) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onStarClick(starNumber);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        if (starNumber < this.maxRating) {
          this.onStarClick(starNumber + 1);
        }
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        if (starNumber > 1) {
          this.onStarClick(starNumber - 1);
        }
        break;
      case 'Home':
        event.preventDefault();
        this.onStarClick(1);
        break;
      case 'End':
        event.preventDefault();
        this.onStarClick(this.maxRating);
        break;
      case 'Delete':
      case 'Backspace':
        if (this.allowClear) {
          event.preventDefault();
          this.rating = 0;
          this.ratingChanged.emit(0);
        }
        break;
    }
  }
}