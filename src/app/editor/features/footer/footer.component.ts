import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MainService } from '../main/main.service';

@Component({
  selector: 'app-editor-footer',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  mainService = inject(MainService);

  toggleConsole() {
    this.mainService.toggleConsole();
  }
}
