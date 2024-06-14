import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { NodeContainerService } from '@app/editor/services/node-container.service';
import { AppEditorComponent } from './code-editor/code-editor.component';
import { EditorStateService } from '@app/editor/services/editor-state.service';
import { CodeEditorService } from './code-editor/code-editor.service';

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

  private readonly nodeContainerService = inject(NodeContainerService);
  private readonly editorStateService = inject(EditorStateService);
  private readonly codeEditorService = inject(CodeEditorService);

  options = {
    theme: 'vs-dark',
    language: 'javascript',
    fontSize: 16,
    wordWrap: 'on',
    automaticLayout: true,
  };

  constructor() {
    effect(async () => {
      const currentFilePath = this.editorStateService.geCurrentFilePath();
      if (currentFilePath) {
        try {
          const content = await this.nodeContainerService.readFile(
            currentFilePath
          );
          if (content) {
            this.codeEditorService.openOrCreateFile(
              content,
              this.getLanguageByFilePath(currentFilePath),
              currentFilePath
            );
          }
          console.log('content', content);
        } catch (error) {
          console.log('error', error);
        }
      }
    });
  }

  ngOnInit() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  async handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      await this.saveFile();
    }
  }

  async saveFile() {
    // if (this.model().content) {
    //   // await this.nodeContainerService.writeFile(this.filePath, this.content);
    // }
  }

  getLanguageByFilePath(filePath: string) {
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

    return languageMap[suffix] || 'json';
  }
}
