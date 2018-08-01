import { Mixin } from './mixin.js';
import { PropertyAccessorsMixin } from './property-accessors-mixin.js';

const finalized = new WeakSet();
const observedProperties = new WeakMap();
const batches = new WeakMap();
const debouncers = new WeakMap();

/**
 * A mixin that batches property changes and delivers them
 * in `propertiesChangedCallback`.
 * 
 * @param {HTMLElement} SuperClass 
 */
export const PropertiesChangedMixin = Mixin(SuperClass => {
  const Base = PropertyAccessorsMixin(SuperClass);

  return class PropertiesChangedElement extends Base {
    static setup() {
      if (finalized.has(this)) {
        return;
      }

      super.setup();

      if (this.observedProperties) {
        observedProperties.set(
          this,
          new Set(this.observedProperties)
        );
      } else {
        const { properties } = this;
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
      batches.set(this, {});
    }

    set(name, newValue) {
      const oldValue = this.get(name);
      super.set(name, newValue);
      if (!observedProperties.get(this.constructor).has(name)) {
        return;
      }

      // Apply the changes to the pending batch
      const batch = batches.get(this);
      if (batch[name] != null) {
        batch[name].newValue = newValue;
      } else {
        batch[name] = {
          name,
          oldValue,
          newValue
        };
      }

      // Reset the debouncer
      clearTimeout(debouncers.get(this));
      debouncers.set(
        this,
        setTimeout(() => {
          this.propertiesChangedCallback(batch);
          batches.set(this, {});
        }, 1)
      );
    }

    propertiesChangedCallback(changes) {}

    flushPropertyChanges() {
      clearTimeout(debouncers.get(this));
      debouncers.delete(this);
      this.propertiesChangedCallback(batches.get(this));
      batches.set(this, {});
    }
  }
});