import { Component, inject } from '@angular/core';
import { HeaderComponent } from './features/header/header.component';
import { FooterComponent } from './features/footer/footer.component';
import { MainComponent } from './features/main/main.component';
import { CommonModule } from '@angular/common';
import { NodeContainerService } from './services/node-container.service';
import { MatCheckbox } from '@angular/material/checkbox';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    MainComponent,

    MatCheckbox,
  ],
  template: `
    <app-editor-header></app-editor-header>
    <app-editor-main></app-editor-main>
    <app-editor-footer></app-editor-footer>
  `,
  styles: [
    `
      :host {
        height: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class EditorComponent {
  nodeContainerService = inject(NodeContainerService);
  ngAfterViewInit() {
    // this.nodeContainerService.init();
  }
}
