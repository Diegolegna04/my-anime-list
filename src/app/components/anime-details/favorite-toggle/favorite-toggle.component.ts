import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-favorite-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorite-toggle.component.html',
  styleUrls: ['./favorite-toggle.component.css']
})
export class FavoriteToggleComponent {
  @Input() isFavorite: boolean = false;
  @Input() canFavorite: boolean = true;
  
  @Output() favoriteToggled = new EventEmitter<void>();

  onToggle(): void {
    if (this.canFavorite) {
      this.favoriteToggled.emit();
    }
  }
}
