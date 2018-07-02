export const MinimalMixin = SuperClass =>
  class extends SuperClass {
    /**
     * Convenience function for emitting a custom event.
     * @param {string} type
     * @param {*} detail
     * @param {CustomEventInit} options
     */
    emit(type, detail, options) {
      const init = Object.assign(
        {
          bubbles: true,
          cancelable: true,
          detail
        },
        options
      );
      return this.dispatchEvent(new CustomEvent(type, init));
    }

    on(type, listener) {
      this.addEventListener(type, listener);
    }

    off(type, listener) {
      this.removeEventListener(type, listener);
    }
  };
