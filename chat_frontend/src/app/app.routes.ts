import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Signup } from './components/signup/signup';
import { LayoutComponent } from './components/layout/layout.component';
import { NotFound } from './components/not-found/not-found';
import { redirectIfLoggedIn } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [redirectIfLoggedIn] },
  { path: 'signup', component: Signup, canActivate: [redirectIfLoggedIn] },
  { path: '', component: LayoutComponent },
  { path: '**', component: NotFound }
];
