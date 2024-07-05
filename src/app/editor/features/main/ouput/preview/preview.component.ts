import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  MAT_CHECKBOX_DEFAULT_OPTIONS,
  MatCheckbox,
  MatCheckboxDefaultOptions,
} from '@angular/material/checkbox';
import { MatProgressBar } from '@angular/material/progress-bar';
import { StartupPhase } from '@app/editor/constants';
import { EditorStateService } from '@app/editor/services/editor-state.service';
import { MatIconModule } from '@angular/material/icon';
import { NodeContainerService } from '@app/editor/services/node-container.service';
import { map } from 'rxjs';

interface IPhaseItem {
  key: StartupPhase;
  message: string;
  completed: boolean;
  order: number;
  loading: boolean;
}

const DEFAULT_PHASE_LIST = [
  {
    key: StartupPhase.LOADING_FILES,
    message: 'Loading files',
    completed: false,
    loading: false,
  },

  {
    key: StartupPhase.BOOTING,
    message: 'Booting WebContainer',
    completed: false,
    loading: false,
  },

  {
    key: StartupPhase.INSTALLING,
    message: 'Installing dependencies',
    completed: false,
    loading: false,
  },
  {
    key: StartupPhase.STARTING_DEV_SERVER,
    message: 'Running start command',
    completed: false,
    loading: false,
  },
  {
    key: StartupPhase.READY,
    message: 'Happy Coding ! ',
    completed: false,
    loading: false,
  },
] as IPhaseItem[];
@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [MatCheckbox, MatProgressBar, MatIconModule],
  providers: [
    {
      provide: MAT_CHECKBOX_DEFAULT_OPTIONS,
      useValue: { clickAction: 'noop' } as MatCheckboxDefaultOptions,
    },
  ],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent {
  @ViewChild('previewIframe') previewIframe:
    | ElementRef<HTMLIFrameElement>
    | undefined;
  private readonly destroyRef = inject(DestroyRef);
  private editorStateService = inject(EditorStateService);
  private nodeContainerService = inject(NodeContainerService);

  previewUrl = signal('');
  isRefreshing = signal(false);

  phases = computed<IPhaseItem[]>(() => {
    const currentPhase = this.editorStateService.getPhase();
    const curIndex = DEFAULT_PHASE_LIST.findIndex(
      (phase) => phase.key === currentPhase
    );
    return DEFAULT_PHASE_LIST.map((phase, index) => ({
      ...phase,
      completed: index < curIndex || curIndex === DEFAULT_PHASE_LIST.length,
      loading: index === curIndex,
    }));
  });

  currentPhaseItem = computed(() => {
    const currentPhase = this.editorStateService.getPhase();
    const currentPhaseItem = DEFAULT_PHASE_LIST.find(
      (phase) => phase.key === currentPhase
    );
    return currentPhaseItem;
  });

  isReady = computed(() => {
    const currentPhase = this.editorStateService.getPhase();
    return currentPhase === StartupPhase.READY;
  });

  progressValue = computed(() => {
    const currentPhase = this.editorStateService.getPhase();
    const phaseIndex = DEFAULT_PHASE_LIST.findIndex(
      (phase) => phase.key === currentPhase
    );
    return (phaseIndex / (DEFAULT_PHASE_LIST.length - 1)) * 100;
  });

  constructor() {}

  trackByPhaseKey(index: number, phase: IPhaseItem): StartupPhase {
    return phase.key;
  }
  ngAfterViewInit() {
    this.nodeContainerService.previewUrl$
      .pipe(map((url) => ({ url })))
      .subscribe(({ url }) => {
        if (url) {
          this.previewIframe!.nativeElement.src = url ?? '';
          this.previewUrl.set(url);
        }
      });
  }
  refreshIframe() {
    if (this.previewUrl()) {
      this.isRefreshing.set(true);
      this.previewIframe!.nativeElement.src = this.previewUrl();
    }
  }

  onIframeLoad() {
    this.isRefreshing.set(false);
  }
}
