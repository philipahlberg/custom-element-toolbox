import { PropertyAccessorsMixin } from '../dist/index.js';

const Base = PropertyAccessorsMixin(HTMLElement);

class PropertyAccessorsElement extends Base {
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
    this.setCalled = false;
    this.setParameters = [];
    this.getCalled = false;
    this.getParameters = [];
  }

  set(key, value) {
    super.set(key, value);
    this.setCalled = true;
    this.setParameters = [key, value];
  }

  get(key) {
    this.getCalled = true;
    this.getParameters = [key];
    return super.get(key);
  }
}

customElements.define('property-accessors-element', PropertyAccessorsElement);

describe('PropertyAccessorsMixin', () => {
  let element;

  beforeEach(() => {
    element = new PropertyAccessorsElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('calls set with correct parameters', () => {
    element.setCalled = false;

    element.foo = 'string';

    expect(element.setCalled).to.be.true;
    expect(element.setParameters).to.deep.equal(['foo', 'string']);
  });

  it('calls get with correct parameters', () => {
    element.getCalled = false;

    const value = element.bar;

    expect(element.getCalled).to.be.true;
    expect(element.getParameters).to.deep.equal(['bar']);
  });
});