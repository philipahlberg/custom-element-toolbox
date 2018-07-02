import { PropertyAccessorsMixin, PropertiesChangedMixin } from '../dist/index.js';
import { snapshot, timeout } from './utils.js';

const Base = PropertiesChangedMixin(
  PropertyAccessorsMixin(HTMLElement)
);

class PropertiesChangedElement extends Base {
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

  propertiesChangedCallback(changes) {
    this.callCount++;
    this.changes = changes;
  }
}

customElements.define('properties-changed-element', PropertiesChangedElement);

describe('PropertiesChangedMixin', () => {
  let element;
  let props;

  beforeEach(() => {
    element = new PropertiesChangedElement();
    props = snapshot(element);
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('observes multiple properties asynchronously', async () => {
    expect(element.callCount).to.equal(0);

    Object.assign(element, {
      foo: 'string',
      bar: 123
    });

    await timeout(1);
    expect(element.callCount).to.equal(1);
    expect(element.changes).to.have.keys('foo', 'bar');

    const { name, oldValue, newValue } = element.changes.foo;
    expect(name).to.equal('foo');
    expect(oldValue).to.equal(undefined);
    expect(newValue).to.equal('string');
  });
});