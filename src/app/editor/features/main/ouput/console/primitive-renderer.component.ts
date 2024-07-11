import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-primitive-renderer',
  template: `
    <span class="primitive">
      {{ data.value }}
    </span>
  `,
  styles: [
    `
      .primitive {
        margin-right: 2px;
      }
    `,
  ],
  standalone: true,
})
export class PrimitiveRendererComponent {
  @Input() data: any;
}
