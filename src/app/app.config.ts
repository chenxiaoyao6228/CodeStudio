import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Routes } from '@angular/router';
import { EditorComponent } from './editor/editor.component';
import { CommonModule } from '@angular/common';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

export const routes: Routes = [
  { path: '', component: EditorComponent },
  {
    path: 'edit',
    component: EditorComponent,
  },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    CommonModule,
    FormsModule,
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
  ],
};
