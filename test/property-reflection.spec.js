import { PropertyReflectionMixin } from '../dist/index.js';
import { snapshot } from './utils.js';

const Base = PropertyReflectionMixin(HTMLElement);

class ReflectElement extends Base {
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

customElements.define('property-reflect-element', ReflectElement);

describe('PropertyReflectionMixin', () => {
  let element;
  let props;

  beforeEach(() => {
    element = new ReflectElement();
    props = snapshot(element);
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('does not reflect before values are initialized', () => {
    expect(element.hasAttribute('string')).to.equal(false);
    expect(element.hasAttribute('number')).to.equal(false);
    expect(element.hasAttribute('boolean')).to.equal(false);
    expect(element.hasAttribute('camel-case')).to.equal(false);
  });

  it('reflects `String` types', () => {
    element.string = 'value';
    expect(element.getAttribute('string')).to.equal('value');
  });

  it('reflects falsey `String` values', () => {
    element.string = '';
    expect(element.getAttribute('string')).to.equal('');
  });

  it('reflects `Number` types', () => {
    element.number = 10;
    expect(element.getAttribute('number')).to.equal('10');
  });

  it('reflects `Number` types', () => {
    element.number = 0;
    expect(element.getAttribute('number')).to.equal('0');
  });


  it('reflects `Boolean` values', () => {
    element.boolean = true;
    expect(element.getAttribute('boolean')).to.equal('');
    element.boolean = false;
    expect(element.getAttribute('boolean')).to.equal(null);
  });

  it('converts camelCase to dash-case', () => {
    element.camelCase = 'value';
    expect(element.hasAttribute('camel-case')).to.be.true;
  });
});