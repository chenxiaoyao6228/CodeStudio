import { Injectable } from '@angular/core';
import { StartupPhase } from '../constant';

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  private _phase = StartupPhase.NOT_STARTED;
  private _files = [];
  constructor() {}

  setPhase(phase: StartupPhase) {
    this._phase = phase;
  }
  getPhase() {
    return this._phase;
  }
}
