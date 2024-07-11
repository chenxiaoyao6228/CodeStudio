import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimitiveRendererComponent } from './primitive-renderer.component';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-compound-obj-renderer',
  templateUrl: './compound-obj-renderer.html',
  styleUrls: ['./compound-obj-renderer.scss'],
  standalone: true,
  imports: [PrimitiveRendererComponent, CommonModule, MatIcon],
})
export class CompoundObjRendererComponent {
  @Input({ required: true }) data: any = { type: '', value: '' };
  @Input() simple = false;
  @Input() arrayIndex: number | undefined = undefined; // 有的话作为对象或者数组的属性
  expanded = signal(false);

  toggleExpand(e: Event) {
    e.stopPropagation();
    this.expanded.set(!this.expanded());
  }

  isCompound(value: any) {
    return this.isArray(value) || this.isObject(value);
  }

  isObject(value: any): boolean {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
