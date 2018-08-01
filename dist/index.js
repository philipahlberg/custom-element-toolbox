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
     * Shorthand for emitting a custom event.
     * 
     * @param {string} type The type/name of the event.
     * @param {*} detail Any extra state to include in the event.
     * @param {CustomEventInit} options
     */
    emit(type, detail, options) {
      const defaults = {
        bubbles: true,
        cancelable: true,
        detail
      };
      const init = Object.assign(defaults, options);
      return this.dispatchEvent(new CustomEvent(type, init));
    }

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

function isSerializableType(type) {
  return type === String ||
    type === Number ||
    type === Boolean;
}

/**
 * Convert 'PascalCase' or 'camelCase' to 'dash-case'.
 * @param str A PascalCase og camelCase string
 */
function toDashCase(str) {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}

const finalized = new WeakSet();
const attributeToProperty = new Map();
const propertyToAttribute = new Map();

/**
 * A very simple mixin for synchronizing primitive properties with attributes.
 * Maps `camelCase` properties to `dash-case` attributes.
 * 
 * `String` property values map directly to attribute values.
 * 
 * `Boolean` property values toggle/check the existence of attributes.
 * 
 * `Number` property values are coerced with `Number()`.
 */
const AttributeMixin = Mixin(SuperClass => {
  const Base = BaseMixin(SuperClass);

  return class AttributeElement extends Base {
    // Set up an attribute -> property mapping
    // by observing all attributes that are primitive
    // (e. g. `Boolean`, `Number` or `String`)
    static get observedAttributes() {
      const properties = this.properties || {};
      return Object.keys(properties)
        .filter((key) => isSerializableType(properties[key].type))
        .map((key) => toDashCase(key));
    }

    /**
     * Set up property -> attribute mapping.
     */
    static setup() {
      super.setup();

      if (finalized.has(this)) {
        return;
      }

      const { properties } = this;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const { type, reflectToAttribute } = properties[key];
        if (reflectToAttribute || (reflectToAttribute !== false && isSerializable(type))) {
          const attribute = toDashCase(key);
          // Cache property and attribute names (both ways)
          propertyToAttribute.set(key, attribute);
          attributeToProperty.set(attribute, key);
        }
      }

      finalized.add(this);
    }

    // Perform attribute-deserialization, i. e.
    // extract values embedded in attributes.
    connectedCallback() {
      const { constructor } = this;
      const { properties } = constructor;
      const keys = Object.keys(properties);
      for (const key of keys) {
        let isNull = this[key] == null;

        // Attempt to read from attribute if property is missing
        const attributeName = propertyToAttribute.get(key) || toDashCase(key);
        if (isNull && this.hasAttribute(attributeName)) {
          const value = this.deserialize(attributeName);
          if (value != null) {
            this[key] = value;
          }
        }
      }

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }

    /**
     * Override point for property setters.
     * @param {string} key 
     * @param {*} value 
     */
    set(key, value) {
      super.set(key, value);
      // Check if the property should be reflected
      const properties = this.constructor.properties;
      if (
        properties[key].reflectToAttribute !== false
      ) {
        // If it should, we pass it to `serialize`
        this.serialize(key, value);
      }
    }

    /**
     * Override point for property -> attribute conversion.
     * @param {string} key 
     * @param {*} value 
     */
    serialize(key, value) {
      const attribute = propertyToAttribute.get(key) || toDashCase(key);
      const { type } = this.constructor.properties[key];
      if (type != null && isSerializableType(type)) {
        switch (type) {
          case String:
          case Number:
            this.setAttribute(attribute, value);
            break;
          case Boolean:
            this.toggleAttribute(attribute, value);
            break;
        }
      }
    }

    /**
     * Override point for attribute -> property conversion.
     * @param {*} attribute 
     */
    deserialize(attribute) {
      const key = attributeToProperty.get(attribute);
      const { type } = this.constructor.properties[key];
      if (type != null && isSerializableType(type)) {
        switch (type) {
          case String:
            return this.getAttribute(attribute);
          case Number:
            return Number(this.getAttribute(attribute));
          case Boolean:
            return this.hasAttribute(attribute);
          default:
            return JSON.parse(this.getAttribute(attribute));
        }
      }
    }

    attributeChangedCallback(attr, oldValue, newValue) {
      const property = attributeToProperty.get(attr);
      const properties = this.constructor.properties;
      if (
        property != null &&
        properties[property] != null &&
        oldValue !== newValue
      ) {
        const { type } = properties[property];
        let propertyValue;
        switch (type) {
          case String:
            propertyValue = newValue;
            break;
          case Number:
            propertyValue = Number(newValue);
            break;
          case Boolean:
            propertyValue = newValue != null;
            break;
        }

        this[property] = propertyValue;
      }

      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(attr, oldValue, newValue);
      }
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

const ControlMixin = Mixin(SuperClass => {
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

const FocusMixin = Mixin(SuperClass => {
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

const finalized$1 = new WeakSet();
const properties = new WeakMap();

const PropertyAccessorsMixin = Mixin(SuperClass => {
  return class PropertyAccessorsElement extends SuperClass {

    static setup() {
      if (finalized$1.has(this)) {
        return;
      }

      const prototype = this.prototype;
      const properties = Object.keys(this.properties);
      for (const key of properties) {
        Object.defineProperty(prototype, key, {
          configurable: true,
          enumerable: true,
          get: function() {
            return this.get(key);
          },
          set: function(value) {
            this.set(key, value);
          }
        });
      }

      finalized$1.add(this);
    }

    constructor() {
      super();
      this.constructor.setup();
      properties.set(this, {});
    }

    set(key, value) {
      properties.get(this)[key] = value;
    }

    get(key) {
      return properties.get(this)[key];
    }

    connectedCallback() {
      const { constructor } = this;
      const { properties } = constructor;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const { required } = properties[key];
        let absent = this[key] == null;
        // if absent, apply default value
        if (absent && properties[key].hasOwnProperty('default')) {
          this[key] = properties[key].default.call(this);
        } else if (required) {
          console.warn(
            `Required property '${key}' was not passed down to`,
            this
          );
        }
      }

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }
  }
});

const finalized$2 = new WeakSet();
const observedProperties = new WeakMap();
const batches = new WeakMap();
const debouncers = new WeakMap();

/**
 * A mixin that batches property changes and delivers them
 * in `propertiesChangedCallback`.
 * 
 * @param {HTMLElement} SuperClass 
 */
const PropertiesChangedMixin = Mixin(SuperClass => {
  const Base = PropertyAccessorsMixin(SuperClass);

  return class PropertiesChangedElement extends Base {
    static setup() {
      if (finalized$2.has(this)) {
        return;
      }

      super.setup();

      if (this.observedProperties) {
        observedProperties.set(
          this,
          new Set(this.observedProperties)
        );
      } else {
        const { properties } = this;
        observedProperties.set(this, new Set(
          Object.keys(properties)
            .filter(key => properties[key].observe !== false)
        ));
      }

      finalized$2.add(this);
    }

    constructor() {
      super();
      this.constructor.setup();
      batches.set(this, {});
    }

    set(name, newValue) {
      const oldValue = this.get(name);
      super.set(name, newValue);
      if (!observedProperties.get(this.constructor).has(name)) {
        return;
      }

      // Apply the changes to the pending batch
      const batch = batches.get(this);
      if (batch[name] != null) {
        batch[name].newValue = newValue;
      } else {
        batch[name] = {
          name,
          oldValue,
          newValue
        };
      }

      // Reset the debouncer
      clearTimeout(debouncers.get(this));
      debouncers.set(
        this,
        setTimeout(() => {
          this.propertiesChangedCallback(batch);
          batches.set(this, {});
        }, 1)
      );
    }

    propertiesChangedCallback(changes) {}

    flushPropertyChanges() {
      clearTimeout(debouncers.get(this));
      debouncers.delete(this);
      this.propertiesChangedCallback(batches.get(this));
      batches.set(this, {});
    }
  }
});

const finalized$3 = new WeakSet();
const observedProperties$1 = new WeakMap();

const PropertyChangedMixin = Mixin(SuperClass => {
  const Base = PropertyAccessorsMixin(SuperClass);

  return class PropertyChangedElement extends Base {

    static setup() {
      super.setup();

      if (finalized$3.has(this)) {
        return;
      }


      if (this.observedProperties) {
        observedProperties$1.set(
          this,
          new Set(this.observedProperties)
        );
      } else {
        const properties = this.properties;
        observedProperties$1.set(this, new Set(
          Object.keys(properties)
            .filter(key => properties[key].observe !== false)
        ));
      }

      finalized$3.add(this);
    }

    constructor() {
      super();
      this.constructor.setup();
    }

    set(key, value) {
      const oldValue = this[key];
      super.set(key, value);
      const { constructor } = this;
      if (observedProperties$1.get(constructor).has(key)) {
        this.propertyChangedCallback(key, oldValue, value);
      }
    }

    propertyChangedCallback(name, oldValue, newValue) {}
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

const finalized$4 = new WeakSet();

const ShadyTemplateMixin = Mixin(SuperClass => {
  const Base = StaticTemplateMixin(SuperClass);
  return class ShadyTemplateElement extends Base {
    constructor() {
      super();
      const ctor = this.constructor;
      if (!ctor.template || finalized$4.has(ctor)) {
        return;
      }

      if (emulated) {
        ShadyCSS.prepareTemplate(ctor.template, this.localName);
      }

      finalized$4.add(ctor);
    }

    connectedCallback() {
      super.connectedCallback();
      if (finalized$4.has(this.constructor)) {
        if (emulated) {
          ShadyCSS.styleElement(this);
        }
      }
    }
  }
});

const onClick = Symbol();
const onKeydown = Symbol();

const ToggleMixin = Mixin(SuperClass => {
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

export { AttributeMixin, BaseMixin, connector, ControlMixin, FocusMixin, PropertiesChangedMixin, PropertyAccessorsMixin, PropertyChangedMixin, ShadyTemplateMixin, StaticTemplateMixin, html, ToggleMixin };
