export class EventEmitter<T = unknown> {
  private events: { [K in keyof T]?: ((payload: T[K]) => void)[] } = {};

  on<K extends keyof T>(event: K, listener: (payload: T[K]) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event]!.push(listener);
  }

  off<K extends keyof T>(event: K, listener: (payload: T[K]) => void): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event]!.filter(l => l !== listener);
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    if (!this.events[event]) return;
    this.events[event]!.forEach(listener => listener(payload));
  }
}
