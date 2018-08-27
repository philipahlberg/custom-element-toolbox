import { Mixin } from './mixin.js';

export const Base = Mixin(SuperClass => {
  return class BaseElement extends SuperClass {
    /**
     * Toggle a boolean attribute (removing it if it is present
     * and adding it if it is not present) on the specified element.
     * 
     * @param {String} name A string specifying the name of the attribute
     * to be toggled.
     * @param {Boolean} force A boolean value to determine whether the
     * attribute should be added or removed, no matter whether the
     * attribute is present or not at the moment.
     * 
     * @returns {Boolean} true if attribute name is eventually present, 
     * and false otherwise.
     */
    toggleAttribute(name, force) {
      if (force != null) {
        if (force) {
          this.setAttribute(name, '');
        } else {
          this.removeAttribute(name);
        }
      } else {
        if (this.hasAttribute(name)) {
          this.removeAttribute(name);
        } else {
          this.setAttribute(name, '');
        }
      }

      return force || this.hasAttribute(name);
    }
  }
});

export { Base as BaseMixin };