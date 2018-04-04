import { FocusMixin } from 'lib';

const FocusElement = FocusMixin(HTMLElement);
customElements.define('focus-element', FocusElement);

describe('FocusMixin', () => {
  let element;
  beforeEach(() => {
    element = new FocusElement();
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  })

  it('is not disabled by default', () => {
    expect(element.disabled).to.be.false;
  });

  it('can be disabled by property setter', () => {
    element.disabled = true;
    const selector = 'focus-element[disabled]';
    expect(element.matches(selector)).to.be.true;
  });

  it('can be disabled by attribute setter', () => {
    element.setAttribute('disabled', '');
    expect(element.disabled).to.be.true;
  });

  it('sets tabindex when connected', () => {
    const selector = 'focus-element[tabindex="0"]';
    expect(element.matches(selector)).to.be.true;
  });

  it('removes tabindex attribute when disabled', () => {
    element.disabled = true;
    const selector = 'focus-element:not([tabindex])';
    expect(element.matches(selector)).to.be.true;
  });

  it('can be focused programatically', () => {
    element.focus();
    expect(element.focused).to.be.true;
  });

  it('can be focused by event dispatching', () => {
    element.dispatchEvent(new Event('focus'));
    expect(element.focused).to.be.true;
  });

  it('applies a `focused` attribute when focused', () => {
    element.focus();
    const selector = 'focus-element[focused]';
    expect(element.matches(selector)).to.be.true;
  });

  it('can be blurred programatically', () => {
    element.focus();
    element.blur();
    expect(element.focused).to.be.false;
  });

  it('can be blurred by event dispatching', () => {
    element.focus();
    element.dispatchEvent(new Event('blur'));
    expect(element.focused).to.be.false;
  });
});