import { Mixin } from './mixin.js';
import { PropertyChanged } from './property-changed.js';
import { PropertyObserver } from './property-observer.js';
import { PropertyReflection } from './property-reflection.js';
import { PropertyDefault } from './property-default.js';

export const Properties = Mixin(SuperClass => {
  const Base = PropertyDefault(
    PropertyReflection(PropertyObserver(PropertyChanged(SuperClass)))
  );

  return class PropertiesElement extends Base {};
});

export { Properties as PropertiesMixin };
