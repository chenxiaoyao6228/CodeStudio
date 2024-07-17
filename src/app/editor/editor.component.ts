import { ShortcutService } from './services/shortcut';
import { AfterViewInit, Component, inject, OnDestroy } from '@angular/core';
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
import { CodeEditorService } from './features/main/edit/code-editor/code-editor.service';
import { TypeLoaderService } from './features/main/edit/code-editor/type-loader.service';
import { TemplateModalComponent } from '@app/_shared/components/template-modal/template-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../_shared/components/confirm-dialog/confirm-dialog';
import { ShortcutDialogComponent } from './components/shortcut-dialog.component';

export interface IRouteParams {
  source: string; // mock, local, template name, github folder , zip url
  terminal?: string;
  pkgManager?: 'npm' | 'yarn' | 'pnpm';
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
    TemplateModalComponent,
    ShortcutDialogComponent,
  ],
  providers: [],
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
export class EditorComponent implements AfterViewInit, OnDestroy {
  routeParams: IRouteParams = {
    source: 'local',
  };
  readonly dialog = inject(MatDialog);
  route = inject(ActivatedRoute);
  nodeContainerService = inject(NodeContainerService);
  fileLoaderService = inject(FileLoaderFactory);
  editorStateService = inject(EditorStateService);
  typeLoadingService = inject(TypeLoaderService);
  codeEditorService = inject(CodeEditorService);
  shortcutService = inject(ShortcutService);

  async ngAfterViewInit() {
    // support direct access from route params
    this.route.queryParams.subscribe((params: any) => {
      this.routeParams = params;
      this.handleQueryParamsChange(this.routeParams);
    });
  }

  async handleQueryParamsChange(params: IRouteParams) {
    if (!params.source) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message:
            'Source is required in the query params to passed to access this page, go to the page page to choose a template or import a project.',
        },
      });
      // throw new Error('Source is required');
    }
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
    try {
      await this.nodeContainerService.init(params);
    } catch (error) {
      console.log('Failed to init webcontainer', error);
    }
  }

  ngOnDestroy() {
    this.shortcutService.cleanup();
  }
}
