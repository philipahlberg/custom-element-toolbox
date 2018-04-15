import { PropertiesMixin } from '../dist/index.js';
import { snapshot, timeout } from './utils.js';

const Base = PropertiesMixin(HTMLElement);

class PropertiesElement extends Base {
  static get properties() {
    return {
      string: {
        type: String,
        reflect: true
      },
      number: {
        type: Number,
        reflect: true
      },
      boolean: {
        type: Boolean,
        reflect: true
      },
      camelCase: {
        type: String,
        reflect: true
      },
      default: {
        type: String,
        default: function() {
          return 'default';
        }
      },
      optional: {
        type: String,
        default: function() {
          return 'optional';
        }
      },
      primitive: {
        type: String
      },
      observed: {
        type: String,
        observe: true
      },
      observedSecondary: {
        type: String,
        observe: true
      }
    }
  }

  constructor() {
    super();
    this.batched = 0;
    this.observing = false;
    this.optional = 'predefined';
  }

  propertyChangedCallback(prop, oldValue, newValue) {
    super.propertyChangedCallback(prop, oldValue, newValue);
    this.observing = true;
  }

  propertiesChangedCallback(changes) {
    this.batched++;
    this.changes = changes;
  }
}

customElements.define('properties-element', PropertiesElement);

describe('PropertiesMixin', () => {
  let element;
  let props;

  beforeEach(() => {
    element = new PropertiesElement();
    props = snapshot(element);
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('applies default values', () => {
    expect(props.default).to.be.undefined;
    expect(element.default).to.equal('default');
  });

  it('does not apply default value if property is defined', () => {
    expect(props.optional).to.equal('predefined');
    expect(element.optional).to.equal('predefined');
  });

  it('reflects `String` attributes', () => {
    expect(props.string).to.be.undefined;
    expect(element.hasAttribute('string')).to.be.false;
    element.string = 'value';
    expect(element.hasAttribute('string')).to.be.true;
    expect(element.getAttribute('string')).to.equal('value');
  });

  it('reflects `Number` attributes', () => {
    expect(props.number).to.be.undefined;
    expect(element.hasAttribute('number')).to.be.false;
    element.number = 10;
    expect(element.hasAttribute('number')).to.be.true;
    expect(element.getAttribute('number')).to.equal('10');
  });

  it('reflects `Boolean` attributes', () => {
    element.boolean = true;
    expect(element.hasAttribute('boolean')).to.be.true;
    expect(element.getAttribute('boolean')).to.equal('');
    element.boolean = false;
    expect(element.hasAttribute('boolean')).to.be.false;
  });

  it('casts `Number` attributes', () => {
    element.setAttribute('number', '10');
    expect(element.number).to.equal(10);
  });

  it('casts `Boolean` attributes', () => {
    element.setAttribute('boolean', '');
    expect(element.boolean).to.be.true;
  });

  it('converts camelCase to dash-case', () => {
    element.camelCase = 'value';
    expect(element.hasAttribute('camel-case')).to.be.true;
  });

  it('converts dash-case to camelCase', () => {
    element.setAttribute('camel-case', 'anything');
    expect(element.camelCase).to.equal('anything');
  });

  it('observes a single property synchronously', () => {
    element.observed = 'true';
    expect(element.observing).to.be.true;
  });

  it('observes multiple properties asynchronously', async () => {
    expect(element.batched).to.equal(0);

    Object.assign(element, {
      observed: 'value',
      observedSecondary: 'someOtherValue'
    });

    await timeout(10);
    expect(element.batched).to.equal(1);
    expect(element.changes).to.have.keys('observed', 'observedSecondary');
  });
});
