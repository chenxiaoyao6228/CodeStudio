import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditComponent } from './edit/edit.component';
import { ResizerContainerComponent } from './components/resizer/resize-container';
import { ResizerComponent } from './components/resizer/resizer';
import { PreviewComponent } from './ouput/preview/preview.component';
import { TerminalComponent } from './ouput/terminal/terminal.component';

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
  ],
  providers: [],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {}
