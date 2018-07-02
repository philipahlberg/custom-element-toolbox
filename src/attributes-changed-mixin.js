import { empty } from '@philipahlberg/scratchpad';

const batches = new WeakMap();
const debouncers = new WeakMap();

/**
 * A mixin that batches `attributeChangedCallback` changes
 * and delivers them in `attributesChangedCallback`.
 * 
 * @param {*} SuperClass 
 */
export const AttributesChangedMixin = SuperClass =>
  class AttributesChangedElement extends SuperClass {

    constructor() {
      super();
      batches.set(this, empty());
    }

    attributeChangedCallback(name, oldValue, newValue) {
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
            this.attributesChangedCallback(batch);
            batches.set(this, empty());
          }, 1)
        );
    }

    attributesChangedCallback(changes) {}

    flushAttributeChanges() {
      clearTimeout(debouncers.get(this));
      debouncers.delete(this);
      this.attributesChangedCallback(batches.get(this));
      batches.set(this, empty());
    }
  };
