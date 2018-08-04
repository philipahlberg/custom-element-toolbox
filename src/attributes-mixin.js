import { Mixin } from './mixin.js';
import { BaseMixin } from './base-mixin.js';
import { PropertiesMixin } from './properties-mixin.js';
import { toDashCase } from './shared.js';

const finalized = new WeakSet();
const attributeToProperty = new Map();
const propertyToAttribute = new Map();

/**
 * A very simple mixin for synchronizing primitive properties with attributes.
 * Maps `camelCase` properties to `dash-case` attributes.
 * 
 * `String` property values map directly to attribute values.
 * 
 * `Boolean` property values toggle/check the existence of attributes.
 * 
 * `Number` property values are coerced with `Number()`.
 */
export const AttributesMixin = Mixin(SuperClass => {
  const Base = PropertiesMixin(BaseMixin(SuperClass));

  return class AttributesElement extends Base {
    // Set up an attribute to property mapping
    // by observing all attributes that are primitive
    // (e. g. `Boolean`, `Number` or `String`)
    static get observedAttributes() {
      const properties = this.properties || {};
      return Object.keys(properties)
        .map((key) => toDashCase(key))
        .concat(super.observedAttributes || []);
    }

    static setup() {
      super.setup();

      if (finalized.has(this)) {
        return;
      }

      const { properties } = this;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const { reflectToAttribute } = properties[key];
        if (reflectToAttribute) {
          const attribute = toDashCase(key);
          // Cache property and attribute names (both ways)
          propertyToAttribute.set(key, attribute);
          attributeToProperty.set(attribute, key);
        }
      }

      finalized.add(this);
    }

    attributeChangedCallback(attribute, oldValue, newValue) {
      const property = attributeToProperty.get(attribute);
      const { properties } = this.constructor;
      if (
        property != null &&
        properties[property] != null &&
        oldValue !== newValue
      ) {
        const { type } = properties[property];
        let value;
        switch (type) {
          case String:
            value = newValue;
            break;
          case Number:
            value = Number(newValue);
            break;
          case Boolean:
            value = newValue != null;
            break;
        }

        this[property] = value;
      }

      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(attribute, oldValue, newValue);
      }
    }

    propertyChangedCallback(property, oldValue, newValue) {
      super.propertyChangedCallback(property, oldValue, newValue);
      const { properties } = this.constructor;
      const { reflectToAttribute, type } = properties[property];
      if (reflectToAttribute) {
        const attribute = propertyToAttribute.get(property);
        switch (type) {
          case Boolean:
            this.toggleAttribute(attribute, newValue);
            break;
          default:
            this.setAttribute(attribute, newValue);
        }
      }
    }
  }
});
