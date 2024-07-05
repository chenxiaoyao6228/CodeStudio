import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
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
  ],
  providers: [MainService],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements AfterViewInit {
  @ViewChild('mainResizer') mainResizer!: ResizerComponent;
  mainService = inject(MainService);

  ngAfterViewInit() {
    console.log(this.mainResizer.resizeService);
    this.mainService.setResizer(this.mainResizer);
  }
}
