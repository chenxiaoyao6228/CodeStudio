import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeaderModule } from './features/header/header.module';
import { MainModule } from './features/main/main.module';
import { FooterModule } from './features/footer/footer.module';
import { EditorComponent } from './editor.component';


@NgModule({
  declarations: [
    EditorComponent
  ],
  imports: [
    HeaderModule,
    MainModule,
    FooterModule,
    CommonModule,
  ],
  exports: [EditorComponent]
})
export class EditorModule { }
