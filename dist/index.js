/**
 * Convert 'PascalCase' or 'camelCase' to 'dash-case'.
 * @param str A PascalCase og camelCase string
 */
function toDashCase(str) {
    return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}
function has(target, prop) {
    return target.hasOwnProperty(prop);
}
function empty() {
    return Object.create(null);
}
/**
 * Shorthand for `Object.freeze`.
 * @param object
 */
function freeze(object) {
    return Object.freeze(object);
}
const EMPTY = freeze(empty());

function isSerializableType(type) {
  return type === String ||
    type === Number ||
    type === Boolean;
}

const finalized = new WeakSet();
const attributeToProperty = new Map();
const propertyToAttribute = new Map();

/**
 * A very simple mixin for synchronizing primitive properties with attributes.
 * Maps `camelCase` properties to `dash-case` attributes.
 * `String` property values map directly to attribute values.
 * `Boolean` property values toggle/check the existence of attributes.
 * `Number` property values are coerced with `Number()`.
 * 
 * Note: This mixin requires `PropertyAccessorMixin`.
 */
const AttributeMixin = SuperClass =>
  class AttributeElement extends SuperClass {

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
      if (finalized.has(this) || !has(this, 'properties')) {
        return;
      }

      super.setup();

      const properties = this.properties;
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
      const constructor = this.constructor;
      if (has(constructor, 'properties')) {
        const options = Object.keys(constructor.properties);
        for (const key of options) {
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

    /**
     * Toggle an attribute.
     * @param {String} name name of the attribute to toggle.
     * @param {Boolean} predicate decides whether to set or remove the attribute.
     */
    toggleAttribute(name, predicate) {
      if (predicate != null) {
        if (predicate) {
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
    }
  };

const batches = new WeakMap();
const debouncers = new WeakMap();

/**
 * A mixin that batches `attributeChangedCallback` changes
 * and delivers them in `attributesChangedCallback`.
 * 
 * @param {*} SuperClass 
 */
const AttributesChangedMixin = SuperClass =>
  class AttributesChangedElement extends SuperClass {

    constructor() {
      super();
      batches.set(this, empty());
    }

    attributeChangedCallback(name, oldValue, newValue) {
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
            this.attributesChangedCallback(batch);
            batches.set(this, empty());
          }, 1)
        );
    }

    attributesChangedCallback(changes) {}

    flushAttributeChanges() {
      clearTimeout(debouncers.get(this));
      debouncers.delete(this);
      this.attributesChangedCallback(batches.get(this));
      batches.set(this, empty());
    }
  };

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
        subscriptions.set(this, store.subscribe(update));
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

const FocusMixin = SuperClass =>
  class FocusElement extends SuperClass {
    static get observedAttributes() {
      return (super.observedAttributes || []).concat(['disabled']);
    }

    set disabled(value) {
      if (value) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }

    set focused(value) {
      if (value) {
        this.setAttribute('focused', '');
      } else {
        this.removeAttribute('focused');
      }
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
      this.addEventListener('focus', this.onFocus.bind(this));
      this.addEventListener('blur', this.onBlur.bind(this));

      if (!this.hasAttribute('tabindex') && !this.disabled) {
        this.setAttribute('tabindex', '0');
      }

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }

    focus() {
      super.focus();
      if (!this.disabled) {
        this.dispatchEvent(new Event('focus'));
      }
    }

    onFocus(event) {
      this.focused = true;
    }

    blur() {
      super.blur();
      this.dispatchEvent(new Event('blur'));
    }

    onBlur(event) {
      this.focused = false;
    }
  };

const MinimalMixin = SuperClass =>
  class extends SuperClass {
    /**
     * Convenience function for emitting a custom event.
     * @param {string} type
     * @param {*} detail
     * @param {CustomEventInit} options
     */
    emit(type, detail, options) {
      const init = Object.assign(
        {
          bubbles: true,
          cancelable: true,
          detail
        },
        options
      );
      return this.dispatchEvent(new CustomEvent(type, init));
    }

    on(type, listener) {
      this.addEventListener(type, listener);
    }

    off(type, listener) {
      this.removeEventListener(type, listener);
    }
  };

const finalized$1 = new WeakSet();
const observedProperties = new WeakMap();
const batches$1 = new WeakMap();
const debouncers$1 = new WeakMap();

const warn = () => {
  console.error('PropertiesChangedMixin requires PropertyAccessorMixin to be applied first.');
};

/**
 * A mixin that batches property changes and delivers them
 * in `propertiesChangedCallback`.
 * 
 * @param {*} SuperClass 
 */
const PropertiesChangedMixin = SuperClass =>
  class PropertiesChangedElement extends SuperClass {

    static setup() {
      if (finalized$1.has(this) || !has(this, 'properties')) {
        return;
      }

      if (super.setup != null) {
        super.setup();
      } else {
        warn();
      }

      if (this.observedProperties) {
        observedProperties.set(
          this,
          new Set(this.observedProperties)
        );
      } else {
        const properties = this.properties;
        observedProperties.set(this, new Set(
          Object.keys(properties)
            .filter(key => properties[key].observe !== false)
        ));
      }

      finalized$1.add(this);
    }

    constructor() {
      super();
      this.constructor.setup();
      batches$1.set(this, empty());
    }

    set(name, newValue) {
      const oldValue = this.get(name);
      super.set(name, newValue);
      if (!observedProperties.get(this.constructor).has(name)) {
        return;
      }

      // Apply the changes to the pending batch
      const batch = batches$1.get(this);
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
      clearTimeout(debouncers$1.get(this));
      debouncers$1.set(
        this,
        setTimeout(() => {
          this.propertiesChangedCallback(batch);
          batches$1.set(this, empty());
        }, 1)
      );
    }

    propertiesChangedCallback(changes) {}

    flushPropertyChanges() {
      clearTimeout(debouncers$1.get(this));
      debouncers$1.delete(this);
      this.propertiesChangedCallback(batches$1.get(this));
      batches$1.set(this, empty());
    }
  };

const finalized$2 = new WeakSet();
const properties = new WeakMap();

const PropertyAccessorsMixin = SuperClass =>
  class PropertyAccessorsElement extends SuperClass {

    static setup() {
      if (finalized$2.has(this)) {
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

      finalized$2.add(this);
    }

    constructor() {
      super();
      this.constructor.setup();
      properties.set(this, empty());
    }

    set(key, value) {
      properties.get(this)[key] = value;
    }

    get(key) {
      return properties.get(this)[key];
    }

    connectedCallback() {
      const constructor = this.constructor;
      if (!has(constructor, 'properties')) {
        return;
      }

      const properties = constructor.properties;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const { required } = properties[key];
        let absent = this[key] == null;
        // if absent, apply default value
        if (absent && has(properties[key], 'default')) {
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
  };

const finalized$3 = new WeakSet();
const observedProperties$1 = new WeakMap();

const warn$1 = (self) => {
  console.error('PropertyChangedMixin requires PropertyAccessorMixin to be applied first.');
  console.error('Source:', self);
};

const PropertyChangedMixin = SuperClass =>
  class PropertyChangedElement extends SuperClass {

    static setup() {
      if (finalized$3.has(this) || !has(this, 'properties')) {
        return;
      }

      if (super.setup != null) {
        super.setup();
      } else {
        warn$1(this);
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
      if (observedProperties$1.get(this.constructor).has(key)) {
        this.propertyChangedCallback(key, oldValue, value);
      }
    }

    connectedCallback() {
      if (super.connectedCallback != null) {
        super.connectedCallback();
      }

      const constructor = this.constructor;
      if (!has(constructor, 'properties')) {
        return;
      }

      const properties = constructor.properties;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const property = properties[key];
        const { required } = property;
        const absent = this[key] == null;

        // if absent, apply default value
        if (absent && has(property, 'default')) {
          this[key] = property.default.call(this);
        } else if (required) {
          console.warn(
            `Required property '${key}' was not passed down to`,
            this
          );
        }
      }
    }

    propertyChangedCallback(name, oldValue, newValue) {}
  };

const StaticTemplateMixin = SuperClass =>
  class StaticTemplateElement extends SuperClass {
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
  };

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
const emulated =
  ShadyCSS != null && (!ShadyCSS.nativeShadow || !ShadyCSS.nativeCss);

const finalized$4 = new WeakSet();

const ShadyTemplateMixin = SuperClass => {
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
  };
};

export { AttributeMixin, AttributesChangedMixin, connector, FocusMixin, MinimalMixin, PropertiesChangedMixin, PropertyAccessorsMixin, PropertyChangedMixin, ShadyTemplateMixin, StaticTemplateMixin, html };
