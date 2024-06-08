import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditComponent } from './edit/edit.component';

@Component({
  selector: 'app-editor-main',
  standalone: true,
  imports: [CommonModule, EditComponent],
  providers: [],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  editors = [
    { name: 'files', label: 'Files' },
    { name: 'editors', label: 'Editors' },
    { name: 'preview', label: 'Preview' }
  ];

  configs = [
    { minSize: 20, maxSize: 80, default: 30 },
    { minSize: 20, maxSize: 80, default: 30 },
    { minSize: 20, maxSize: 80, default: 30 }
  ];

  ngOnInit(): void { }
}
