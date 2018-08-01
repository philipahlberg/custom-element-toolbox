import { Mixin } from './mixin.js';
import { BaseMixin } from './base-mixin.js';

export const ControlMixin = Mixin(SuperClass => {
  const Base = BaseMixin(SuperClass);

  return class ControlElement extends Base {
    static get observedAttributes() {
      return Array.from(
        (new Set(super.observedAttributes))
          .add('valid')
          .add('required')
      );
    }

    /**
     * The role of the element.
     * @param {string} role
     */
    set role(role) {
      this.setAttribute('role', role);
    }
  
    get role() {
      return this.getAttribute('role');
    }
  
    /**
     * The name of the element.
     * @param {string} name
     */
    set name(name) {
      this.setAttribute('name', name);
    }
  
    get name() {
      return this.getAttribute('name');
    }
  
    /**
     * The value of the element.
     * @param {string} value
     */
    set value(value) {
      this.setAttribute('value', value);
      this.toggleAttribute('valid', this.valid);
    }
  
    get value() {
      return this.getAttribute('value');
    }

    /**
     * Specifies that the user must fill in a value
     * for this element to be considered valid.
     * @param {boolean} required
     */
    set required(required) {
      this.toggleAttribute('required', required);
      this.toggleAttribute('valid', this.valid);
    }
  
    get required() {
      return this.hasAttribute('required');
    }
  
    get valid() {
      return ((this.value != null) || !this.required);
    }

    attributeChangedCallback(attr, oldValue, newValue) {
      const hasValue = newValue != null;
      switch (attr) {
        case 'valid':
          this.setAttribute('aria-invalid', !hasValue);
          break;
        case 'required':
          this.setAttribute('aria-required', hasValue);
          break;
      }

      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(attr, oldValue, newValue);
      }
    }

    connectedCallback() {
      this.setAttribute('aria-invalid', !this.valid);
      this.setAttribute('aria-required', this.required);

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }
  }
});