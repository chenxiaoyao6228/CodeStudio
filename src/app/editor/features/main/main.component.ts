import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditComponent } from './edit/edit.component';
import { ResizerContainerComponent } from './components/resizer/resize-container';
import { ResizerComponent } from './components/resizer/resizer';
import { PreviewComponent } from './ouput/preview/preview.component';
import { TerminalComponent } from './ouput/terminal/terminal.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-editor-main',
  standalone: true,
  imports: [
    CommonModule,
    EditComponent,
    ResizerContainerComponent,
    ResizerComponent,
    PreviewComponent,
    TerminalComponent,
    SidebarComponent,
  ],
  providers: [],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {}
