import { Mixin } from './mixin.js';
import { BaseMixin } from './base-mixin.js';

const onClick = Symbol();
const onKeydown = Symbol();

export const ToggleMixin = Mixin(SuperClass => {
  const Base = BaseMixin(SuperClass);

  return class ToggleElement extends Base {
    static get observedAttributes() {
      return Array.from(
        new Set(super.observedAttributes)
          .add('checked')
      );
    }

    constructor() {
      super();
      this[onClick] = this[onClick].bind(this);
      this[onKeydown] = this[onKeydown].bind(this);
    }

    /**
     * Set the checked state of the element.
     * 
     * The state change is not carried out
     * if the corresponding `input` event is
     * prevented.
     * 
     * @param {boolean} checked
     */
    set checked(checked) {
      // emit details of the requested state, i.e.
      // *not* the current state.
      const event = new CustomEvent('input', {
        bubbles: true,
        cancelable: true,
        detail: {
          checked,
          value: this.value
        }
      });

      // if the state change was not prevented,
      // it can be applied.
      if (this.dispatchEvent(event)) {
        this.toggleAttribute('checked', checked);
        this.valid = !this.required || checked;
      }
    }
  
    get checked() {
      return this.hasAttribute('checked');
    }

    attributeChangedCallback(attr, oldValue, newValue) {
      if (attr === 'checked') {
        const hasValue = newValue != null;
        this.setAttribute('aria-checked', hasValue);
      }

      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(attr, oldValue, newValue);
      }
    }

    connectedCallback() {
      this.setAttribute('aria-checked', this.checked);

      this.addEventListener('click', this[onClick]);
      this.addEventListener('keydown', this[onKeydown]);

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }

    /**
     * Toggle the checked state of the element,
     * unless the element is disabled.
     * 
     * @event input
     */
    toggle() {
      if (this.disabled) {
        return;
      }
      this.checked = !this.checked;
    }

    /**
     * @private
     */
    [onClick]() {
      if (this.disabled) {
        return;
      }
      this.toggle();
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
    }
  
    /**
     * @private
     */
    [onKeydown](event) {
      if (this.disabled) {
        return;
      }
      switch (event.key) {
        case 'Enter':
        case ' ':
          this.toggle();
          this.dispatchEvent(new CustomEvent('change', {
            bubbles: true
          }));
          break;
        default:
          return;
      }
    }
  }
});