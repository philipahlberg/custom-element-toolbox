import { AttributeMixin } from '../dist/index.js';
import { snapshot } from './utils.js';

class AttributeElement extends AttributeMixin(HTMLElement) {
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
    element.remove();
  });

  it('reflects `String` attributes', () => {
    // An undefined attribute is null, not undefined
    expect(props.string).to.be.null;
    expect(element.hasAttribute('string')).to.be.false;
    element.string = 'value';
    expect(element.hasAttribute('string')).to.be.true;
    expect(element.getAttribute('string')).to.equal('value');
  });

  it('reflects `Number` attributes', () => {
    // falsey values like  '' and null are coerced to 0
    expect(props.number).to.equal(0);
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
});