import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime, fromEvent, Subject, takeUntil } from 'rxjs';
import { CodeEditorService } from './code-editor.service';

declare const monaco: any;
@Component({
  standalone: true,
  selector: 'app-monaco-editor',
  template: `<div #editorContainer class="editor-container"></div>`,
  styleUrls: ['./code-editor.component.scss'],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppEditorComponent),
      multi: true,
    },
  ],
})
export class AppEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer') editorContentRef!: ElementRef;

  @Input() options: any;
  @Input() content: string = '';
  @Input() @HostBinding('style.height') height: string = '100%';

  @Output() contentChange = new EventEmitter<string>();
  @Output() readonly editorInitialized: EventEmitter<any> =
    new EventEmitter<any>();

  private destroyRef$: Subject<void> = new Subject<void>();
  private editor: any = undefined;

  private disposables: any[] = [];

  codeEditorService = inject(CodeEditorService);
  renderer = inject(Renderer2);

  ngAfterViewInit(): void {
    this.codeEditorService
      .getScriptLoadSubject()
      .pipe(takeUntil(this.destroyRef$))
      .subscribe((isLoaded) => {
        if (isLoaded) {
          this.initMonaco();
        }
      });

    fromEvent(window, 'resize')
      .pipe(debounceTime(50), takeUntil(this.destroyRef$))
      .subscribe(() => {
        if (this.editor) {
          this.editor.layout();
        }
      });
  }

  private initMonaco(): void {
    const options = this.options;
    const language = this.options['language'];
    const editorWrapper: HTMLDivElement = this.editorContentRef.nativeElement;

    if (!this.editor) {
      this.editor = monaco.editor.create(editorWrapper, options);
      this.editor.setModel(monaco.editor.createModel(this.content, language));

      this.editorInitialized.emit(this.editor);

      this.renderer.setStyle(
        this.editorContentRef.nativeElement,
        'height',
        this.height
      );

      this.setValueEmitter();
      this.editor.layout();
    }
  }

  //  ------------ ngModel end -----------------

  private setValueEmitter() {
    if (this.editor) {
      const model = this.editor.getModel();
      this.disposables.push(
        model.onDidChangeContent(() => {
          const value = model.getValue();
          this.contentChange.emit(value);
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.destroyRef$.next();
    this.destroyRef$.complete();
    if (this.editor) {
      this.editor.dispose();
      this.editor = undefined;
    }
    if (this.disposables.length) {
      this.disposables.forEach((disposable) => disposable.dispose());
      this.disposables = [];
    }
  }
}
