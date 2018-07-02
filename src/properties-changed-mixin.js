import { has, empty } from '@philipahlberg/scratchpad';

const finalized = new WeakSet();
const observedProperties = new WeakMap();
const batches = new WeakMap();
const debouncers = new WeakMap();

const warn = () => {
  console.error('PropertiesChangedMixin requires PropertyAccessorMixin to be applied first.');
};

/**
 * A mixin that batches property changes and delivers them
 * in `propertiesChangedCallback`.
 * 
 * @param {*} SuperClass 
 */
export const PropertiesChangedMixin = SuperClass =>
  class PropertiesChangedElement extends SuperClass {

    static setup() {
      if (finalized.has(this) || !has(this, 'properties')) {
        return;
      }

      if (super.setup != null) {
        super.setup();
      } else {
        warn();
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
      batches.set(this, empty());
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
          batches.set(this, empty());
        }, 1)
      );
    }

    propertiesChangedCallback(changes) {}

    flushPropertyChanges() {
      clearTimeout(debouncers.get(this));
      debouncers.delete(this);
      this.propertiesChangedCallback(batches.get(this));
      batches.set(this, empty());
    }
  };
