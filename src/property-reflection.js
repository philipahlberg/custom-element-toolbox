import { Mixin } from './mixin.js';
import { PropertyChanged } from './property-changed.js';
import { toDashCase } from './shared.js';

/**
 * Declaratively reflect properties to attributes.
 * 
 * Maps `camelCase` properties to `dash-case` attributes.
 */
export const PropertyReflection = Mixin(SuperClass => {
  const Super = PropertyChanged(SuperClass);
  const names = new Map();
  const finalized = new WeakSet();

  return class extends Super {
    static setup() {
      super.setup();

      if (finalized.has(this)) {
        return;
      }

      const properties = this.properties;
      if (properties === undefined) return;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const reflect = properties[key].reflectToAttribute;
        if (reflect) {
          // Names are shared between all instances
          // so we might have already translated this key.
          if (names.has(key)) continue;
          const attribute = toDashCase(key);
          names.set(key, attribute);
        }
      }

      finalized.add(this);
    }

    propertyChangedCallback(property, oldValue, newValue) {
      super.propertyChangedCallback(property, oldValue, newValue);
      if (oldValue === newValue) return;

      const properties = this.constructor.properties;
      const conf = properties[property];
      const type = conf.type;
      const reflect = conf.reflectToAttribute;
      if (reflect) {
        const attribute = names.get(property);
        if (newValue === false) {
          this.removeAttribute(attribute);
        } else {
          if (type === Boolean) {
            this.setAttribute(attribute, '');
          } else {
            this.setAttribute(attribute, newValue);
          }
        }
      }
    }
  }
});

export { PropertyReflection as PropertyReflectionMixin };