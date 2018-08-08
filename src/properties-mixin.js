import { Mixin } from './mixin.js';
import { PropertyChangedMixin } from './property-changed-mixin.js';
import { PropertyObserverMixin } from './property-observer-mixin.js';
import { PropertyReflectionMixin } from './property-reflection-mixin.js';

export const PropertiesMixin = Mixin(SuperClass => {
  const Base = PropertyReflectionMixin(
    PropertyObserverMixin(
      PropertyChangedMixin(
        SuperClass
      )
    )
  );

  return class PropertiesElement extends Base {}
});