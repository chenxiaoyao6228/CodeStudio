import {
    Component,
    ElementRef,
    Renderer2,
    AfterViewInit,
    Input,
    inject,
    ChangeDetectionStrategy,
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
    styleUrl: './resizer.scss',
    imports: [NgIf],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResizerComponent implements AfterViewInit {
    @Input() minSize: number = 100;
    @Input() maxSize: number = Infinity;
    @Input() isFirstElement: boolean = false;
    private initialSize = {
        width: 0,
        height: 0,
    }
    private pointerDownPosition: IPosition | null = null
    resizeService = inject(ResizeManagerService);
    id = `resizer-${Math.random()}`;
    constructor(private el: ElementRef, private renderer: Renderer2) { }

    ngAfterViewInit() {
        const initialRect = this.el.nativeElement.getBoundingClientRect();
        this.initialSize.width = initialRect.right - initialRect.left;
        this.initialSize.height = initialRect.bottom - initialRect.top;
        this.resizeService.updateResizelistItem(this.id, this.getOptions());
        this.initEvents()

    }

    initEvents() {
        const resizerBar = this.el.nativeElement.querySelector('.resizer-bar');
        if (resizerBar) {
            resizerBar.addEventListener('pointerdown', (e: PointerEvent) => {
                this.pointerDownPosition = {
                    x: e.clientX,
                    y: e.clientY
                }
                document.addEventListener('pointermove', this.handleResize);
                document.addEventListener('pointerup', this.stopResize);
            });
        }
    }

    handleResize = (e: any) => {
        const direction = this.resizeService.direction;
        const { clientX, clientY } = e;
        let delta = 0
        if (direction === 'row') {
            delta = clientX - this.pointerDownPosition!.x;
        } else {
            delta = clientY - this.pointerDownPosition!.y;
        }
        if (delta === 0) return

        this.pointerDownPosition = {
            x: clientX,
            y: clientY
        }
        console.log("delta", delta);
        this.resizeService.calculateNewSize({
            id: this.id,
            delta: delta
        })
    };

    stopResize = () => {
        document.removeEventListener('pointermove', this.handleResize);
        document.removeEventListener('pointerup', this.stopResize);
        document.removeEventListener('pointerout', this.stopResize);
        this.pointerDownPosition = null
    };

    getOptions() {
        return {
            id: this.id,
            minSize: this.minSize,
            maxSize: this.maxSize,
            width: this.initialSize.width,
            height: this.initialSize.height,
            resizer: this,
        };
    }

    updateSize({ size, sizeFlag }: { size: number, sizeFlag: 'width' | 'height' }) {
        this.renderer.setStyle(this.el.nativeElement, sizeFlag, `${size}px`);
    }
}
