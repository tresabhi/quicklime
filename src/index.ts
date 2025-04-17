export type QuicklimeEvent<Type> = {
  /**
   * The data passed to the event by the dispatcher.
   */
  data: Type;

  /**
   * The data that was dispatched last time.
   */
  last: Type | null;

  /**
   * Stops the propagation of the event to the rest of the listeners.
   */
  stopPropagation: () => void;
};

export type QuicklimeCallback<Type> = (event: QuicklimeEvent<Type>) => void;

/**
 * The Quicklime event class.
 */
export class Quicklime<Type = void> {
  public callbacks: Set<QuicklimeCallback<Type>> = new Set();

  constructor(public last: Type | null = null) {}

  /**
   * Adds a callback to the Quicklime event.
   * @param callback The callback to be called when the event is fired.
   * @returns The Quicklime event.
   */
  on(callback: QuicklimeCallback<Type>) {
    this.callbacks.add(callback);
    return this;
  }

  /**
   * Identical to `on`, but the callback will only be called once.
   * @see on
   * @param callback The callback to be called when the event is fired.
   * @returns The Quicklime event.
   */
  once(callback: QuicklimeCallback<Type>) {
    const wrapper = (event: QuicklimeEvent<Type>) => {
      callback(event);
      this.off(wrapper);
    };
    return this.on(wrapper);
  }

  /**
   * Removes a callback from the Quicklime event.
   * @param callback The callback to be removed.
   * @returns The Quicklime event.
   */
  off(callback: QuicklimeCallback<Type>) {
    this.callbacks.delete(callback);
    return this;
  }

  /**
   * Clears all the callbacks from the Quicklime event.
   * @returns The Quicklime event.
   */
  clear() {
    this.callbacks.clear();
    return this;
  }

  /**
   * Returns a promise that resolves when the next event is fired.
   * @returns The promise.
   */
  next() {
    return new Promise<QuicklimeEvent<Type>>((resolve) => {
      this.on((event) => resolve(event));
    });
  }

  /**
   * Dispatches the event to all the listeners.
   * @param data The data to be passed to the listeners.
   */
  dispatch(data: Type) {
    /**
     * Do this swap first to ensure that the last value is always available
     * even if the event ends up erroring out.
     */
    const { last } = this;
    this.last = data;

    let propagationStopped = false;
    function stopPropagation() {
      propagationStopped = true;
    }

    for (const callback of this.callbacks) {
      /**
       * Frees this loop from any errors or hiccups from any of the callbacks
       * stopping other callbacks from being called. And, surprisingly,
       * stop propagation still works.
       */
      (async () => callback({ data, last, stopPropagation }))();
      if (propagationStopped) break;
    }
  }
}
