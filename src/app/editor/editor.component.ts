import { Component } from '@angular/core';
import { HeaderComponent } from './features/header/header.component';
import { FooterComponent } from './features/footer/footer.component';
import { MainComponent } from './features/main/main.component';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    MainComponent
  ],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent {

}
