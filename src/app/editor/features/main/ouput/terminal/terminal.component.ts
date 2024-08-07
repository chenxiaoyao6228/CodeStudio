import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { TerminalService } from './terminal.service';
import { debounceTime, fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [],
  template: `
    <div class="terminal-wrap">
      <div #terminal class="terminal"></div>
    </div>
  `,
  styleUrls: ['./terminal.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalComponent implements AfterViewInit {
  @ViewChild('terminal') terminalEleRef: ElementRef<HTMLElement> | undefined;
  private terminalService = inject(TerminalService);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit() {
    if (this.terminalEleRef) {
      this.terminalService.open(this.terminalEleRef.nativeElement);
      this.observeTerminalResize();
    }
    fromEvent(window, 'resize')
      .pipe(debounceTime(50), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.terminalService.resizeToFit();
      });
  }
  private observeTerminalResize() {
    if (this.terminalEleRef) {
      const resizeObserver = new ResizeObserver(() => {
        this.terminalService.resizeToFit();
      });
      resizeObserver.observe(this.terminalEleRef.nativeElement);
      this.destroyRef.onDestroy(() => resizeObserver.disconnect());
    }
  }
}
