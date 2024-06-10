import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

@Injectable({
  providedIn: 'root',
})
export class TerminalService {
  xTerminal: Terminal;
  fitAddon: FitAddon;
  constructor() {
    this.xTerminal = new Terminal({
      convertEol: true,
      cursorBlink: true,
      disableStdin: false,
    });
    const fitAddon = new FitAddon();
    this.xTerminal.loadAddon(fitAddon);
    this.fitAddon = fitAddon;
  }

  open(element: HTMLElement) {
    this.xTerminal.open(element);
    this.resizeToFit();
  }

  resizeToFit = () => {
    try {
      this.fitAddon.fit();
    } catch (error) {
      console.error('xterm resize error:', error);
    }
  };
  clear() {
    this.xTerminal.clear();
  }
  write(data: string) {
    this.xTerminal.write(data);
  }
}
