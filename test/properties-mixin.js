import { PropertiesMixin } from '../dist/index.js';

const Base = PropertiesMixin(HTMLElement);

class PropertiesElement extends Base {
  static get properties() {
    return {
      foo: {
        type: String
      },
      bar: {
        type: Number
      }
    }
  }

  constructor() {
    super();
    this.callCount = 0;
  }

  propertyChangedCallback(name, oldValue, newValue) {
    this.callCount++;
    this.change = {
      name,
      oldValue,
      newValue
    };
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

  it('observes a single property synchronously', () => {
    expect(element.callCount).to.equal(0);

    element.foo = 'string';

    expect(element.callCount).to.equal(1);
    expect(element.change.name).to.equal('foo');
    expect(element.change.oldValue).to.equal(undefined);
    expect(element.change.newValue).to.equal('string');
  });
});