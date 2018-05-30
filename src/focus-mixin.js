export const FocusMixin = SuperClass =>
  class extends SuperClass {
    static get observedAttributes() {
      return (super.observedAttributes || []).concat(['disabled']);
    }

    set disabled(v) {
      if (v) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }

    set focused(v) {
      if (v) {
        this.setAttribute('focused', '');
      } else {
        this.removeAttribute('focused');
      }
    }

    get focused() {
      return this.hasAttribute('focused');
    }

    attributeChangedCallback(attr, oldValue, newValue) {
      if (attr === 'disabled') {
        const hasValue = newValue != null;
        this.setAttribute('aria-disabled', hasValue);
        if (hasValue) {
          // Remove attribute entirely to ensure that the
          // element is no longer focusable
          this.removeAttribute('tabindex');
          this.blur();
        } else {
          this.setAttribute('tabindex', '0');
        }
      }

      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(attr, oldValue, newValue);
      }
    }

    connectedCallback() {
      this.addEventListener('focus', this.onFocus.bind(this));
      this.addEventListener('blur', this.onBlur.bind(this));

      if (!this.hasAttribute('tabindex') && !this.disabled) {
        this.setAttribute('tabindex', '0');
      }

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }

    focus() {
      super.focus();
      if (!this.disabled) {
        this.dispatchEvent(new Event('focus'));
      }
    }

    onFocus(event) {
      this.focused = true;
    }

    blur() {
      super.blur();
      this.dispatchEvent(new Event('blur'));
    }

    onBlur(event) {
      this.focused = false;
    }
  };
