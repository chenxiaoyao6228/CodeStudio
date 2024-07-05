import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { AppEditorComponent } from './code-editor/code-editor.component';
import { EditService, ITabItem } from './edit.service';

@Component({
  standalone: true,
  selector: 'app-edit',
  imports: [AppEditorComponent],
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditComponent implements OnInit, OnDestroy {
  @ViewChild(AppEditorComponent) editorComponent:
    | AppEditorComponent
    | undefined;

  editService = inject(EditService);

  constructor() {}

  ngOnInit() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.editService.initEvents();
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  async handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      await this.editService.saveFile();
    }
  }

  updateTabs(filePath: string) {
    this.editService.updateTabs(filePath);
  }

  selectTab(tab: ITabItem) {
    this.editService.selectTab(tab);
  }

  closeTab(tabItem: ITabItem, event: Event) {
    event.stopPropagation();
    this.editService.closeTab(tabItem.filePath, true);
  }
}
