import { toDashCase, toCamelCase, has, empty } from './utils.js';

function isPrimitive(type) {
  switch (type) {
    case String:
    case Number:
    case Boolean:
      return true;
    default:
      return false;
  }
}

const finalized = new WeakSet();
const properties = new WeakMap();
const observers = new WeakMap();
const batches = new WeakMap();

function setter(key) {
  return function(newValue) {
    const oldValue = properties.get(this)[key];
    properties.get(this)[key] = newValue;
    const obs = observers.get(this.constructor)[key];
    const len = obs.length;
    for (let i = 0; i < len; i++) {
      obs[i].call(this, key, oldValue, newValue);
    }
  }
}

function getter(key) {
  return function() {
    return properties.get(this)[key];
  }
}

function reflector(type, attributeName) {
  switch (type) {
    case Number:
    case String:
      return function(_, __, newValue) {
        this.setAttribute(attributeName, newValue);
      }
    case Boolean:
      return function(_, __, newValue) {
        if (newValue) {
          this.setAttribute(attributeName, '');
        } else {
          this.removeAttribute(attributeName);
        }
      }
  }
}

function propertyChanged(key, oldValue, newValue) {
  this.propertyChangedCallback(key, oldValue, newValue);
}

export const PropertiesMixin = (SuperClass) => (class PropertiesElement extends SuperClass {
  static get observedAttributes() {
    const props = this.properties;
    return props ? Object.entries(props)
      .filter(([prop, opts]) => isPrimitive(opts.type))
      .map(([prop, opts]) => toDashCase(prop)) : [];
  }

  static setup() {
    if (finalized.has(this)) {
      return;
    }

    observers.set(this, empty());
    this.mappedAttributes = new Set();

    for (const key in this.properties) {
      Object.defineProperty(this.prototype, key, {
        configurable: true,
        enumerable: true,
        get: getter(key),
        set: setter(key)
      });

      const { type, reflect, observe } = this.properties[key];

      const obs = observers.get(this)[key] = [];
      if (observe) {
        obs.push(propertyChanged);
      }

      if (reflect) {
        const attributeName = toDashCase(key);
        this.mappedAttributes.add(attributeName);
        obs.push(reflector(type, attributeName));
      }
    }

    finalized.add(this);
  }

  constructor() {
    super();
    this.constructor.setup();
    properties.set(this, empty());
    batches.set(this, empty());
  }

  connectedCallback() {
    const constructor = this.constructor;
    if (!has(constructor, 'properties')) {
      return;
    }

    const options = constructor.properties;
    for (const key in options) {
      const { type, required } = options[key];
      let absent = this[key] == null;
      let value;

      // Attempt to read from attribute if absent
      const attributeName = toDashCase(key);
      if (absent && this.hasAttribute(attributeName)) {
        const raw = this.getAttribute(attributeName);
        this.removeAttribute(attributeName);

        switch (type) {
          case String:
            value = raw;
            break;
          case Number:
            value = Number(raw);
            break;
          case Boolean:
            value = raw != null;
            break;
          default:
            value = JSON.parse(raw);
            break;
        }

        absent = value == null;
        if (!absent) {
          this[key] = value;
        }
      }

      // if (still) absent, apply default value
      if (absent && has(options[key], 'default')) {
        this[key] = options[key].default.call(this);
      } else if (required) {
        console.warn(`Required property '${key}' was not passed down to`, this);
      }
    }

    if (super.connectedCallback) {
      super.connectedCallback();
    }
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    if (
      this.constructor.mappedAttributes.has(attr) &&
      oldValue !== newValue
    ) {
      const prop = toCamelCase(attr);
      const options = this.constructor.properties;
      const type = options[prop] && options[prop].type || String;
      const old = properties.get(this)[prop];
      let updated;
      switch (type) {
        case String:
          updated = newValue;
          break;
        case Number:
          updated = Number(newValue);
          break;
        case Boolean:
          updated = newValue != null;
          break;
      }

      properties.get(this)[prop] = updated;
      this.propertyChangedCallback(prop, old, updated);
    }

    if (super.attributeChangedCallback) {
      super.attributeChangedCallback(attr, oldValue, newValue);
    }
  }

  propertyChangedCallback(name, oldValue, newValue) {
    clearTimeout(this._debouncer);
    const batch = batches.get(this);
    batch[name] = {
      name,
      oldValue,
      newValue
    };
    this._debouncer = setTimeout(() => {
      this.propertiesChangedCallback(batch);
      batches.set(this, empty());
    }, 1);
  }

  propertiesChangedCallback(changes) {}

  flushPropertyChanges() {
    clearTimeout(this._debouncer);
    this.propertiesChangedCallback(batches.get(this));
    batches.set(this, empty());
  }
});
