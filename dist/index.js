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

/**
 * Convert 'PascalCase' or 'camelCase' to 'dash-case'.
 * @param str A PascalCase og camelCase string
 */
function toDashCase(str) {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}

/**
 * Set properties in reaction to attributes changing.
 * 
 * Maps `dash-case` attributes to `camelCase` properties.
 */
const AttributeDeserialization = Mixin(SuperClass => {
  const names = new Map();
  const finalized = new WeakSet();
  const isSerializing = new Set();

  return class extends SuperClass {
    static get observedAttributes() {
      const observedAttributes = super.observedAttributes;
      const properties = this.properties || {};
      return Object.keys(properties)
        .map(key => toDashCase(key))
        .concat(observedAttributes);
    }

    static setup() {
      if (finalized.has(this)) return;
      if (super.setup != null) {
        super.setup();
      }
      const properties = this.properties;
      if (properties === undefined) return;
      const keys = Object.keys(properties);
      for (const key of keys) {
        // Names are shared between all instances
        // so we might have already translated this key.
        if (names.has(key)) continue;
        const attribute = toDashCase(key);
        names.set(attribute, key);
      }

      finalized.add(this);
    }

    constructor() {
      super();
      this.constructor.setup();
    }

    attributeChangedCallback(attribute, oldValue, newValue) {
      if (super.attributeChangedCallback != null) {
        super.attributeChangedCallback(attribute, oldValue, newValue);
      }

      // Ignore unchanged values.
      if (oldValue === newValue) return;
      // Ignore changes from property reflection.
      if (isSerializing.has(this)) return;
      // Ignore changes to attributes that
      // do not correspond to a declared property.
      if (!names.has(attribute)) return;

      const properties = this.constructor.properties;
      const key = names.get(attribute);
      const type = properties[key].type;

      switch (type) {
        case String:
          this[key] = newValue;
          break;
        case Boolean:
          this[key] = newValue != null;
          break;
        // Number, Object, Array
        default:
          this[key] = JSON.parse(newValue);
      }
    }

    // Although this mixin does not specifically require
    // PropertyChangedMixin, it has to be useable with
    // PropertyReflectionMixin.
    // Thus, we need to be aware when an attribute is being set
    // as a reaction to a property change.
    propertyChangedCallback(property, oldValue, newValue) {
      isSerializing.add(this);
      super.propertyChangedCallback(property, oldValue, newValue);
      isSerializing.remove(this);
    }
  }
});

