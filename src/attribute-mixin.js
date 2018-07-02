import { toDashCase, toCamelCase, has } from '@philipahlberg/scratchpad';
import { isSerializableType } from './shared.js';

const finalized = new WeakSet();
const reflectedProperties = new WeakMap();
const attributeToProperty = new Map();
const propertyToAttribute = new Map();

/**
 * A very simple mixin for synchronizing primitive properties with attributes.
 * Maps `camelCase` properties to `dash-case` attributes.
 * `String` property values map directly to attribute values.
 * `Boolean` property values toggle/check the existence of attributes.
 * `Number` property values are coerced with `Number()`.
 * 
 * Note: This mixin requires `PropertyAccessorMixin`.
 */
export const AttributeMixin = SuperClass =>
  class AttributeElement extends SuperClass {

    // Set up an attribute -> property mapping
    // by observing all attributes that are primitive
    // (e. g. `Boolean`, `Number` or `String`)
    static get observedAttributes() {
      const properties = this.properties || {};
      return Object.keys(properties)
        .filter((key) => isSerializableType(properties[key].type))
        .map((key) => toDashCase(key));
    }

    /**
     * Set up property -> attribute mapping.
     */
    static setup() {
      if (finalized.has(this) || !has(this, 'properties')) {
        return;
      }

      super.setup();

      const properties = this.properties;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const { type, reflectToAttribute } = properties[key];
        if (reflectToAttribute || (reflectToAttribute !== false && isSerializable(type))) {
          const attribute = toDashCase(key);
          // Cache property and attribute names (both ways)
          propertyToAttribute.set(key, attribute);
          attributeToProperty.set(attribute, key);
        }
      }

      finalized.add(this);
    }

    // Perform attribute-deserialization, i. e.
    // extract values embedded in attributes.
    connectedCallback() {
      const constructor = this.constructor;
      if (has(constructor, 'properties')) {
        const options = Object.keys(constructor.properties);
        for (const key of options) {
          let isNull = this[key] == null;

          // Attempt to read from attribute if property is missing
          const attributeName = propertyToAttribute.get(key) || toDashCase(key);
          if (isNull && this.hasAttribute(attributeName)) {
            const value = this.deserialize(attributeName);
            if (value != null) {
              this[key] = value;
            }
          }
        }
      }

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }

    /**
     * Override point for property setters.
     * @param {string} key 
     * @param {*} value 
     */
    set(key, value) {
      super.set(key, value);
      // Check if the property should be reflected
      const properties = this.constructor.properties;
      if (
        properties[key].reflectToAttribute !== false
      ) {
        // If it should, we pass it to `serialize`
        this.serialize(key, value);
      }
    }

    /**
     * Override point for property -> attribute conversion.
     * @param {string} key 
     * @param {*} value 
     */
    serialize(key, value) {
      const attribute = propertyToAttribute.get(key) || toDashCase(key);
      const { type } = this.constructor.properties[key];
      if (type != null && isSerializableType(type)) {
        switch (type) {
          case String:
          case Number:
            this.setAttribute(attribute, value);
            break;
          case Boolean:
            this.toggleAttribute(attribute, value);
            break;
        }
      }
    }

    /**
     * Override point for attribute -> property conversion.
     * @param {*} attribute 
     */
    deserialize(attribute) {
      const key = attributeToProperty.get(attribute);
      const { type } = this.constructor.properties[key];
      if (type != null && isSerializableType(type)) {
        switch (type) {
          case String:
            return this.getAttribute(attribute);
          case Number:
            return Number(this.getAttribute(attribute));
          case Boolean:
            return this.hasAttribute(attribute);
          default:
            return JSON.parse(this.getAttribute(attribute));
        }
      }
    }

    attributeChangedCallback(attr, oldValue, newValue) {
      const property = attributeToProperty.get(attr);
      const properties = this.constructor.properties;
      if (
        property != null &&
        properties[property] != null &&
        oldValue !== newValue
      ) {
        const { type } = properties[property];
        let propertyValue;
        switch (type) {
          case String:
            propertyValue = newValue;
            break;
          case Number:
            propertyValue = Number(newValue);
            break;
          case Boolean:
            propertyValue = newValue != null;
            break;
        }

        this[property] = propertyValue;
      }

      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(attr, oldValue, newValue);
      }
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
  };
