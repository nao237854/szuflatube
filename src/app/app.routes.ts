import { Routes } from '@angular/router';
import { HomeComponent } from './home';
import { PlaylistComponent } from './playlist';
import { NoContentComponent } from './no-content';

export const ROUTES: Routes = [
  { path: '',      component: PlaylistComponent },
  { path: 'playlist',  component: PlaylistComponent },
  { path: '**',    component: NoContentComponent },
];
