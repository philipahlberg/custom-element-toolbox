import { toDashCase } from './utils.js';

function getter(type, key) {
  switch (type) {
    case String:
      return function() {
        return this.getAttribute(key);
      };
    case Boolean:
      return function() {
        return this.hasAttribute(key);
      };
    case Number:
      return function() {
        return Number(this.getAttribute(key));
      };
  }
}

function setter(type, key) {
  switch (type) {
    case String:
    case Number:
      return function(v) {
        this.setAttribute(key, v);
      };
    case Boolean:
      return function(v) {
        this.toggleAttribute(key, v);
      };
  }
}

const finalized = new WeakSet();

/**
 * A very simple mixin for synchronizing primitive properties with attributes.
 * Maps `camelCase` properties to `dash-case` attributes.
 * `String` property values map directly to attribute values.
 * `Boolean` property values toggle the existence of attributes.
 * `Number` property values are coerced with `Number()`.
 * Note: This mixin prohibits the use of `PropertiesMixin`.
 */
export const AttributeMixin = (SuperClass) => (class AttributeElement extends SuperClass {
  constructor() {
    super();
    const ctor = this.constructor;
    if (finalized.has(ctor) || !ctor.hasOwnProperty('properties')) {
      return;
    }

    const properties = ctor.properties;
    const prototype = ctor.prototype;
    for (const key in properties) {
      const { type, reflect } = properties[key];
      if (reflect) {
        const attribute = toDashCase(key);
        Object.defineProperty(prototype, key, {
          configurable: true,
          enumerable: true,
          get: getter(type, attribute),
          set: setter(type, attribute)
        });
      }
    }

    finalized.add(ctor);
  }

  /**
   * Toggle an attribute.
   * @param {String} name name of the attribute to toggle.
   * @param {Boolean} predicate decides whether to set or remove the attribute.
   */
  toggleAttribute(name, predicate) {
    if (predicate != null) {
      if (predicate) {
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
  }
});
