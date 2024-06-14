import { Component, inject } from '@angular/core';
import { HeaderComponent } from './features/header/header.component';
import { FooterComponent } from './features/footer/footer.component';
import { MainComponent } from './features/main/main.component';
import { CommonModule } from '@angular/common';
import { NodeContainerService } from './services/node-container.service';
import { MatCheckbox } from '@angular/material/checkbox';
import { ActivatedRoute } from '@angular/router';
import { FileLoaderFactory } from './services/file-loader/loader-factory.service';
import { EditorStateService } from './services/editor-state.service';
import { StartupPhase } from './constants';

export interface IRouteParams {
  terminal: string;
  pkgManager?: 'npm' | 'yarn' | 'pnpm';
  source?: string; // mock, local, template name, github folder , zip url
}

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
  routeParams: IRouteParams = {
    terminal: 'dev',
  };
  route = inject(ActivatedRoute);
  nodeContainerService = inject(NodeContainerService);
  fileLoaderService = inject(FileLoaderFactory);
  editorStateService = inject(EditorStateService);
  ngOnInit(): void {
    // support direct access from route params
    this.route.queryParams.subscribe((params: any) => {
      this.routeParams = params;
    });
  }
  async ngAfterViewInit() {
    // local files have already been loaded by user picker
    if (!(this.routeParams.source === 'local')) {
      this.editorStateService.setPhase(StartupPhase.LOADING_FILES);
      try {
        const fileTree = await this.fileLoaderService.loadFiles({
          source: this.routeParams.source || 'mock',
        });
        this.editorStateService.setFileTree(fileTree);
      } catch (error) {
        console.error('Failed to load files: ', error);
        throw error;
      }
    }

    await this.nodeContainerService.init(this.routeParams);
  }
}
