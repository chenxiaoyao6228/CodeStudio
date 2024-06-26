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
import { NgIf } from '@angular/common';

interface IPosition {
  x: number;
  y: number;
}

@Component({
  selector: 'resizer',
  standalone: true,
  template: `
    <div
      *ngIf="!isFirstElement"
      class="resizer-bar"
      [class.row]="resizeService.direction === 'row'"
      [class.col]="resizeService.direction === 'col'"
    ></div>
    <ng-content></ng-content>
  `,
  styleUrls: ['./resizer.scss'],
  imports: [NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResizerComponent implements AfterViewInit, OnDestroy {
  @Input() minSize = 100;
  @Input() maxSize = Infinity;
  @Input() isFirstElement = false;
  @Input() percentage = 0;
  private pointerDownPosition: IPosition | null = null;
  resizeService = inject(ResizeManagerService);
  id = `resizer-${Math.random()}`;

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  constructor() {}

  ngAfterViewInit() {
    this.initEvents();
  }

  ngOnDestroy() {
    this.stopResize();
  }

  initEvents() {
    this.renderer.listen(document, 'pointerdown', this.startResize);
  }

  cleanupEvents() {
    document.removeEventListener('pointermove', this.handleResize);
    document.removeEventListener('pointerup', this.stopResize);
  }

  startResize = (e: PointerEvent) => {
    const resizerBar = this.el.nativeElement.querySelector('.resizer-bar');
    if (resizerBar && resizerBar.contains(e.target as Node)) {
      this.pointerDownPosition = {
        x: e.clientX,
        y: e.clientY,
      };
      document.addEventListener('pointermove', this.handleResize);
      document.addEventListener('pointerup', this.stopResize);
    } else {
      this.stopResize();
    }
  };

  handleResize = (e: PointerEvent) => {
    if (!this.pointerDownPosition) return;

    const direction = this.resizeService.direction;
    const { clientX, clientY } = e;
    let delta = 0;
    if (direction === 'row') {
      delta = clientX - this.pointerDownPosition.x;
    } else {
      delta = clientY - this.pointerDownPosition.y;
    }
    // update pointer location
    this.pointerDownPosition = {
      x: clientX,
      y: clientY,
    };

    console.log('delta', delta);
    if (delta === 0) return;

    this.resizeService.calculateNewSize({
      id: this.id,
      delta: delta,
    });
  };

  stopResize = () => {
    this.cleanupEvents();
    this.pointerDownPosition = null;
  };

  getOptions() {
    return {
      id: this.id,
      minSize: this.minSize,
      maxSize: this.maxSize,
      width: 0,
      height: 0,
      percentage: this.percentage,
      resizer: this,
    };
  }

  updateSize(sizeFlag: 'width' | 'height', size: number) {
    this.renderer.setStyle(this.el.nativeElement, sizeFlag, `${size}%`);
  }
}
