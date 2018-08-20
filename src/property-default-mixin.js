import { Mixin } from './mixin.js';
import { PropertyChangedMixin } from './property-changed-mixin.js';

export const PropertyDefaultMixin = Mixin(SuperClass => {
  const Base = PropertyChangedMixin(SuperClass);

  return class extends Base {
    connectedCallback() {
      super.connectedCallback();
      const ctor = this.constructor;
      const properties = ctor.properties;
      const keys = Object.keys(properties);

      for (const key of keys) {
        if (this[key] != null) continue;
        const property = properties[key];
        if (property.default == null) continue;
        this[key] = property.default();
      }
    }
  }
});