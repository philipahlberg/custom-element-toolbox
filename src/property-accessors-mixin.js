import { has, empty } from '@philipahlberg/scratchpad';

const finalized = new WeakSet();
const properties = new WeakMap();

export const PropertyAccessorsMixin = SuperClass =>
  class PropertyAccessorsElement extends SuperClass {

    static setup() {
      if (finalized.has(this)) {
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

      finalized.add(this);
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
