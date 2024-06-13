import { Injectable, signal, WritableSignal } from '@angular/core';
import { StartupPhase } from '../constants';
import { FileSystemTree } from '@webcontainer/api';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  private _phase = signal(StartupPhase.NOT_STARTED);
  private _loadedFileTree: WritableSignal<FileSystemTree | null> =
    signal<FileSystemTree | null>(null);

  loadedFileTree$: BehaviorSubject<FileSystemTree> = new BehaviorSubject({});

  private currentOpendFileTree: FileSystemTree | null = null;

  constructor() {}

  setPhase(phase: StartupPhase) {
    console.log('phase:', phase);
    this._phase.set(phase);
  }

  getPhase() {
    return this._phase();
  }

  resetPhase() {
    this._phase.set(StartupPhase.NOT_STARTED);
  }

  getLoadedFileTree(): FileSystemTree | null {
    return this._loadedFileTree();
  }

  setLoadedFileTree(fileTree: FileSystemTree) {
    this._loadedFileTree.set(fileTree);
    this.loadedFileTree$.next(fileTree);
  }
}
