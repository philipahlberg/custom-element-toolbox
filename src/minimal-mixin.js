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

    /**
     * Toggle an attribute.
     * @param {String} name name of the attribute to toggle.
     * @param {Boolean} predicate decides whether to set or remove the attribute.
     */
    toggleAttribute(name, predicate) {
      if (predicate != null) {
        if (predicate) {
          this.setAttribute(name, '');
        } else {
          this.removeAttribute(name);
        }
      } else {
        if (this.hasAttribute(name)) {
          this.removeAttribute(name);
        } else {
          this.setAttribute(name, '');
        }
      }
    }
  };
