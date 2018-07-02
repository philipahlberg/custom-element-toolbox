import { has } from '@philipahlberg/scratchpad';

const finalized = new WeakSet();
const observedProperties = new WeakMap();

const warn = (self) => {
  console.error('PropertyChangedMixin requires PropertyAccessorMixin to be applied first.');
  console.error('Source:', self);
};

export const PropertyChangedMixin = SuperClass =>
  class PropertyChangedElement extends SuperClass {

    static setup() {
      if (finalized.has(this) || !has(this, 'properties')) {
        return;
      }

      if (super.setup != null) {
        super.setup();
      } else {
        warn(this);
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

      finalized.add(this);
    }

    constructor() {
      super();
      this.constructor.setup();
    }

    set(key, value) {
      const oldValue = this[key];
      super.set(key, value);
      if (observedProperties.get(this.constructor).has(key)) {
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
