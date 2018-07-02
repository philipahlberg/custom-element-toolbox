import { AttributeMixin, PropertyAccessorsMixin } from '../dist/index.js';
import { snapshot } from './utils.js';

const Base = AttributeMixin(
  PropertyAccessorsMixin(HTMLElement)
);

class AttributeElement extends Base {
  static get properties() {
    return {
      string: {
        type: String,
        reflectToAttribute: true
      },
      number: {
        type: Number,
        reflectToAttribute: true
      },
      boolean: {
        type: Boolean,
        reflectToAttribute: true
      },
      camelCase: {
        type: String,
        reflectToAttribute: true
      }
    }
  }
}

customElements.define('attribute-element', AttributeElement);

describe('AttributeMixin', () => {
  let element;
  let props;

  beforeEach(() => {
    element = new AttributeElement();
    props = snapshot(element);
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('reflects `String` attributes', () => {
    expect(props.string).to.be.undefined;
    expect(element.hasAttribute('string')).to.be.false;
    element.string = 'value';
    expect(element.hasAttribute('string')).to.be.true;
    expect(element.getAttribute('string')).to.equal('value');
  });

  it('reflects `Number` attributes', () => {
    expect(props.number).to.equal(undefined);
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

  it('toggles an attribute', () => {
    expect(element.hasAttribute('attribute')).to.be.false;
    element.toggleAttribute('attribute');
    expect(element.hasAttribute('attribute')).to.be.true;
    element.toggleAttribute('attribute');
    expect(element.hasAttribute('attribute')).to.be.false;
  });

  it('conditionally toggles an attribute', () => {
    element.toggleAttribute('attribute', true);
    expect(element.hasAttribute('attribute')).to.be.true;
    element.toggleAttribute('attribute', false);
    expect(element.hasAttribute('attribute')).to.be.false;
  });
});