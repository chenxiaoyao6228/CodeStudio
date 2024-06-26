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

export interface EditorModel {
  content: string;
  language?: string;
  uri?: string;
}

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
  @Input() @HostBinding('style.height') height = '100%';
  @Input() options: any; // initialize options

  @Output() modelChange = new EventEmitter<EditorModel>();

  private destroyRef$: Subject<void> = new Subject<void>();
  private editor: monaco.editor.IStandaloneCodeEditor | undefined;

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
    const editorWrapper: HTMLDivElement = this.editorContentRef.nativeElement;

    if (!this.editor) {
      this.editor = this.codeEditorService.initEditor(editorWrapper, options);
    }
    this.renderer.setStyle(
      this.editorContentRef.nativeElement,
      'height',
      this.height
    );

    this.editor.layout();
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
