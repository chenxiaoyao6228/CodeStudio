import { Component } from '@angular/core';
import { CodeEditor } from './code-editor/code-editor.component';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [CodeEditor],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss'
})
export class EditComponent {

}
