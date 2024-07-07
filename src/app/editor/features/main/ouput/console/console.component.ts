import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ConsoleService } from './console.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'app-console',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './console.component.html',
  styleUrl: './console.component.scss',
})
export class ConsoleComponent {
  consoleService = inject(ConsoleService);
  mainService = inject(MainService);

  toggleConsole() {
    this.mainService.toggleConsole();
  }
}
