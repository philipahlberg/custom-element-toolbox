import { Mixin } from './mixin.js';
import { PropertyAccessorsMixin } from './property-accessors-mixin.js';

const finalized = new WeakSet();
const observedProperties = new WeakMap();

export const PropertyChangedMixin = Mixin(SuperClass => {
  const Base = PropertyAccessorsMixin(SuperClass);

  return class PropertyChangedElement extends Base {

    static setup() {
      super.setup();

      if (finalized.has(this)) {
        return;
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
    }

    set(key, value) {
      const oldValue = this[key];
      super.set(key, value);
      const { constructor } = this;
      if (observedProperties.get(constructor).has(key)) {
        this.propertyChangedCallback(key, oldValue, value);
      }
    }

    propertyChangedCallback(name, oldValue, newValue) {}
  }
});