import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorComponent } from './editor.component';
import DimensionAdjuster from './features/main/drag-component/utils/DimensionAdjuster';


@NgModule({
  declarations: [
    EditorComponent
  ],
  imports: [
    CommonModule,
  ],
  exports: [EditorComponent],
  providers: [DimensionAdjuster]
})
export class EditorModule { }
