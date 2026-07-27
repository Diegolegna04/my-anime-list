import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-footer',
  imports: [
    RouterLink,
    AsyncPipe
  ],
  templateUrl: './footer.component.html',
  standalone: true,
  styleUrl: './footer.component.css'
})
export class FooterComponent {  
  constructor(public authService: AuthService) {}
}
