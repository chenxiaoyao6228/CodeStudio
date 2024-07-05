import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from './components/header/header.component';
import { MatDialog } from '@angular/material/dialog';
import { TemplateModalComponent } from '../_shared/components/template-modal/template-modal.component';
import { HomeService } from './home.service';
import {
  IGistItem,
  GistService,
  parseDescription,
} from '../_shared/service/gist.service';
import { formatTime } from '../_shared/utils';
import { PROJECT_KEY } from '../_shared/constant';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileLoaderFactory } from '../editor/services/file-loader/loader-factory.service';
import { EditorStateService } from '../editor/services/editor-state.service';
import { GithubUrlDialogComponent } from '../_shared/components/github-url-dialog/github-url-dialog.component';

export interface Project {
  id: string;
  title: string;
  description: string;
  updated: string;
  gistUrl: string;
  metaUrl: string;
  projectZipUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    HeaderComponent,
    MatProgressSpinnerModule,
  ],
})
export class HomeComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);
  homeService = inject(HomeService);
  gistService = inject(GistService);
  fileLoaderService = inject(FileLoaderFactory);
  editorStateService = inject(EditorStateService);
  router = inject(Router);
  loading = signal(false);

  displayedColumns: string[] = ['title', 'description', 'updated', 'operation'];
  dataSource = new MatTableDataSource<Project>([]);

  operations = [
    {
      title: 'Create Project',
      desc: 'from starter templates',
      icon: 'add',
      imgClass: 'template',
      action: this.openTemplateModal.bind(this),
    },
    {
      title: 'Import Project',
      desc: 'from GitHub repo folder',
      icon: 'add',
      imgClass: 'github',
      action: this.importProject.bind(this),
    },
    {
      title: 'Open local folder',
      desc: 'from your computer',
      icon: 'add',
      imgClass: 'local',
      action: this.openLocalFolder.bind(this),
    },
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  ngOnInit() {
    this.dataSource.paginator = this.paginator;

    this.getList();
  }

  async getList() {
    try {
      this.loading.set(true);
      const res = await this.homeService.getList();
      if (res.success) {
        const isCodeStudioProject = (item: IGistItem) => {
          return item && item.files && item.files[`${PROJECT_KEY}.json`];
        };

        //@ts-ignore
        const _data = res.data
          .filter(isCodeStudioProject)
          .map((item: IGistItem) => transformData(item));

        this.dataSource.data = _data;

        this.loading.set(false);

        function transformData(item: IGistItem) {
          const descriptionObj = item.description
            ? parseDescription(item.description)
            : {};
          return {
            id: item.id,
            title: descriptionObj['title'],
            description: descriptionObj['description'],
            updated: formatTime(item.updated_at),
            gistUrl: item.url,
            metaUrl: item.files['codestudio.json']
              ? item.files['codestudio.json'].raw_url
              : '',
            // FIXME:
            projectZipUrl: item.files['project']
              ? item.files['project'].raw_url
              : '',
          } as Project;
        }
      }
    } catch (error) {
      this.loading.set(false);
      console.log('error', error);
    }
  }

  openTemplateModal() {
    this.dialog.open(TemplateModalComponent);
  }

  importProject() {
    const dialogRef = this.dialog.open(GithubUrlDialogComponent, {
      width: '400px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.openEdit({
          source: result,
          terminal: 'dev', // TODO:
        });
      }
    });
  }

  openEdit(params: { source: string; terminal: string }) {
    const queryString = `source=${encodeURIComponent(
      params.source
    )}&terminal=${encodeURIComponent(params.terminal)}`;
    window.location.href = `${window.location.origin}/edit/?${queryString}`;
  }

  async openLocalFolder() {
    const fileTree = await this.fileLoaderService.loadFiles({
      source: 'local',
    });
    this.editorStateService.setFileTree(fileTree);

    // TODO: 检测命令
    window.location.href = `${window.location.origin}/edit/?source=local&terminal=dev`;
  }

  editProject(project: Project) {
    const queryString = `source=${encodeURIComponent(
      project.projectZipUrl
    )}&terminal=${encodeURIComponent('dev')}`;
    // FIXME: router.navigate has some issue, will fix it later ?
    window.location.href = `${window.location.origin}/edit/?${queryString}`;
  }

  async deleteProject(project: Project) {
    try {
      this.loading.set(true);
      await this.gistService.deleteGist({
        gistId: project.id,
      });
      this.snackBar.open('Project deleted successfully', 'Close', {
        duration: 3000,
      });
      console.log('Delete project:', project);
      this.getList().then(() => {
        this.loading.set(false);
      });
    } catch (error) {
      console.log('error', error);
      this.loading.set(false);
      this.snackBar.open('Failed to delete project', 'Close', {
        duration: 3000,
      });
    }
  }
}
