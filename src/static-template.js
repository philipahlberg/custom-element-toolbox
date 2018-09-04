import { Mixin } from './mixin.js';

export const StaticTemplate = Mixin(SuperClass => {
  const mounted = new WeakSet();

  return class StaticTemplateElement extends SuperClass {
    connectedCallback() {
      const constructor = this.constructor;
      const template = constructor.template;
      if (template != null && !mounted.has(this)) {
        if (this.shadowRoot == null) {
          this.attachShadow({ mode: 'open' });
        }
        const content = template.content;
        const clone = content.cloneNode(true);
        this.shadowRoot.appendChild(clone);
        mounted.add(this);
      }

      if (super.connectedCallback) {
        super.connectedCallback();
      }
    }
  }
});

function sanitize(value) {
  if (value instanceof HTMLTemplateElement) {
    return value.innerHTML;
  } else {
    return String(value);
  }
}

export function html(strings, ...values) {
  const rawStrings = strings.raw;
  const template = document.createElement('template');
  template.innerHTML = values.reduce(
    (acc, v, idx) => acc + sanitize(v) + rawStrings[idx + 1],
    rawStrings[0]
  );
  return template;
}

export { StaticTemplate as StaticTemplateMixin };