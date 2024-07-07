import { Injectable } from '@angular/core';

export interface IConsoleMessage {
  content: string;
}

@Injectable()
export class ConsoleService {
  isExpanded = true;
  commandInput = '';
  controlMessages: IConsoleMessage[] = [];
  clearConsole() {}
  executeCommand(event: Event) {}
}
