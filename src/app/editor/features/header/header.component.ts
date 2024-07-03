import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { TemplateModalComponent } from '@app/_shared/components/template-modal/template-modal.component';
import { FileSaverService } from '../../services/file-saver/file-saver.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-editor-header',
  standalone: true,
  imports: [MatIcon, MatButton, MatProgressSpinnerModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);
  logoPath = 'assets/imgs/header-logo.png';
  githubLogoPath = 'assets/imgs/github.png';
  isSaving = signal(false)
  fileSaverService = inject(FileSaverService)


  openTemplateModal() {
    const dialogRef = this.dialog.open(TemplateModalComponent)
  }
  async saveToGist() {
    try {
      this.isSaving.set(true)

      await this.fileSaverService.uploadToGist()

      this.snackBar.open('File uploaded successfully!', 'Close', {
        duration: 3000,
      });

      this.isSaving.set(false)

    } catch (error) {

      this.snackBar.open('File upload failed. Please try again.', 'Close', {
        duration: 3000,
      });

      console.log("error", error);
    }
  }
}
