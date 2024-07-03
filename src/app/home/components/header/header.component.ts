import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { TemplateModalComponent } from '@app/_shared/components/template-modal/template-modal.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LocalStorageService } from '@src/app/_shared/service/local-storage.service';

@Component({
  selector: 'app-home-header',
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
  localStorageService = inject(LocalStorageService);


  openTemplateModal() {
    this.dialog.open(TemplateModalComponent)
  }

}
