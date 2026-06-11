import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toast = signal<Toast>({ message: '', type: 'info', show: false });

  private timer: any;

  show(message: string, type: 'success' | 'error' | 'info'): void {
    if (this.timer) clearTimeout(this.timer);
    this.toast.set({ message, type, show: true });
    this.timer = setTimeout(() => {
      this.toast.set({ ...this.toast(), show: false });
    }, 4000);
  }

  close(): void {
    if (this.timer) clearTimeout(this.timer);
    this.toast.set({ ...this.toast(), show: false });
  }
}
