import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

interface IConsoleMessage {
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  content: any[];
}

@Injectable({
  providedIn: 'root',
})
export class ConsoleService {
  messages = signal([]);
  private messagesSubject = new Subject<IConsoleMessage>();
  controlMessages: IConsoleMessage[] = [];

  constructor() {
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  clearConsole() {
    this.controlMessages = [];
  }

  executeCommand(event: Event) {
    // TODO:
  }

  private handleMessage(event: MessageEvent) {
    // if (event.origin !== 'your-iframe-origin') {
    //   return;
    // }

    const { method, args } = event.data;
    if (['log', 'error', 'warn', 'info', 'debug'].includes(method)) {
      this.controlMessages.push({ type: method, content: args });
    }
  }
}
