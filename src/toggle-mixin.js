import { Mixin } from './mixin.js';
import { AttributesMixin } from './attributes-mixin.js';

const onClick = Symbol();
const onKeydown = Symbol();

export const ToggleMixin = Mixin(SuperClass => {
  const Base = AttributesMixin(SuperClass);

  return class ToggleElement extends Base {
    static get properties() {
      return Object.assign({}, super.properties, {
        checked: {
          type: Boolean,
          reflectToAttribute: true
        }
      });
    }

    constructor() {
      super();
      this.checked = false;
      this[onClick] = this[onClick].bind(this);
      this[onKeydown] = this[onKeydown].bind(this);
    }

    attributeChangedCallback(attr, oldValue, newValue) {
      if (attr === 'checked') {
        if (oldValue !== newValue) {
          const hasValue = newValue != null;
          this.setAttribute('aria-checked', hasValue);
        }
      }

      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(attr, oldValue, newValue);
      }
    }

    propertyChangedCallback(prop, oldValue, newValue) {
      if (prop === 'checked') {
        if (oldValue !== newValue) {
          this.dispatchEvent(new Event('input', {
            bubbles: true
          }));
        }
      }

      if (super.propertyChangedCallback) {
        super.propertyChangedCallback(prop, oldValue, newValue);
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
      this.dispatchEvent(new Event('change', {
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
          this.dispatchEvent(new Event('change', {
            bubbles: true
          }));
          break;
        default:
          return;
      }
    }
  }
});