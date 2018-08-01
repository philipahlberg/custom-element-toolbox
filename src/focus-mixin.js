import { Mixin } from './mixin.js';
import { BaseMixin } from './base-mixin.js';

export const FocusMixin = Mixin(SuperClass => {
  const Base = BaseMixin(SuperClass);

  const onFocus = Symbol();
  const onBlur = Symbol();

  return class FocusElement extends Base {
    static get observedAttributes() {
      return Array.from(
        new Set(super.observedAttributes)
          .add('disabled')
      );
    }

    /**
     * Specifies if the element is disabled.
     * @param {boolean} disabled
     */
    set disabled(disabled) {
      this.toggleAttribute('disabled', disabled);
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }

    /**
     * Specifies if the element is focused.
     * 
     * Note: use `.focus()` to focus the element.
     * 
     * @param {boolean} focused
     */
    set focused(focused) {
      this.toggleAttribute('focused', focused);
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
      this.addEventListener('focus', this[onFocus].bind(this));
      this.addEventListener('blur', this[onBlur].bind(this));

      if (!this.hasAttribute('tabindex') && !this.disabled) {
        this.setAttribute('tabindex', '0');
      }

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }

    /**
     * Focus the element, unless it is disabled.
     * 
     * Fires a `focus` event.
     * 
     * @event focus
     */
    focus() {
      if (this.disabled) {
        return;
      }

      super.focus();
      this.dispatchEvent(new Event('focus'));
    }

    /**
     * @private
     */
    [onFocus]() {
      if (this.disabled) {
        return;
      }

      this.focused = true;
    }

    /**
     * Blur the element.
     * 
     * Fires a `blur` event.
     * 
     * @event blur
     */
    blur() {
      if (this.disabled) {
        return;
      }

      super.blur();
      this.dispatchEvent(new Event('blur'));
    }

    /**
     * @private
     */
    [onBlur]() {
      if (this.disabled) {
        return;
      }

      this.focused = false;
    }
  }
});