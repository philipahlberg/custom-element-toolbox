import { PropertyObserverMixin } from '../dist/index.js';

const Base = PropertyObserverMixin(HTMLElement);

class ObserverElement extends Base {
  static get properties() {
    return {
      foo: {
        type: String,
        observer: 'onFooChanged'
      }
    }
  }

  constructor() {
    super();
    this.callCount = 0;
    this.observerChanged = {};
  }

  onFooChanged(newValue, oldValue) {
    this.callCount++;
    this.observerChanged = { newValue, oldValue };
  }
}

customElements.define('property-observer-element', ObserverElement);

describe('PropertyObserverMixin', () => {
  let element;

  beforeEach(() => {
    element = new ObserverElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('observes a single property', () => {
    element.foo = 'string';
    expect(element.callCount).to.equal(1);
    expect(element.observerChanged.oldValue).to.equal(undefined);
    expect(element.observerChanged.newValue).to.equal('string');
  });
});