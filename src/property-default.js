import { Mixin } from './mixin.js';
import { PropertyChanged } from './property-changed.js';

export const PropertyDefault = Mixin(SuperClass => {
  const Super = PropertyChanged(SuperClass);

  return class extends Super {
    connectedCallback() {
      super.connectedCallback();
      const ctor = this.constructor;
      const properties = ctor.properties;
      if (properties === undefined) return;
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

export { PropertyDefault as PropertyDefaultMixin };