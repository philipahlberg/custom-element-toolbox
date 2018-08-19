const Mixin = Mix => {
  const mixes = new WeakSet();

  return SuperClass => {
    let prototype = SuperClass;
    while (prototype != null) {
      if (mixes.has(prototype)) {
        return SuperClass;
      }

      prototype = Object.getPrototypeOf(prototype);
    }

    const application = Mix(SuperClass);
    mixes.add(application);
    return application;
  }
};

const BaseMixin = Mixin(SuperClass => {
  return class BaseElement extends SuperClass {
    /**
     * Toggle a boolean attribute (removing it if it is present
     * and adding it if it is not present) on the specified element.
     * 
     * @param {String} name A string specifying the name of the attribute
     * to be toggled.
     * @param {Boolean} force A boolean value to determine whether the
     * attribute should be added or removed, no matter whether the
     * attribute is present or not at the moment.
     * 
     * @returns {Boolean} true if attribute name is eventually present, 
     * and false otherwise.
     */
    toggleAttribute(name, force) {
      if (force != null) {
        if (force) {
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

      return force || this.hasAttribute(name);
    }
  }
});

const connector = (store) => {
  const subscriptions = new WeakMap();

  return (SuperClass, map) => class ConnectedElement extends SuperClass {
    connectedCallback() {
      const { selectors, actions } = map;

      if (selectors) {
        const update = () => Object.assign(
          this,
          selectors(store.getState())
        );
        const subscription = store.subscribe(update);
        subscriptions.set(this, subscription);
        update();
      }

      if (actions) {
        const dispatchers = actions(store.dispatch);
        for (const type in dispatchers) {
          this.addEventListener(type, event => {
            event.stopImmediatePropagation();
            dispatchers[type](event.detail);
          });
        }
      }

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }

    disconnectedCallback() {
      if (map.selectors) {
        const unsubscribe = subscriptions.get(this);
        unsubscribe();
      }
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
    }
  }
};

const PropertyChangedMixin = Mixin(SuperClass => {

  const data = new WeakMap();
  let finalized = false;

  return class extends SuperClass {
    static setup() {
      if (finalized) {
        return;
      }

      const prototype = this.prototype;
      const properties = this.properties;
      const keys = Object.keys(properties);
      for (const key of keys) {
        // Do not delete present accessors.
        if (key in prototype) continue;

        function get() {
          return data.get(this)[key];
        }

        function set(newValue) {
          const oldValue = data.get(this)[key];
          data.get(this)[key] = newValue;
          this.propertyChangedCallback(key, oldValue, newValue);          
        }

        Object.defineProperty(prototype, key, {
          configurable: true,
          enumerable: true,
          get,
          set
        });
      }

      finalized = true;
    }

    constructor() {
      super();
      data.set(this, {});
      this.constructor.setup();
    }

    connectedCallback() {
      // Any property set on the element before
      // it was defined will be inert; it resides
      // on the class instance, not the prototype,
      // and assigning to the property will not trigger
      // accessors.

      // To remedy this, we save, delete and reapply
      // all declared properties.
      const properties = this.constructor.properties;
      const keys = Object.keys(properties);
      for (const key of keys) {
        // Properties defined through `defineProperty`
        // are on the prototype, not the instance.
        // Thus, if the property is present on the
        // instance, it needs to be upgraded.
        if (!this.hasOwnProperty(key)) continue;
        const value = this[key];
        delete this[key];
        this[key] = value;
      }

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }

    propertyChangedCallback(key, oldValue, newValue) {}
  }
});

const PropertyObserverMixin = Mixin(SuperClass => {
  const Base = PropertyChangedMixin(SuperClass);

  return class extends Base {
    propertyChangedCallback(key, oldValue, newValue) {
      super.propertyChangedCallback(key, oldValue, newValue);
      const properties = this.constructor.properties;
      const observer = properties[key].observer;
      if (observer != null) {
        this[observer](newValue, oldValue);
      }
    }
  }
});

/**
 * Convert 'PascalCase' or 'camelCase' to 'dash-case'.
 * @param str A PascalCase og camelCase string
 */
function toDashCase(str) {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}

/**
 * Declaratively reflect properties to attributes.
 * 
 * Maps `camelCase` properties to `dash-case` attributes.
 */
const PropertyReflectionMixin = Mixin(SuperClass => {
  const Base = PropertyChangedMixin(SuperClass);
  const names = new Map();
  let finalized = false;

  return class extends Base {
    static setup() {
      super.setup();

      if (finalized) {
        return;
      }

      const properties = this.properties;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const reflect = properties[key].reflectToAttribute;
        if (reflect) {
          const attribute = toDashCase(key);
          names.set(key, attribute);
        }
      }

      finalized = true;
    }

    propertyChangedCallback(property, oldValue, newValue) {
      super.propertyChangedCallback(property, oldValue, newValue);
      if (oldValue === newValue) {
        return;
      }

      const properties = this.constructor.properties;
      const conf = properties[property];
      const type = conf.type;
      const reflect = conf.reflectToAttribute;
      if (reflect) {
        const attribute = names.get(property);
        if (newValue === false) {
          this.removeAttribute(attribute);
        } else {
          if (type === Boolean) {
            this.setAttribute(attribute, '');
          } else {
            this.setAttribute(attribute, newValue);
          }
        }
      }
    }
  }
});

const PropertiesMixin = Mixin(SuperClass => {
  const Base = PropertyReflectionMixin(
    PropertyObserverMixin(
      PropertyChangedMixin(
        SuperClass
      )
    )
  );

  return class PropertiesElement extends Base {}
});

const ControlMixin = Mixin(SuperClass => {
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

const FocusMixin = Mixin(SuperClass => {
  const Base = PropertiesMixin(BaseMixin(SuperClass));
  const disabledChanged = Symbol();

  return class FocusElement extends Base {
    static get properties() {
      return Object.assign({}, super.properties, {
        /**
         * Specifies if the element is disabled.
         */
        disabled: {
          type: Boolean,
          reflectToAttribute: true,
          observer: disabledChanged
        },
        /**
         * Specifies if the element is focused.
         * 
         * Note: use `.focus()` to focus the element.
         */
        focused: {
          type: Boolean,
          reflectToAttribute: true
        }
      });
    }

    constructor() {
      super();
      this.focused = false;
      this.disabled = false;
    }

    [disabledChanged](newValue, oldValue) {
      if (newValue === oldValue) return;

      this.setAttribute('aria-disabled', String(newValue));
      if (newValue) {
        // Remove attribute entirely to ensure that the
        // element is no longer focusable
        this.removeAttribute('tabindex');
        this.blur();
      } else {
        this.setAttribute('tabindex', '0');
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
      this.focused = true;
      this.dispatchEvent(new FocusEvent('focus'));
      this.dispatchEvent(new FocusEvent('focusin', {
        bubbles: true
      }));
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
      this.focused = false;
      this.dispatchEvent(new FocusEvent('blur'));
      this.dispatchEvent(new FocusEvent('focusout', {
        bubbles: true
      }));
    }
  }
});

const StaticTemplateMixin = Mixin(SuperClass => {
  return class StaticTemplateElement extends SuperClass {
    constructor() {
      super();
      if (this.constructor.hasOwnProperty('template')) {
        this.attachShadow({ mode: 'open' });
      }
    }

    connectedCallback() {
      const ctor = this.constructor;
      if (ctor.hasOwnProperty('template')) {
        const template = ctor.template.content;
        this.shadowRoot.appendChild(template.cloneNode(true));
      }

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }
  }
});

/**
 * @param {*} value Object to stringify into HTML
 * @return {string} HTML stringified form of `value`
 */
function sanitize(value) {
  if (value instanceof HTMLTemplateElement) {
    return value.innerHTML;
  } else {
    return String(value);
  }
}

/**
 * A template literal tag that creates an HTML <template> element from the contents of the string.
 * @param {Array<string>} strings Constant parts of tagged template literal
 * @param {...*} values Variable parts of tagged template literal
 * @return {!HTMLTemplateElement} Constructed HTMLTemplateElement
 */
function html(strings, ...values) {
  const rawStrings = strings.raw;
  const template = document.createElement('template');
  template.innerHTML = values.reduce(
    (acc, v, idx) => acc + sanitize(v) + rawStrings[idx + 1],
    rawStrings[0]
  );
  return template;
}

const ShadyCSS = window.ShadyCSS;
const emulated = ShadyCSS && (
  !ShadyCSS.nativeShadow ||
  !ShadyCSS.nativeCss
);

const ShadyTemplateMixin = Mixin(SuperClass => {
  const Base = StaticTemplateMixin(SuperClass);
  let finalized = false;

  return class ShadyTemplateElement extends Base {
    constructor() {
      super();
      const ctor = this.constructor;
      if (finalized || ctor.template == null) {
        return;
      }

      if (emulated) {
        ShadyCSS.prepareTemplate(ctor.template, this.localName);
      }

      finalized = true;
    }

    connectedCallback() {
      super.connectedCallback();
      if (finalized && emulated) {
        ShadyCSS.styleElement(this);
      }
    }
  }
});

const ToggleMixin = Mixin(SuperClass => {
  const Base = PropertiesMixin(BaseMixin(SuperClass));

  const onClick = Symbol();
  const onKeydown = Symbol();
  const checkedChanged = Symbol();

  return class ToggleElement extends Base {
    static get properties() {
      return Object.assign({}, super.properties, {
        checked: {
          type: Boolean,
          reflectToAttribute: true,
          observer: checkedChanged
        }
      });
    }

    constructor() {
      super();
      this.checked = false;
      this[onClick] = this[onClick].bind(this);
      this[onKeydown] = this[onKeydown].bind(this);
    }

    [checkedChanged](newValue, oldValue) {
      if (newValue === oldValue) return;

      this.setAttribute('aria-checked', String(newValue));
      this.dispatchEvent(new Event('input', {
        bubbles: true
      }));
    }

    connectedCallback() {
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

export { BaseMixin, connector, ControlMixin, FocusMixin, PropertiesMixin, PropertyChangedMixin, PropertyObserverMixin, PropertyReflectionMixin, ShadyTemplateMixin, StaticTemplateMixin, html, ToggleMixin };
