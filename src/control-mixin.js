export const ControlMixin = (SuperClass) =>
  class extends SuperClass {
    static get observedAttributes() {
      return Array.from(
        (new Set(super.observedAttributes))
          .add('valid')
          .add('required')
      );
    }

    set role(value) {
      this.setAttribute('role', value);
    }
  
    get role() {
      return this.getAttribute('role');
    }
  
    set name(value) {
      this.setAttribute('name', value);
    }
  
    get name() {
      return this.getAttribute('name');
    }
  
    set value(value) {
      this.setAttribute('value', value);
    }
  
    get value() {
      return this.getAttribute('value');
    }

    set required(value) {
      this.toggleAttribute('required', value);
    }
  
    get required() {
      return this.hasAttribute('required');
    }
  
    set valid(value) {
      this.toggleAttribute('valid', value);
    }
  
    get valid() {
      return this.hasAttribute('valid');
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
      this.setAttribute('aria-invalid', this.invalid);
      this.setAttribute('aria-required', this.required);

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }
  };