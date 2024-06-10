import { Component, Inject, inject } from '@angular/core';
import { HeaderComponent } from './features/header/header.component';
import { FooterComponent } from './features/footer/footer.component';
import { MainComponent } from './features/main/main.component';
import { CommonModule } from '@angular/common';
import { NodeContainerService } from './services/node-container.service';
import { MatCheckbox } from '@angular/material/checkbox';
import { ActivatedRoute } from '@angular/router';
import { GithubFileService } from '@app/_shared/services/github.file.service';

export interface IRouteParams {
  terminal: string;
  pkgManager?: 'npm' | 'yarn' | 'pnpm';
  templateName?: string;
  githubPath?: string; // zipFile or  folder
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
  ngOnInit(): void {
    this.route.queryParams.subscribe((params: any) => {
      this.routeParams = params;
    });
  }
  async ngAfterViewInit() {
    this.nodeContainerService.init(this.routeParams);
  }
}
