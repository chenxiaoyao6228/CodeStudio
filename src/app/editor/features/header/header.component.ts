import {
  ChangeDetectionStrategy,
  Component,
  inject,
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
import { Router } from '@angular/router';
import { CodeEditorService } from '../main/edit/code-editor/code-editor.service';
import { ConfirmDialogComponent } from '@src/app/_shared/components/confirm-dialog/confirm-dialog';

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
export class HeaderComponent {
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);
  logoPath = 'assets/imgs/header-logo.png';
  githubLogoPath = 'assets/imgs/github.png';
  isSaving = signal(false);
  codeEditorService = inject(CodeEditorService);
  fileSaverService = inject(FileSaverService);
  localStorageService = inject(LocalStorageService);
  router = inject(Router);

  goHome() {
    if (this.codeEditorService.hasEdit) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: 'You have unsaved changes. Do you really want to leave?',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this._goHome();
        } else {
          this.saveToGist();
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
          this.performSave(token);
        }
      });
    } else {
      this.performSave(token);
    }
  }

  async performSave(token: string) {
    try {
      this.isSaving.set(true);
      await this.fileSaverService.uploadToGist(token);
      this.isSaving.set(false);
      this.snackBar.open('File uploaded successfully!', 'Close', {
        duration: 3000,
      });
    } catch (error) {
      this.isSaving.set(false);
      this.snackBar.open('File upload failed. Please try again.', 'Close', {
        duration: 3000,
      });
      console.log('error', error);
    }
  }
}
