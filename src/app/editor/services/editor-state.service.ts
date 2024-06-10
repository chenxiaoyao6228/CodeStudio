import { Injectable, signal } from '@angular/core';
import { StartupPhase } from '../constant';

@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  private _phase = signal(StartupPhase.NOT_STARTED);
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
}
