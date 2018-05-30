/**
 * Convert 'PascalCase' or 'camelCase' to 'dash-case'.
 * @param str A PascalCase og camelCase string
 */
function toDashCase(str) {
    return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}
/**
 * Convert 'dash-case' to 'camelCase'.
 * @param str A camelCase string
 */
function toCamelCase(str) {
    return str.replace(/-([a-z])/ig, (m) => m[1].toUpperCase());
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

function getter(type, key) {
  switch (type) {
    case String:
      return function() {
        return this.getAttribute(key);
      };
    case Boolean:
      return function() {
        return this.hasAttribute(key);
      };
    case Number:
      return function() {
        return Number(this.getAttribute(key));
      };
  }
}

function setter(type, key) {
  switch (type) {
    case String:
    case Number:
      return function(v) {
        this.setAttribute(key, v);
      };
    case Boolean:
      return function(v) {
        this.toggleAttribute(key, v);
      };
  }
}

const finalized = new WeakSet();

/**
 * A very simple mixin for synchronizing primitive properties with attributes.
 * Maps `camelCase` properties to `dash-case` attributes.
 * `String` property values map directly to attribute values.
 * `Boolean` property values toggle the existence of attributes.
 * `Number` property values are coerced with `Number()`.
 * Note: This mixin prohibits the use of `PropertiesMixin`.
 */
const AttributeMixin = SuperClass =>
  class extends SuperClass {
    constructor() {
      super();
      const ctor = this.constructor;
      if (finalized.has(ctor) || !ctor.hasOwnProperty('properties')) {
        return;
      }

      const prototype = ctor.prototype;
      const properties = Object.keys(ctor.properties);
      for (const key of properties) {
        const { type, reflect } = properties[key];
        if (reflect !== false) {
          const attribute = toDashCase(key);
          Object.defineProperty(prototype, key, {
            configurable: true,
            enumerable: true,
            get: getter(type, attribute),
            set: setter(type, attribute)
          });
        }
      }

      finalized.add(ctor);
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

const connector = (store) => {
  const subscriptions = new WeakMap();

  return (SuperClass, map) => class extends SuperClass {
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
  class extends SuperClass {
    static get observedAttributes() {
      return (super.observedAttributes || []).concat(['disabled']);
    }

    set disabled(v) {
      if (v) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }

    set focused(v) {
      if (v) {
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

function isPrimitive$1(type) {
  switch (type) {
    case String:
    case Number:
    case Boolean:
      return true;
    default:
      return false;
  }
}

const finalized$1 = new WeakSet();
const properties = new WeakMap();
const observers = new WeakMap();
const batches = new WeakMap();
const debouncers = new WeakMap();

function setter$1(key) {
  return function(newValue) {
    const oldValue = properties.get(this)[key];
    properties.get(this)[key] = newValue;
    const obs = observers.get(this.constructor)[key];
    const len = obs.length;
    for (let i = 0; i < len; i++) {
      obs[i].call(this, key, oldValue, newValue);
    }
  };
}

function getter$1(key) {
  return function() {
    return properties.get(this)[key];
  };
}

function reflector(type, attributeName) {
  switch (type) {
    case Number:
    case String:
      return function(_, __, newValue) {
        this.setAttribute(attributeName, newValue);
      };
    case Boolean:
      return function(_, __, newValue) {
        if (newValue) {
          this.setAttribute(attributeName, '');
        } else {
          this.removeAttribute(attributeName);
        }
      };
  }
}

function propertyChanged(name, oldValue, newValue) {
  this.propertyChangedCallback(name, oldValue, newValue);
}

function propertiesChanged(name, oldValue, newValue) {
  const batch = batches.get(this);
  if (batch[name]) {
    batch[name].newValue = newValue;
  } else {
    batch[name] = {
      name,
      oldValue,
      newValue
    };
  }

  clearTimeout(debouncers.get(this));
  debouncers.set(
    this,
    setTimeout(() => {
      this.propertiesChangedCallback(batch);
      batches.set(this, empty());
    }, 1)
  );
}

const PropertiesMixin = SuperClass =>
  class extends SuperClass {
    static get observedAttributes() {
      const props = this.properties;
      return props
        ? Object.entries(props)
            .filter(([prop, opts]) => isPrimitive$1(opts.type))
            .map(([prop, opts]) => toDashCase(prop))
        : [];
    }

    static setup() {
      if (finalized$1.has(this)) {
        return;
      }

      observers.set(this, empty());
      this.mappedAttributes = new Set();

      for (const key in this.properties) {
        Object.defineProperty(this.prototype, key, {
          configurable: true,
          enumerable: true,
          get: getter$1(key),
          set: setter$1(key)
        });

        const { type, reflect, observe } = this.properties[key];

        const obs = (observers.get(this)[key] = []);
        if (observe) {
          obs.push(propertyChanged);
          obs.push(propertiesChanged);
        }

        if (reflect) {
          const attributeName = toDashCase(key);
          this.mappedAttributes.add(attributeName);
          obs.push(reflector(type, attributeName));
        }
      }

      finalized$1.add(this);
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

    attributeChangedCallback(attr, oldValue, newValue) {
      if (
        this.constructor.mappedAttributes.has(attr) &&
        oldValue !== newValue
      ) {
        const prop = toCamelCase(attr);
        const options = this.constructor.properties;
        const type = (options[prop] && options[prop].type) || String;
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

    propertyChangedCallback(name, oldValue, newValue) {}

    propertiesChangedCallback(changes) {}

    flushPropertyChanges() {
      clearTimeout(debouncers.get(this));
      debouncers.delete(this);
      this.propertiesChangedCallback(batches.get(this));
      batches.set(this, empty());
    }
  };

const StaticTemplateMixin = SuperClass =>
  class extends SuperClass {
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

const finalized$2 = new WeakSet();

const ShadyTemplateMixin = SuperClass => {
  const Base = StaticTemplateMixin(SuperClass);

  return class ShadyTemplateElement extends Base {
    constructor() {
      super();
      const ctor = this.constructor;
      if (!ctor.template || finalized$2.has(ctor)) {
        return;
      }

      if (emulated) {
        ShadyCSS.prepareTemplate(ctor.template, this.localName);
      }

      finalized$2.add(ctor);
    }

    connectedCallback() {
      super.connectedCallback();
      if (finalized$2.has(this.constructor)) {
        if (emulated) {
          ShadyCSS.styleElement(this);
        }
      }

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }
  };
};

export { AttributeMixin, connector, FocusMixin, MinimalMixin, PropertiesMixin, ShadyTemplateMixin, StaticTemplateMixin, html };
