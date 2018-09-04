import { Attributes } from '../dist/index.js';

const Base = Attributes(HTMLElement);

class AttributesElement extends Base {
  static get properties() {
    return {
      string: {
        type: String
      },
      number: {
        type: Number
      },
      boolean: {
        type: Boolean
      },
      camelCase: {
        type: String
      },
      reflected: {
        type: String,
        reflectToAttribute: true
      }
    }
  }
}

customElements.define('attributes-element', AttributesElement);

describe('Attributes', () => {
  let element;

  beforeEach(() => {
    element = new AttributesElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('does not read values when there are no attributes', () => {
    expect(element.string).to.equal(undefined);
    expect(element.number).to.equal(undefined);
    expect(element.boolean).to.equal(undefined);
    expect(element.camelCase).to.equal(undefined);
    expect(element.reflected).to.equal(undefined);
  });

  it('deserializes strings', () => {
    element.setAttribute('string', 'value');
    expect(element.string).to.equal('value');
  });

  it('deserializes numbers', () => {
    element.setAttribute('number', '10');
    expect(element.number).to.equal(10);
  });

  it('deserializes booleans', () => {
    element.setAttribute('boolean', '');
    expect(element.boolean).to.equal(true);
  });

  it('converts dash-case to camelCase', () => {
    element.setAttribute('camel-case', 'foo');
    expect(element.camelCase).to.equal('foo');
  });

  it('does not deserialize property reflections', () => {
    expect(() => {
      element.reflected = 'foo';
    }).to.not.throw();
  });
});