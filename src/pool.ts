export class Pool {
  private objects: Object[];
  private waiting: Function[];

  constructor(initialize: () => void, capacity: number) {
    this.objects = [];
    this.waiting = [];

    if (!capacity) capacity = 5;
    console.warn('Pool capacity: %d', capacity);
    process.nextTick(() => {
      for (let i = 0; i < capacity; i++) {
        initialize();
      }
    });
  }

  public acquire(callback: Function) {
    this.waiting.push(callback);
    this.supply();
  }

  public release(object: Object) {
    this.objects.push(object);
    this.supply();
  }

  public supply() {
    while (this.objects.length && this.waiting.length) {
      this.waiting.shift()(this.objects.shift());
    }
  }
}
