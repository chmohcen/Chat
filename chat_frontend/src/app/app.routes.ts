import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Signup } from './components/signup/signup';
import { LayoutComponent } from './components/layout/layout.component';
import { NotFound } from './components/not-found/not-found';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: '', component: LayoutComponent },
  { path: '**', component: NotFound }
];
