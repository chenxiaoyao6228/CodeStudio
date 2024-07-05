import { Component, inject, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-github-url-dialog',
  templateUrl: './github-url-dialog.component.html',
  styleUrls: ['./github-url-dialog.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
})
export class GithubUrlDialogComponent {
  githubUrl = '';
  readonly dialogRef = inject(MatDialogRef<GithubUrlDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.githubUrl.trim()) {
      this.dialogRef.close(this.githubUrl);
    }
  }
}
