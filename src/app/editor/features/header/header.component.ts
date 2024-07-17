import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { TemplateModalComponent } from '@app/_shared/components/template-modal/template-modal.component';
import { FileSaverService } from '../../services/file-saver/file-saver.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GitHubTokenDialogComponent } from '@src/app/_shared/components/github-token-dialog/github-token-dialog.component';
import { LocalStorageService } from '@src/app/_shared/service/local-storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CodeEditorService } from '../main/edit/code-editor/code-editor.service';
import { ConfirmDialogComponent } from '@src/app/_shared/components/confirm-dialog/confirm-dialog';
import { NodeContainerService } from '../../services/node-container.service';

const UNTITLED_NAME = 'untitled_project';

@Component({
  selector: 'app-editor-header',
  standalone: true,
  imports: [
    MatIcon,
    MatButton,
    MatProgressSpinnerModule,
    ConfirmDialogComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);
  logoPath = 'assets/imgs/header-logo.png';
  githubLogoPath = 'assets/imgs/github.png';
  isSaving = signal(false);
  projectName = signal(UNTITLED_NAME);
  nodeContainerService = inject(NodeContainerService);
  codeEditorService = inject(CodeEditorService);
  fileSaverService = inject(FileSaverService);
  localStorageService = inject(LocalStorageService);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  editId: string | null = null;
  editName: string | null = null;
  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((params) => {
      this.editId = params.get('editId');
      const editName = params.get('editName');
      if (editName) {
        this.projectName.set(editName);
      }
    });

    this.nodeContainerService.fileMounted$.subscribe(async (fileMounted) => {
      if (fileMounted && this.projectName() === UNTITLED_NAME) {
        const pkgContent = await this.nodeContainerService.readFile(
          'package.json'
        );
        const name = JSON.parse(pkgContent).name || UNTITLED_NAME;
        if (name) {
          this.projectName.set(name);
        }
      }
    });
  }

  goHome() {
    if (this.codeEditorService.hasEdit) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: 'You have unsaved changes. Do you really want to leave?',
        },
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result) {
          this._goHome();
        } else {
          await this.saveToGist();
          this.codeEditorService.hasEdit = false;
        }
      });
    } else {
      this._goHome();
    }
  }
  private _goHome() {
    window.location.href = '/'; // force reload to release resources
  }

  openTemplateModal() {
    this.dialog.open(TemplateModalComponent);
  }

  async saveToGist() {
    let token = this.localStorageService.getItem('githubToken');
    if (!token) {
      const dialogRef = this.dialog.open(GitHubTokenDialogComponent, {
        width: '400px',
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result) {
          token = result;
          this.localStorageService.setItem('githubToken', token);
          this.performSave();
        }
      });
    } else {
      this.performSave();
    }
  }

  async performSave() {
    try {
      this.isSaving.set(true);
      let name = UNTITLED_NAME;
      if (this.projectName() !== UNTITLED_NAME) {
        name = this.projectName();
      }
      if (!name) {
        const pkgContent = await this.nodeContainerService.readFile(
          'package.json'
        );
        name = JSON.parse(pkgContent).name;
      }

      await this.fileSaverService.uploadToGist(name, {
        editId: this.editId,
      });
      this.snackBar.open(
        'File uploaded ! Please note that this is a async operation. It may take Gist some time to return the newest list.',
        'Close',
        {
          duration: 8000,
        }
      );
      this.isSaving.set(false);
    } catch (error) {
      this.isSaving.set(false);
      this.snackBar.open('File upload failed. Please try again.', 'Close', {
        duration: 3000,
      });
      console.log('error', error);
    }
  }

  handleProjectNameInput($event: Event) {
    const target = $event.target as HTMLInputElement;
    this.projectName.set(target.value);
  }
}
