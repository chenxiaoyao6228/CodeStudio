import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  Input,
  QueryList,
  SimpleChanges,
  inject,
  OnChanges,
  AfterContentInit,
} from '@angular/core';
import { ResizeManagerService } from './resize-manager.service';
import { ResizerComponent } from './resizer';

@Component({
  standalone: true,
  selector: 'app-resizer-container',
  template: '<ng-content></ng-content>',
  styleUrls: ['./resize-container.scss'],
  providers: [ResizeManagerService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResizerContainerComponent implements OnChanges, AfterContentInit {
  @Input() direction: 'col' | 'row' = 'row';
  @ContentChildren(ResizerComponent) resizers!: QueryList<ResizerComponent>;

  private el = inject(ElementRef);
  private resizeService = inject(ResizeManagerService);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['direction']) {
      this.resizeService.setDirection(this.direction);
    }
  }

  ngAfterContentInit() {
    const resizerArray = this.resizers.toArray();
    // setFirst to get childIndex set for later resize
    this.resizeService.setResizelist(resizerArray.map(resizer => resizer.getOptions()));

    const initialRect = this.el.nativeElement.getBoundingClientRect();
    this.resizeService.setContainerSize({
      width: initialRect.right - initialRect.left,
      height: initialRect.bottom - initialRect.top,
    });
  }
}
