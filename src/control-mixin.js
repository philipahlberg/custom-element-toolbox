import { Mixin } from './mixin.js';
import { AttributesMixin } from './attributes-mixin.js';

export const ControlMixin = Mixin(SuperClass => {
  const Base = AttributesMixin(SuperClass);

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
          reflectToAttribute: true
        },
        /**
         * Specifies that the user must fill in a value
         * for this element to be considered valid.
         */
        required: {
          type: Boolean,
          reflectToAttribute: true
        }
      })
    }
 
    get valid() {
      return this.value != null || !this.required;
    }

    attributeChangedCallback(attr, oldValue, newValue) {
      const hasValue = newValue != null;
      switch (attr) {
        case 'valid':
          this.setAttribute('aria-invalid', !hasValue);
          break;
        case 'required':
          this.setAttribute('aria-required', hasValue);
        // deliberately not breaking
        case 'value':
          this.toggleAttribute('valid', this.valid);
          break;
      }

      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(attr, oldValue, newValue);
      }
    }

    connectedCallback() {
      this.toggleAttribute('valid', this.valid);
      this.setAttribute('aria-invalid', !this.valid);
      this.setAttribute('aria-required', this.required);

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }
  }
});