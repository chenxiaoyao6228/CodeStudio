import { ChangeDetectionStrategy, Component, ContentChildren, Input, QueryList, SimpleChanges, inject } from '@angular/core';
import { ResizeManagerService } from './resize-manager.service';
import { ResizerComponent } from './resizer';

@Component({
  standalone: true,
  selector: 'resizer-container',
  template: '<ng-content></ng-content>',
  styleUrls: ['./resize-container.scss'],
  providers: [ResizeManagerService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResizerContainerComponent {
  @Input() direction: 'col' | 'row' = 'row';
  private resizeService = inject(ResizeManagerService);
  @ContentChildren(ResizerComponent) resizers!: QueryList<ResizerComponent>;


  ngOnChanges(changes: SimpleChanges) {
    if (changes['direction']) {
      this.resizeService.setDirection(this.direction);
    }
  }

  ngAfterContentInit() {
    const resizerArray = this.resizers.toArray();
    this.resizeService.setResizelist(resizerArray.map((resizer) => resizer.getOptions()));
  }

}
