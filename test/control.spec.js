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

  it('has a `role` property', () => {
    expect('role' in element).to.equal(true);
  });

  it('has a `name` property', () => {
    expect('name' in element).to.equal(true);
  });

  it('has a `value` property', () => {
    expect('value' in element).to.equal(true);
  });

  it('has a `required` property', () => {
    expect('required' in element).to.equal(true);
  });

  it('has a `valid` property', () => {
    expect('valid' in element).to.equal(true);
  });

  it('is valid by default', () => {
    expect(element.valid).to.equal(true);
  });

  it('is not valid if no value is set and it is required', () => {
    element.required = true;
    expect(element.valid).to.equal(false);
  });

  it('is valid if a value is set and it is required', () => {
    element.value = 'foo';
    element.required = true;
    expect(element.valid).to.equal(true);
  });

  it('has a `valid` attribute', () => {
    expect(element.hasAttribute('valid')).to.equal(true);
  });
});