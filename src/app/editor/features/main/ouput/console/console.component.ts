import { Component, inject } from '@angular/core';
import { ConsoleService } from './console.service';
import { MatIcon } from '@angular/material/icon';
import { MainService } from '../../main.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss'],
  standalone: true,
  imports: [MatIcon, CommonModule],
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
    this.consoleService.executeCommand(event);
  }

  getItemType(type: string) {
    return type;
  }
}
