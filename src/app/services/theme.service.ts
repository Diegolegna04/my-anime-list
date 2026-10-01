import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>('light');
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    // Lo script inline in index.html ha già messo la classe giusta su <html>
    // prima del primo paint: si parte da lì, così non c'è nessun cambio visibile
    const root = document.documentElement;
    const initial: Theme = root.classList.contains('dark-theme') ? 'dark' : this.readSavedTheme();
    this.setTheme(initial);

    // Da qui in poi i cambi di tema sono animati (vedi .theme-ready in styles.css)
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('theme-ready')));
  }

  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // localStorage non disponibile (es. navigazione privata): il tema vale solo per questa visita
    }

    // Applica il tema al documento
    const root = document.documentElement;
    root.classList.toggle('dark-theme', theme === 'dark');
    root.classList.toggle('light-theme', theme === 'light');
    root.style.colorScheme = theme;
  }

  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private readSavedTheme(): Theme {
    try {
      return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
}
