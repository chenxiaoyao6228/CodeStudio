import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditComponent } from './edit/edit.component';
import { ResizerContainerComponent } from './components/resizer/resize-container';
import { ResizerComponent } from './components/resizer/resizer';
import { PreviewComponent } from './ouput/preview/preview.component';
import { TerminalComponent } from './ouput/terminal/terminal.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MainService } from './main.service';
import { ConsoleComponent } from './ouput/console/console.component';

@Component({
  selector: 'app-editor-main',
  standalone: true,
  imports: [
    CommonModule,
    EditComponent,
    ResizerContainerComponent,
    ResizerComponent,
    PreviewComponent,
    TerminalComponent,
    SidebarComponent,
    ConsoleComponent,
  ],
  providers: [],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements AfterViewInit {
  @ViewChild('mainResizer') mainResizer!: ResizerComponent;
  @ViewChild('outputResizer') outputResizer!: ResizerComponent;
  mainService = inject(MainService);

  ngAfterViewInit() {
    this.mainService.setMainResizer(this.mainResizer);
    this.mainService.setOutputResizer(this.outputResizer);
  }
}
