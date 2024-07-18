import { Component } from '@angular/core';
import { IconResolver, MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatIconModule],
  template: '<router-outlet />',
})
export class AppComponent {
  title = 'CodeStudio';
  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    const resolver: IconResolver = (name, namespace) => {
      return sanitizer.bypassSecurityTrustResourceUrl(`assets/imgs/${name}.svg`);
    };
    iconRegistry.addSvgIconResolver(resolver);
  }
}
