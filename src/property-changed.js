import { Mixin } from './mixin.js';

export const PropertyChanged = Mixin(SuperClass => {
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
      if (properties != null) {
        const keys = Object.keys(properties);
        for (const key of keys) {
          if (!this.hasOwnProperty(key)) continue;
          const value = this[key];
          delete this[key];
          this[key] = value;
        }
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
  };
});

export { PropertyChanged as PropertyChangedMixin };
