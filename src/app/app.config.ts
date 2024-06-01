import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Routes } from '@angular/router';
import { EditorComponent } from './editor/editor.component';

export const routes: Routes = [
  { path: '', component: EditorComponent }
];


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
};
