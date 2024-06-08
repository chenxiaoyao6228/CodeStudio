import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorComponent } from './editor.component';

@NgModule({
  declarations: [EditorComponent],
  imports: [CommonModule],
  exports: [EditorComponent],
  providers: [],
})
export class EditorModule {}
