import { Component, EventEmitter, Input, Output } from '@angular/core';

export type TitleLanguage = 'english' | 'original';

/**
 * Scelta della lingua dei titoli, uguale in tutte le pagine:
 * .segmented globale "Originale | Inglese". Emette solo quando il valore
 * cambia davvero, così i genitori possono continuare a usare il loro
 * toggleTitleLanguage().
 */
@Component({
  selector: 'app-title-language-toggle',
  standalone: true,
  template: `
    <div class="segmented" role="group" aria-label="Lingua dei titoli">
      <button type="button" [class.active]="value === 'original'" [attr.aria-pressed]="value === 'original'"
              [disabled]="disabled" (click)="select('original')">Originale</button>
      <button type="button" [class.active]="value === 'english'" [attr.aria-pressed]="value === 'english'"
              [disabled]="disabled" (click)="select('english')">Inglese</button>
    </div>
  `
})
export class TitleLanguageToggleComponent {
  @Input() value: TitleLanguage = 'original';
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<TitleLanguage>();

  select(language: TitleLanguage): void {
    if (language !== this.value) this.valueChange.emit(language);
  }
}
