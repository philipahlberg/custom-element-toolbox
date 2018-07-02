import { AttributesChangedMixin } from '../dist/index.js';
import { timeout } from './utils.js';

const Base = AttributesChangedMixin(HTMLElement);

class AttributesChangedElement extends Base {
  static get observedAttributes() {
    return ['foo', 'bar'];
  }

  constructor() {
    super();
    this.callCount = 0;
  }

  attributesChangedCallback(changes) {
    this.callCount++;
    this.changes = changes;
  }
}

customElements.define('attributes-changed-element', AttributesChangedElement);

describe('AttributesChangedMixin', () => {
  let element;

  beforeEach(() => {
    element = new AttributesChangedElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('observes multiple attributes asynchronously', async () => {
    expect(element.callCount).to.equal(0);

    for (let i = 0; i < 10; i++) {
      element.setAttribute('foo', String(i));
      element.setAttribute('bar', String(i));
    }

    await timeout(1);
    expect(element.callCount).to.equal(1);
    expect(element.changes).to.have.keys('foo', 'bar');

    const { name, oldValue, newValue } = element.changes.foo;
    expect(name).to.equal('foo');
    expect(oldValue).to.equal(null);
    expect(newValue).to.equal('9');
  });
});