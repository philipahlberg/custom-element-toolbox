import { Mixin } from './mixin.js';
import { toDashCase } from './shared.js';

/**
 * Set properties in reaction to attributes changing.
 * 
 * Maps `dash-case` attributes to `camelCase` properties.
 */
export const AttributeDeserializationMixin = Mixin(SuperClass => {
  const names = new Map();
  const finalized = new WeakSet();
  const isSerializing = new Set();

  return class extends SuperClass {
    static setup() {
      super.setup();
      if (finalized.has(this)) return;
      const properties = this.properties;
      if (properties === undefined) return;
      const keys = Object.keys(properties);
      for (const key of keys) {
        // Names are shared between all instances
        // so we might have already translated this key.
        if (names.has(key)) continue;
        const attribute = toDashCase(key);
        names.set(key, attribute);
      }

      finalized.add(this);
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
