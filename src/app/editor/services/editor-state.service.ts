import { Injectable, signal, WritableSignal } from '@angular/core';
import { StartupPhase } from '../constants';
import { FileSystemTree } from '@webcontainer/api';

export interface IFileItem {
  fileName: string;
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  private _phase = signal(StartupPhase.NOT_STARTED);
  private _loadedFileTree: WritableSignal<FileSystemTree> = signal({});
  private _currentFilePath: WritableSignal<string | null> = signal(null);

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

  getFileTree(): FileSystemTree | null {
    return this._loadedFileTree();
  }

  setFileTree(fileTree: FileSystemTree) {
    this._loadedFileTree.set(fileTree);
  }

  setCurrentFilePath(filePath: string) {
    this._currentFilePath.set(filePath);
  }

  geCurrentFilePath() {
    return this._currentFilePath();
  }
}
