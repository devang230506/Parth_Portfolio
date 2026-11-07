import { Routes } from '@angular/router';
import { HomeComponent } from './layouts/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { 
    path: 'projects/:slug', 
    loadComponent: () => import('./features/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) 
  },
  { path: 'projects', redirectTo: '' },
  { path: 'demos', redirectTo: '' },
  { path: 'yt', redirectTo: '' },
  { path: '**', redirectTo: '' }
];
