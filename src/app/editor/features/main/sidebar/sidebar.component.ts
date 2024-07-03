import { FileSaverService } from './../../../services/file-saver/file-saver.service';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FileTreeComponent } from './fileTree/file-tree.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FileTreeComponent, MatIconModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  fileSaverService = inject(FileSaverService);
  download() {
    this.fileSaverService.downloadProject()
  }
}
