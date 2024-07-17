import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { ShortcutService } from '../services/shortcut';

@Component({
  selector: 'app-shortcut-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatListModule],
  template: `
    <h1 mat-dialog-title>Keyboard Shortcuts</h1>
    <div mat-dialog-content>
      <mat-list>
        <mat-list-item *ngFor="let shortcut of shortcuts">
          {{ shortcut.shortcut }}: {{ shortcut.description }}
        </mat-list-item>
      </mat-list>
    </div>
  `,
  styles: [],
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
