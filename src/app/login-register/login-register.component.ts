import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-login-register',
  imports: [
    FormsModule,
    NgClass
],
  templateUrl: './login-register.component.html',
  standalone: true,
  styleUrl: './login-register.component.css'
})
export class LoginRegisterComponent {
  isRegistering: boolean = false;

  loginData = {
    username: '',
    password: '',
  };

  registerData = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  };

  toggleRegister(): void {
    this.isRegistering = !this.isRegistering;
  }

  onLogin(): void {
    console.log('Login data:', this.loginData);
    // Logica per login
  }

  onRegister(): void {
    console.log('Register data:', this.registerData);
    // Logica per registrazione
  }
}
