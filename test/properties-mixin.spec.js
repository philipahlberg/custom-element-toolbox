import { PropertiesMixin } from '../dist/index.js';

const Base = PropertiesMixin(HTMLElement);

class PropertiesElement extends Base {
  static get properties() {
    return {
      foo: {
        type: String,
        reflectToAttribute: true,
        observer: 'fooChanged'
      }
    }
  }

  constructor() {
    super();
    this.callCount = 0;
  }

  fooChanged(newValue, oldValue) {
    this.observerChanged = { newValue, oldValue };
  }

  propertyChangedCallback(name, oldValue, newValue) {
    super.propertyChangedCallback(name, oldValue, newValue);
    this.propertyChanged = { name, oldValue, newValue };
  }
}

customElements.define('properties-element', PropertiesElement);

describe('PropertiesMixin', () => {
  let element;

  beforeEach(() => {
    element = new PropertiesElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('reacts to property changes', () => {
    element.foo = 'string';
    expect(element.propertyChanged.name).to.equal('foo');
    expect(element.propertyChanged.oldValue).to.equal(undefined);
    expect(element.propertyChanged.newValue).to.equal('string');
  });

  it('observes a single property', () => {
    element.foo = 'string';
    expect(element.observerChanged.oldValue).to.equal(undefined);
    expect(element.observerChanged.newValue).to.equal('string');
  });

  it('sets an attribute', () => {
    element.foo = 'string';
    expect(element.getAttribute('foo')).to.equal('string');
  });
});