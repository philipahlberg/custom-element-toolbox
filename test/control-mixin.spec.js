import { ControlMixin } from '../dist/index.js';

const ControlElement = ControlMixin(HTMLElement);

customElements.define('control-element', ControlElement);

describe('ControlMixin', () => {
  let element;

  beforeEach(() => {
    element = new ControlElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  // Role

  it('has no role by default', () => {
    expect(element.role).to.be.null;
  });

  it('can set role', () => {
    element.role = 'button';
    expect(element.role).to.equal('button');
  });

  it('sets role as an attribute', () => {
    element.role = 'button';
    expect(element.getAttribute('role')).to.equal('button');
  });

  // Name

  it('has no name by default', () => {
    expect(element.name).to.be.null;
  });

  it('can set name', () => {
    element.name = 'foo';
    expect(element.name).to.equal('foo');
  });

  it('sets name as attribute', () => {
    element.name = 'foo';
    expect(element.getAttribute('name')).to.equal('foo');
  });

  // Value

  it('has no value by default', () => {
    expect(element.value).to.be.null;
  });

  it('can set value', () => {
    element.value = 'bar';
    expect(element.value).to.equal('bar');
  });

  it('sets value as attribute', () => {
    element.value = 'bar';
    expect(element.getAttribute('value')).to.equal('bar');
  });

  // Required

  it('is not required by default', () => {
    expect(element.required).to.equal(false);
  });

  it('can set required', () => {
    element.required = true;
    expect(element.required).to.equal(true);
  });

  it('sets required as attribute', () => {
    element.required = true;
    expect(element.hasAttribute('required')).to.equal(true);
  });

  // Valid

  it('is valid by default', () => {
    expect(element.valid).to.equal(true);
  });

  it('is not valid if no value is set and it is required', () => {
    element.required = true;
    expect(element.valid).to.equal(false);
  });
});