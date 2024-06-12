import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
} from '@angular/core';
import { NodeContainerService } from '@app/editor/services/node-container.service';
import { AppEditorComponent } from './code-editor/code-editor.component';

@Component({
  standalone: true,
  selector: 'app-edit',
  imports: [AppEditorComponent],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditComponent {
  @ViewChild(AppEditorComponent) editorComponent:
    | AppEditorComponent
    | undefined;
  nodeContainerService = inject(NodeContainerService);

  content: string = `
   111
  `;
  language: string = 'javascript';
  filePath: string = '';

  options = {
    theme: 'vs-dark',
    language: this.language,
    fontSize: 16,
    wordWrap: 'on',
    automaticLayout: true,
  };

  ngOnInit() {
    this.loadFileContent();

    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  async loadFileContent() {
    if (this.filePath) {
      this.content = await this.nodeContainerService.readFile(this.filePath);
      this.setLanguageByFilePath(this.filePath);
    }
  }

  async handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      await this.saveFile();
    }
  }

  async saveFile() {
    if (this.content) {
      await this.nodeContainerService.writeFile(this.filePath, this.content);
    }
  }

  handleEditorChange(value: string) {
    this.content = value;
  }

  setLanguageByFilePath(filePath: string) {
    const suffix = filePath.split('.').pop() || 'default';

    const languageMap: { [key: string]: string } = {
      js: 'javascript',
      mjs: 'javascript',
      css: 'css',
      ts: 'typescript',
      tsx: 'typescript',
      html: 'html',
      json: 'json',
      md: 'markdown',
      yaml: 'yaml',
      prettierrc: 'json',
      default: 'json',
    };

    this.language = languageMap[suffix] || 'json';
  }
}