const Base = Mixin(SuperClass => {
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

const PropertyChanged = Mixin(SuperClass => {
  const data = new WeakMap();
  const finalized = new WeakSet();

  return class extends SuperClass {
    static setup() {
      if (finalized.has(this)) {
        return;
      }

      const prototype = this.prototype;
      const properties = this.properties;
      if (properties === undefined) return;
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

      finalized.add(this);
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

      // To remedy this, we save and delete all properties
      // on the instance and reapply them to the prototype.
      const properties = this.constructor.properties;
      const keys = Object.keys(properties);
      for (const key of keys) {
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

    set(properties) {
      const entries = Object.entries(properties);
      const oldValues = {};
      const currentValues = data.get(this);

      for (const [key, value] of entries) {
        oldValues[key] = currentValues[key];
        currentValues[key] = value;
      }

      for (const [key, newValue] of entries) {
        const oldValue = oldValues[key];
        this.propertyChangedCallback(key, oldValue, newValue);
      }
    }
  }
});

const PropertyObserver = Mixin(SuperClass => {
  const Super = PropertyChanged(SuperClass);

  return class extends Super {
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
 * Declaratively reflect properties to attributes.
 * 
 * Maps `camelCase` properties to `dash-case` attributes.
 */
const PropertyReflection = Mixin(SuperClass => {
  const Super = PropertyChanged(SuperClass);
  const names = new Map();
  const finalized = new WeakSet();

  return class extends Super {
    static setup() {
      super.setup();

      if (finalized.has(this)) {
        return;
      }

      const properties = this.properties;
      if (properties === undefined) return;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const reflect = properties[key].reflectToAttribute;
        if (reflect) {
          // Names are shared between all instances
          // so we might have already translated this key.
          if (names.has(key)) continue;
          const attribute = toDashCase(key);
          names.set(key, attribute);
        }
      }

      finalized.add(this);
    }

    propertyChangedCallback(property, oldValue, newValue) {
      super.propertyChangedCallback(property, oldValue, newValue);
      if (oldValue === newValue) return;

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

const PropertyDefault = Mixin(SuperClass => {
  const Super = PropertyChanged(SuperClass);

  return class extends Super {
    connectedCallback() {
      super.connectedCallback();
      const ctor = this.constructor;
      const properties = ctor.properties;
      if (properties === undefined) return;
      const keys = Object.keys(properties);
      const defaults = {};
      for (const key of keys) {
        if (this[key] != null) continue;
        const property = properties[key];
        if (property.default == null) continue;
        defaults[key] = property.default();
      }
      this.set(defaults);
    }
  }
});

const Properties = Mixin(SuperClass => {
  const Base = PropertyDefault(
    PropertyReflection(
      PropertyObserver(
        PropertyChanged(
          SuperClass
        )
      )
    )
  );

  return class PropertiesElement extends Base {}
});

const Control = Mixin(SuperClass => {
  const Super = Properties(Base(SuperClass));
  const valueChanged = Symbol();
  const requiredChanged = Symbol();

  return class ControlElement extends Super {
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

const Focus = Mixin(SuperClass => {
  const Super = Properties(Base(SuperClass));
  const disabledChanged = Symbol();

  return class FocusElement extends Super {
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
      if (this.disabled) return;
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
      if (this.disabled) return;
      super.blur();
      this.focused = false;
      this.dispatchEvent(new FocusEvent('blur'));
      this.dispatchEvent(new FocusEvent('focusout', {
        bubbles: true
      }));
    }
  }
});

const StaticTemplate = Mixin(SuperClass => {
  const mounted = new WeakSet();

  return class StaticTemplateElement extends SuperClass {
    connectedCallback() {
      const constructor = this.constructor;
      const template = constructor.template;
      if (template != null && !mounted.has(this)) {
        if (this.shadowRoot == null) {
          this.attachShadow({ mode: 'open' });
        }
        const content = template.content;
        const clone = content.cloneNode(true);
        this.shadowRoot.appendChild(clone);
        mounted.add(this);
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

const ShadyTemplate = Mixin(SuperClass => {
  const Super = StaticTemplate(SuperClass);
  const finalized = new WeakSet();
  const ShadyCSS = window.ShadyCSS;
  const emulated = ShadyCSS && (
    !ShadyCSS.nativeShadow ||
    !ShadyCSS.nativeCss
  );

  return class ShadyTemplateElement extends Super {
    static prepareTemplate(name) {
      if (!emulated) return;
      if (finalized.has(this)) return;
      ShadyCSS.prepareTemplate(this.template, name);
      finalized.add(this);
    }

    constructor() {
      super();
      const tagName = this.localName.toLowerCase();
      this.constructor.prepareTemplate(tagName);
    }

    connectedCallback() {
      super.connectedCallback();
      if (emulated) {
        ShadyCSS.styleElement(this);
      }
    }
  }
});

const Toggle = Mixin(SuperClass => {
  const Super = Properties(Base(SuperClass));

  const onClick = Symbol();
  const onKeydown = Symbol();
  const checkedChanged = Symbol();

  return class ToggleElement extends Super {
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

export { AttributeDeserialization, AttributeDeserialization as AttributeDeserializationMixin, Base, Base as BaseMixin, connector, Control, Control as ControlMixin, Focus, Focus as FocusMixin, Properties, Properties as PropertiesMixin, PropertyChanged, PropertyChanged as PropertyChangedMixin, PropertyDefault, PropertyDefault as PropertyDefaultMixin, PropertyObserver, PropertyObserver as PropertyObserverMixin, PropertyReflection, PropertyReflection as PropertyReflectionMixin, ShadyTemplate, ShadyTemplate as ShadyTemplateMixin, StaticTemplate, html, StaticTemplate as StaticTemplateMixin, Toggle, Toggle as ToggleMixin };
