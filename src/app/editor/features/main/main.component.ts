import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditComponent } from './edit/edit.component';
import { ResizerContainerComponent } from './components/resizer/resize-container';
import { ResizerComponent } from './components/resizer/resizer';

@Component({
  selector: 'app-editor-main',
  standalone: true,
  imports: [CommonModule, EditComponent, ResizerContainerComponent,
    ResizerComponent,],
  providers: [],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

}