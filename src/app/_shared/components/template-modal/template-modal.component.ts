import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ITemplateItem, TEMPLATES_CONFIG } from '@app/_shared/components/template-modal/config';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-template-modal',
  standalone: true,
  imports: [MatDialogModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatIcon],
  templateUrl: './template-modal.component.html',
  styleUrls: ['./template-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateModalComponent {
  dialog = inject(MatDialog);
  router = inject(Router); // Inject the Router

  templateList = signal(TEMPLATES_CONFIG);

  selectTemplate(item: ITemplateItem) {
    const queryString = `source=${encodeURIComponent(item.url)}&terminal=${encodeURIComponent(item.terminal)}`;
    window.location.href = `${window.location.origin}/edit/?${queryString}`;
    this.closeModal(); // Close the modal after selection
  }

  closeModal() {
    this.dialog.closeAll();
  }
}
