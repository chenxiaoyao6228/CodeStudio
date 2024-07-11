import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { ConsoleService } from './console.service';
import { MatIcon } from '@angular/material/icon';
import { MainService } from '../../main.service';
import { CompoundObjRendererComponent } from './compound-obj-renderer';
import { CommonModule } from '@angular/common';
import { PrimitiveRendererComponent } from './primitive-renderer.component';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss'],
  standalone: true,
  imports: [
    MatIcon,
    CommonModule,
    CompoundObjRendererComponent,
    PrimitiveRendererComponent,
  ],
})
export class ConsoleComponent {
  consoleService = inject(ConsoleService);
  mainService = inject(MainService);

  constructor() {}

  toggleConsole() {
    this.mainService.toggleConsole();
  }

  clearConsole() {
    this.consoleService.clearConsole();
  }

  executeCommand(event: Event) {
    event.preventDefault();
    const textarea = event.target as HTMLTextAreaElement;
    const code = textarea.value;

    const previewIframe = document
      .querySelector('#preview-panel')
      ?.querySelector('iframe');
    if (previewIframe && previewIframe.contentWindow) {
      previewIframe.contentWindow.postMessage({ type: 'execute', code }, '*');
      textarea.value = '';
      textarea.focus();
    }
  }

  getItemType(type: string) {
    return type;
  }
}
