import {
  Component,
  ElementRef,
  Renderer2,
  AfterViewInit,
  Input,
  inject,
  ChangeDetectionStrategy,
  OnDestroy,
} from '@angular/core';
import { ResizeManagerService } from './resize-manager.service';

interface IPosition {
  x: number;
  y: number;
}

@Component({
  selector: 'app-resizer',
  standalone: true,
  template: `
    @if (!isFirstElement) {
      <div
        class="resizer-bar"
        [class.row]="resizeService.direction === 'row'"
        [class.col]="resizeService.direction === 'col'"
      ></div>
    }
    <ng-content></ng-content>
  `,
  styleUrls: ['./resizer.scss'],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResizerComponent implements AfterViewInit, OnDestroy {
  @Input() minSize = 0;
  @Input() maxSize = Infinity;
  @Input() isFirstElement = false;
  @Input() percentage = 0;
  private pointerDownPosition: IPosition | null = null;
  resizeService = inject(ResizeManagerService);
  id = `resizer-${Math.random()}`;

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  interStyle = {
    width: 100,
    height: 100,
  };

  ngAfterViewInit() {
    this.initEvents();
  }

  ngOnDestroy() {
    this.stopResize();
  }

  initEvents() {
    this.renderer.listen(this.el.nativeElement, 'pointerdown', this.startResize);
  }

  cleanupEvents() {
    document.removeEventListener('pointermove', this.handleResize);
    document.removeEventListener('pointerup', this.stopResize);
  }

  startResize = (e: PointerEvent) => {
    const resizerBar = this.el.nativeElement.querySelector('.resizer-bar');
    if (resizerBar && resizerBar.contains(e.target as Node)) {
      // remember to stop only when needed
      this.stopEvent(e);
      this.pointerDownPosition = {
        x: e.clientX,
        y: e.clientY,
      };
      document.addEventListener('pointermove', this.handleResize);
      document.addEventListener('pointerup', this.stopResize);

      // disable selection
      const style = document.createElement('style');
      style.type = 'text/css';
      style.id = 'disable-select';
      style.innerHTML = `
      * { 
        user-select: none !important; 
        pointer-events: none !important; 
        cursor: ${this.resizeService.direction === 'row' ? 'col-resize' : 'row-resize'} !important; 
      }
    `;
      document.head.appendChild(style);
    } else {
      this.stopResize();
    }
  };

  handleResize = (e: PointerEvent) => {
    this.stopEvent(e);
    requestAnimationFrame(() => {
      if (!this.pointerDownPosition) return;
      const direction = this.resizeService.direction;
      const { clientX, clientY } = e;
      let delta = 0;
      if (direction === 'row') {
        delta = clientX - this.pointerDownPosition!.x;
      } else {
        delta = clientY - this.pointerDownPosition!.y;
      }
      // update pointer location
      this.pointerDownPosition = {
        x: clientX,
        y: clientY,
      };

      if (delta === 0) return;

      this.resizeService.calculateNewSize({
        id: this.id,
        delta: delta,
      });
    });
  };

  stopResize = () => {
    this.cleanupEvents();
    this.pointerDownPosition = null;

    // enable selection
    const style = document.getElementById('disable-select');
    if (style) {
      style.parentNode?.removeChild(style);
    }

    document.body.style.cursor = '';
  };

  stopEvent(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  getOptions() {
    return {
      id: this.id,
      minSize: this.minSize,
      maxSize: this.maxSize,
      width: 0,
      height: 0,
      percentage: this.percentage,
      originPercentage: this.percentage,
      resizer: this,
    };
  }

  updateSize(sizeFlag: 'width' | 'height', size: number) {
    this.renderer.setStyle(this.el.nativeElement, sizeFlag, `${size}%`);

    this.interStyle[sizeFlag] = size;

    if (this.interStyle.width === 0 || this.interStyle.height === 0) {
      this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
    } else {
      this.renderer.setStyle(this.el.nativeElement, 'display', 'flex');
    }
  }
}
