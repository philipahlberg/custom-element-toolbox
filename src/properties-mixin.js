import { Mixin } from './mixin.js';

const finalized = new WeakSet();
const data = new WeakMap();

export const PropertiesMixin = Mixin(SuperClass => {
  return class PropertiesElement extends SuperClass {
    static setup() {
      if (finalized.has(this)) {
        return;
      }

      const { prototype, properties } = this;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
        if (descriptor != null) continue;

        function get() {
          return data.get(this)[key];
        }

        function set(value) {
          const oldValue = data.get(this)[key];
          data.get(this)[key] = value;
          this.propertyChangedCallback(key, oldValue, value);          
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
      this.constructor.setup();
      data.set(this, {});
    }

    propertyChangedCallback(key, oldValue, newValue) {}
  }
});