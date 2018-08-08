import { Mixin } from './mixin.js';

export const PropertyChangedMixin = Mixin(SuperClass => {

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