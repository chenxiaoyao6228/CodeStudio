import {
  Component,
  effect,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
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
  @ViewChild('commandInput', { static: true })
  commandInput!: ElementRef<HTMLTextAreaElement>;
  consoleService = inject(ConsoleService);
  mainService = inject(MainService);

  constructor() {
    window.addEventListener(
      'message',
      this.consoleService.handleMessage.bind(this.consoleService)
    );

    effect(() => {
      if (this.mainService.isConsoleOpen()) {
        this.commandInput.nativeElement.focus();
      }
    });
  }

  toggleConsole() {
    this.mainService.toggleConsole();
  }

  clearConsole() {
    this.consoleService.clearConsole();
  }

  executeCommand(event: Event) {
    event.preventDefault();
    const textarea = this.commandInput.nativeElement;
    const code = textarea.value.trim();

    if (code) {
      this.consoleService.addCommandToHistory(code);
      const previewIframe = document
        .querySelector('#preview-panel')
        ?.querySelector('iframe');
      if (previewIframe && previewIframe.contentWindow) {
        previewIframe.contentWindow.postMessage({ type: 'execute', code }, '*');
        textarea.value = '';
      }
    }

    textarea.focus();
  }

  handleKeyUp(event: KeyboardEvent) {
    const textarea = this.commandInput.nativeElement;
    if (event.key === 'ArrowUp') {
      const previousCommand = this.consoleService.getPreviousCommand();
      if (previousCommand !== null) {
        textarea.value = previousCommand;
        textarea.focus();
      }
    } else if (event.key === 'ArrowDown') {
      const nextCommand = this.consoleService.getNextCommand();
      if (nextCommand !== null) {
        textarea.value = nextCommand;
        textarea.focus();
      } else {
        textarea.value = '';
      }
    }
  }

  getItemType(type: string) {
    return type;
  }
}
