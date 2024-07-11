import { Injectable, signal, WritableSignal } from '@angular/core';

export interface dataType {
  type: string;
  value: string;
}

interface IConsoleMessage {
  type: 'console' | 'thrown-error';
  method: 'log' | 'error' | 'warn' | 'info' | 'debug';
  args: any[];
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

  private handleMessage(event: MessageEvent<IConsoleMessage>) {
    if (
      !['webcontainer.io', 'localhost'].some((h) => event.origin.includes(h))
    ) {
      return;
    }

    const { method, args, type } = event.data;
    if (type === 'console') {
      if (['log', 'error', 'warn', 'info', 'debug'].includes(method)) {
        this.controlMessages.set([
          ...this.controlMessages(),
          { type, method, args },
        ]);
      }
    } else if (type === 'thrown-error') {
      // TODO:
    }
  }
}
