import { Injectable, signal, WritableSignal } from '@angular/core';

export interface dataType {
  type: string;
  value: string;
}

interface IConsoleMessage {
  type: 'console';
  method: 'log' | 'error' | 'warn' | 'info' | 'debug';
  args: dataType[];
}

interface IError {
  type: 'error';
  message: string;
  codeInfo: string;
  stacks: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ConsoleService {
  logs: WritableSignal<IConsoleMessage[]> = signal([]);
  errors: WritableSignal<IError[]> = signal([]);
  commandHistory: string[] = [];
  historyIndex = -1;

  clearConsole() {
    this.logs.set([]);
    this.errors.set([]);
    this.commandHistory = [];
    this.historyIndex = -1;
  }

  addCommandToHistory(command: string) {
    this.commandHistory.push(command);
    this.historyIndex = this.commandHistory.length;
  }

  getPreviousCommand(): string | null {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.commandHistory[this.historyIndex];
    }
    return null;
  }

  getNextCommand(): string | null {
    if (this.historyIndex === 0 && this.commandHistory.length === 1) {
      return this.commandHistory[0];
    }
    if (this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++;
      return this.commandHistory[this.historyIndex];
    }
    return null;
  }

  handleMessage(event: MessageEvent<IConsoleMessage | IError>) {
    if (
      !['webcontainer.io', 'localhost'].some((h) => event.origin.includes(h))
    ) {
      return;
    }

    const { type } = event.data;
    if (type === 'console') {
      const { method, args } = event.data;
      if (['log', 'error', 'warn', 'info', 'debug'].includes(method)) {
        this.logs.set([...this.logs(), { type, method, args }]);
      }
    } else if (type === 'error') {
      this.errors.set([...this.errors(), event.data]);
    }
  }
}
