import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Routes } from '@angular/router';
import { EditorComponent } from './editor/editor.component';
import { CommonModule } from '@angular/common';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';
import { RedirectGuard } from './_shared/service/redirect-guard';
import { PcOnlyGuard } from './_shared/service/device-guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [RedirectGuard, PcOnlyGuard] },
  {
    path: 'edit',
    component: EditorComponent,
    canActivate: [PcOnlyGuard],
  },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes),
    CommonModule,
    FormsModule,
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    RedirectGuard,
  ],
};
