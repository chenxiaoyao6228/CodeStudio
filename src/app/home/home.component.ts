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
import { LocalStorageService } from '../_shared/service/local-storage.service';
import { GitHubTokenDialogComponent } from '../_shared/components/github-token-dialog/github-token-dialog.component';
import {
  META_DATA__KEY,
  PROJECT_CODE_KEY,
} from '../editor/services/file-saver/storage/gist';

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
  localStorageService = inject(LocalStorageService);
  router = inject(Router);
  loading = signal(false);
  loadingIndex = signal(-1);

  displayedColumns: string[] = [
    'title',
    // 'description',
    'updated',
    'operation',
  ];
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
    const token = await this.localStorageService.getItem('githubToken');
    if (!token) {
      this.dataSource.data = [];
      return;
    }
    try {
      this.loading.set(true);
      const res = await this.homeService.getList();
      if (res.success) {
        const isCodeStudioProject = (item: IGistItem) => {
          return item && item.files && item.files[`${PROJECT_KEY}.json`];
        };

        // @ts-expect-error skip
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
            metaUrl: item.files[META_DATA__KEY]
              ? item.files[META_DATA__KEY].raw_url
              : '',
            projectZipUrl: item.files[PROJECT_CODE_KEY]
              ? item.files[PROJECT_CODE_KEY].raw_url
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
    this.dialog.open(TemplateModalComponent, {
      width: 'min(95vw - 48px, 980px)',
      minHeight: '382px',
      maxWidth: '60vw',
    });
  }

  openTokenModal() {
    const tokenDialogRef = this.dialog.open(GitHubTokenDialogComponent, {
      width: '400px',
    });
    tokenDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.localStorageService.setItem('githubToken', result);
        this.getList();
      }
    });
  }

  importProject() {
    this.loadingIndex.set(1);
    const dialogRef = this.dialog.open(GithubUrlDialogComponent, {
      width: '400px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.openEdit({
          source: result,
        });
      }
      this.loadingIndex.set(-1);
    });
  }

  openEdit(params: {
    source: string;
    terminal?: string;
    editId?: string;
    editName?: string;
  }) {
    this.router.navigate(['/edit'], {
      queryParams: params,
    });
  }

  async openLocalFolder() {
    this.loadingIndex.set(2);
    const fileTree = await this.fileLoaderService.loadFiles({
      source: 'local',
    });
    this.loadingIndex.set(-1);
    this.editorStateService.setFileTree(fileTree);
    this.openEdit({
      source: 'local',
    });
  }

  editProject(project: Project) {
    this.openEdit({
      source: project.projectZipUrl,
      editId: project.id,
      editName: project.title,
    });
  }

  async deleteProject(project: Project) {
    try {
      this.loading.set(true);
      await this.gistService.deleteGist({
        gistId: project.id,
      });
      this.snackBar.open(
        'Project deleted successfully! Please note that this is a async operation. It may take Gist some time to return the newest list.',
        'Close',
        {
          duration: 3000,
        }
      );
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
