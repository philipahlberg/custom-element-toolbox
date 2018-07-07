export const ControlMixin = (SuperClass) =>
  class extends SuperClass {
    static get observedAttributes() {
      return Array.from(
        new Set(super.observedAttributes)
          .add('checked')
      );
    }

    constructor() {
      super();
      this._onClick = this._onClick.bind(this);
      this._onKeydown = this._onKeydown.bind(this);
    }

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

      this.addEventListener('click', this._onClick);
      this.addEventListener('keydown', this._onKeydown);

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }

    toggle() {
      if (this.disabled) {
        return;
      }
      this.checked = !this.checked;
    }

    _onClick(event) {
      if (this.disabled) {
        return;
      }
      this.toggle();
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true
      }));
    }
  
    _onKeydown(event) {
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
  };