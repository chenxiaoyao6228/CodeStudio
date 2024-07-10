import { Injectable, signal, WritableSignal } from '@angular/core';

interface IConsoleMessage {
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  content: any[];
}

@Injectable({
  providedIn: 'root',
})
export class ConsoleService {
  messages = signal([]);
  controlMessages: WritableSignal<IConsoleMessage[]> = signal([]);

  constructor() {
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  clearConsole() {
    this.controlMessages.set([]);
  }

  executeCommand(event: Event) {
    // TODO:
  }

  private handleMessage(event: MessageEvent) {
    if (
      !['webcontainer.io', 'localhost'].some((h) => event.origin.includes(h))
    ) {
      return;
    }

    const { method, args } = event.data;
    if (['log', 'error', 'warn', 'info', 'debug'].includes(method)) {
      this.controlMessages.set([
        ...this.controlMessages(),
        { type: method, content: args },
      ]);
    }
  }
}
