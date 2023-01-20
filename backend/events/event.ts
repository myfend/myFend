export interface EventEmitter {
  emit<T>(event: T): void;
}

export interface EventListener {
  listen(event: string, handler: EventHandler): void;
}

export interface EventHandler {
  handle<T>(event: T): void;
}

export default class Event implements EventEmitter, EventListener {
  private events = new Map<string, EventHandler[]>();
  emit(event: any): void {
    this.events.get(event.constructor.name)?.forEach((handler) => {
      handler.handle(event);
    });
  }

  listen(event: string, handler: EventHandler): void {
    const events = this.events.get(event);
    if (events) {
      events.push(handler);
      this.events.set(event, events);
    } else {
      this.events.set(event, [handler]);
    }
  }
}
