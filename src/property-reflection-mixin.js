import { Mixin } from './mixin.js';
import { PropertyChangedMixin } from './property-changed-mixin.js';
import { toDashCase } from './shared.js';

/**
 * Declaratively reflect properties to attributes.
 * 
 * Maps `camelCase` properties to `dash-case` attributes.
 */
export const PropertyReflectionMixin = Mixin(SuperClass => {
  const Base = PropertyChangedMixin(SuperClass);
  const names = new Map();
  let finalized = false;

  return class extends Base {
    static setup() {
      super.setup();

      if (finalized) {
        return;
      }

      const properties = this.properties;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const reflect = properties[key].reflectToAttribute;
        if (reflect) {
          const attribute = toDashCase(key);
          names.set(key, attribute);
        }
      }

      finalized = true;
    }

    propertyChangedCallback(property, oldValue, newValue) {
      super.propertyChangedCallback(property, oldValue, newValue);
      if (oldValue === newValue) {
        return;
      }

      const properties = this.constructor.properties;
      const conf = properties[property];
      const type = conf.type;
      const reflect = conf.reflectToAttribute;
      if (reflect) {
        const attribute = names.get(property);
        if (!newValue) {
          this.removeAttribute(attribute);
        } else {
          switch (type) {
            case Boolean:
              this.setAttribute(attribute, '');
              break;
            default:
              this.setAttribute(attribute, newValue);
          }
        }
      }
    }
  }
});