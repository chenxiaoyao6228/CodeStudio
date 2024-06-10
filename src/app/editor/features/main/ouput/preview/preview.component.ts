import {
  Component,
  DestroyRef,
  ElementRef,
  Signal,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatProgressBar } from '@angular/material/progress-bar';
import { StartupPhase } from '@app/editor/constant';
import { EditorStateService } from '@app/editor/services/editor-state.service';
import { MatIconModule } from '@angular/material/icon';
import { NodeContainerService } from '@app/editor/services/node-container.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

interface IPhaseItem {
  key: StartupPhase;
  message: string;
  completed: boolean;
  order: number;
  loading: boolean;
}

const DEFAULT_PHASE_LIST = [
  // {
  //   key: StartupPhase.NOT_STARTED,
  //   message: 'Waiting',
  //   completed: false,
  //   loading: false,
  // },
  {
    key: StartupPhase.BOOTING,
    message: 'Booting WebContainer',
    completed: false,
    loading: false,
  },
  {
    key: StartupPhase.LOADING_FILES,
    message: 'Loading files',
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
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
})
export class PreviewComponent {
  @ViewChild('previewIframe') previewIframe:
    | ElementRef<HTMLIFrameElement>
    | undefined;
  private readonly destroyRef = inject(DestroyRef);
  private editorStateService = inject(EditorStateService);
  private nodeContainerService = inject(NodeContainerService);

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

  constructor() {
    //@ts-ignore for testing
    // window.updateProgress = () => {
    //   this.editorStateService.setPhase(DEFAULT_PHASE_LIST[index++].key);
    // };
  }

  trackByPhaseKey(index: number, phase: IPhaseItem): StartupPhase {
    return phase.key;
  }
  ngAfterViewInit() {
    this.nodeContainerService.previewUrl$
      .pipe(map((url) => ({ url })))
      .subscribe(({ url }) => {
        if (url) {
          this.previewIframe!.nativeElement.src = url ?? '';
        }
      });
  }
}
