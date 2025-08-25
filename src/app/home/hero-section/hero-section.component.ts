import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css'],
  imports: [RouterLink],
})
export class HeroSectionComponent {
  @Input() currentSeason: string | undefined;
  @Output() topAnimeClick = new EventEmitter<void>();

  onTopAnimeClick(): void {
    this.topAnimeClick.emit();
  }
}
