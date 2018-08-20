import { PropertyDefaultMixin } from '../dist/index.js';

const Base = PropertyDefaultMixin(HTMLElement);

class PropertyDefaultElement extends Base {
  static get properties() {
    return {
      foo: {
        type: String,
        default: function() {
          return 'default';
        }
      },
      bar: {
        type: String,
        default: () => 'default'
      },
      baz: {
        type: String,
        default() {
          return 'default'
        }
      }
    }
  }
}

customElements.define('property-default-element', PropertyDefaultElement);

describe('PropertyDefaultMixin', () => {
  let element;

  beforeEach(() => {
    element = new PropertyDefaultElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('applies a default value (function)', () => {
    expect(element.foo).to.equal('default');
  });

  it('applies a default value (arrow function)', () => {
    expect(element.bar).to.equal('default');
  });

  it('applies a default value (method)', () => {
    expect(element.baz).to.equal('default');
  });
});