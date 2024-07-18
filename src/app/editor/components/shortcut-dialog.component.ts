import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { ShortcutService } from '../services/shortcut';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-shortcut-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule, MatIcon],
  template: `
    <h2 mat-dialog-title class="title">
      Keyboard Shortcuts
      <mat-dialog-actions>
        <div
          mat-dialog-actions
          tabindex="0"
          (click)="close()"
          (keyup)="close()"
          class="close"
        >
          <mat-icon>close</mat-icon>
        </div>
      </mat-dialog-actions>
    </h2>
    <div mat-dialog-content>
      <mat-list>
        <mat-list-item *ngFor="let shortcut of shortcuts">
          {{ shortcut.shortcut }}: {{ shortcut.description }}
        </mat-list-item>
      </mat-list>
    </div>
  `,
  styles: [
    `
      .title {
        display: flex;
        align-items: center;
      }
      .mat-mdc-dialog-actions {
        position: absolute;
        right: 0;
        .close {
          &:hover {
            cursor: pointer;
          }
        }
      }
    `,
  ],
})
export class ShortcutDialogComponent {
  shortcuts = this.shortcutService.getShortcuts();

  constructor(
    private shortcutService: ShortcutService,
    private dialogRef: MatDialogRef<ShortcutDialogComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }
}
