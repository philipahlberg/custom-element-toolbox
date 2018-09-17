import { PropertyChangedMixin } from '../dist/index.js';

const Base = PropertyChangedMixin(HTMLElement);

class PropertyChangedElement extends Base {
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
    this.change = {};
    this.changes = [];
  }

  propertyChangedCallback(name, oldValue, newValue) {
    this.callCount++;
    this.change = {
      name,
      oldValue,
      newValue
    };
    this.changes.push(this.change);
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

  it('can use `set` to batch property changes', () => {
    element.set({
      foo: 'string',
      bar: 1
    });

    const [foo, bar] = element.changes.slice(-2);

    expect(element.callCount).to.equal(2);
    expect(foo.oldValue).to.equal(undefined);
    expect(foo.newValue).to.equal('string');
    expect(bar.oldValue).to.equal(undefined);
    expect(bar.newValue).to.equal(1);
  });
});