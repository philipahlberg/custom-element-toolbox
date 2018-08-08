import { Mixin } from './mixin.js';
import { BaseMixin } from './base-mixin.js';
import { PropertiesMixin } from './properties-mixin.js';

export const ControlMixin = Mixin(SuperClass => {
  const Base = PropertiesMixin(BaseMixin(SuperClass));
  const valueChanged = Symbol();
  const requiredChanged = Symbol();

  return class ControlElement extends Base {
    static get properties() {
      return Object.assign({}, super.properties, {
        /**
         * The role of the element.
         */
        role: {
          type: String,
          reflectToAttribute: true
        },
        /**
         * The name of the element.
         */
        name: {
          type: String,
          reflectToAttribute: true
        },
        /**
         * The value of the element.
         */
        value: {
          type: String,
          reflectToAttribute: true,
          observer: valueChanged
        },
        /**
         * Specifies that the user must fill in a value
         * for this element to be considered valid.
         */
        required: {
          type: Boolean,
          reflectToAttribute: true,
          observer: requiredChanged
        }
      });
    }

    constructor() {
      super();
      this.required = false;
    }
 
    get valid() {
      return this.value != null || !this.required;
    }

    [valueChanged](newValue, oldValue) {
      if (newValue === oldValue) return;

      this.setAttribute('aria-invalid', !this.valid);
      this.toggleAttribute('valid', this.valid);
    }

    [requiredChanged](newValue, oldValue) {
      if (newValue === oldValue) return;

      this.setAttribute('aria-required', newValue);
      this.setAttribute('aria-invalid', !this.valid);
      this.toggleAttribute('valid', this.valid);
    }
  }
});