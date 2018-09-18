import { Mixin } from './mixin.js';
import { PropertyChanged } from './property-changed.js';

export const PropertyObserver = Mixin(SuperClass => {
  const Super = PropertyChanged(SuperClass);

  return class extends Super {
    propertyChangedCallback(key, oldValue, newValue) {
      super.propertyChangedCallback(key, oldValue, newValue);
      const properties = this.constructor.properties;
      const observer = properties[key].observer;
      if (observer != null) {
        this[observer](newValue, oldValue);
      }
    }
  };
});

export { PropertyObserver as PropertyObserverMixin };
