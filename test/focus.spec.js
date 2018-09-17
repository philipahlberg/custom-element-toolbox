import { FocusMixin } from '../dist/index.js';

const FocusElement = FocusMixin(HTMLElement);
customElements.define('focus-element', FocusElement);

describe('FocusMixin', () => {
  let element;

  beforeEach(() => {
    element = new FocusElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('has a `disabled` property', () => {
    expect('disabled' in element).to.equal(true);
  });

  it('has a `focused` property', () => {
    expect('focused' in element).to.equal(true);
  });

  it('is not disabled by default', () => {
    expect(element.disabled).to.equal(false);
  });

  it('sets tabindex when connected', () => {
    expect(element.hasAttribute('tabindex')).to.equal(true);
  });

  it('removes tabindex attribute when disabled', () => {
    element.disabled = true;
    expect(element.hasAttribute('tabindex')).to.equal(false);
  });

  it('can be focused', () => {
    element.focus();
    expect(element.focused).to.be.true;
  });

  // Testing for `focus-element:focus` would be preferred,
  // but it does not work when testing in Chrome and Firefox,
  // while it does work in ChromeHeadless and Edge
  it('applies a `focused` attribute when focused', () => {
    element.focus();
    expect(element.hasAttribute('focused')).to.equal(true);
  });

  it('can be blurred', () => {
    element.focus();
    element.blur();
    expect(element.focused).to.equal(false);
  });
});