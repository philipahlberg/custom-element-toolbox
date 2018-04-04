import { ShadyTemplateMixin, html } from 'lib';
import { query } from './utils.js';

const externalTemplate = html`
  <div id="external">External</div>
`;

const externalStyle = html`
  <style>
  :host(.red) {
    background: red;
  }
  </style>
`;

class TemplateElement extends ShadyTemplateMixin(HTMLElement) {
  static get template() {
    return html`
      <style>
      :host {
        display: block;
      }
      </style>
      ${externalStyle}
      <div id="internal">Internal</div>
      ${externalTemplate}
    `;
  }
}

customElements.define('template-element', TemplateElement);

describe('ShadyTemplateMixin', () => {
  let element;
  let $;

  beforeEach(() => {
    element = new TemplateElement();
    document.body.appendChild(element);
    $ = query.bind(element.shadowRoot);
  });

  afterEach(() => {
    element.remove();
    $ = undefined;
  });

  it('renders static html', () => {
    expect(element).to.exist;
    expect($('#internal').textContent).to.equal('Internal');
  });

  it('renders dynamic html', () => {
    expect($('#external').textContent).to.equal('External');
  });

  it('applies static style', () => {
    expect(getComputedStyle(element).display).to.equal('block');
  });

  it('applies dynamic style', () => {
    element.classList.add('red');
    expect(getComputedStyle(element)['background-color']).to.equal('rgb(255, 0, 0)');
  });
});