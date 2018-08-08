import { PropertyChangedMixin } from '../dist/index.js';

const Base = PropertyChangedMixin(HTMLElement);

class PropertyChangedElement extends Base {
  static get properties() {
    return {
      foo: {
        type: String
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

customElements.define('property-changed-element', PropertyChangedElement);

describe('PropertyChangedMixin', () => {
  let element;

  beforeEach(() => {
    element = new PropertyChangedElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('reacts to property changes', () => {
    element.foo = 'string';
    expect(element.callCount).to.equal(1);
    expect(element.change.name).to.equal('foo');
    expect(element.change.oldValue).to.equal(undefined);
    expect(element.change.newValue).to.equal('string');
  });
});