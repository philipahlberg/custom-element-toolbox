import { Mixin } from './mixin.js';
import { PropertyChangedMixin } from './property-changed-mixin.js';

export const PropertyObserverMixin = Mixin(SuperClass => {
  const Base = PropertyChangedMixin(SuperClass);

  return class extends Base {
    propertyChangedCallback(key, oldValue, newValue) {
      super.propertyChangedCallback(key, oldValue, newValue);
      const properties = this.constructor.properties;
      const observer = properties[key].observer;
      if (observer != null) {
        this[observer](newValue, oldValue);
      }
    }
  }
});