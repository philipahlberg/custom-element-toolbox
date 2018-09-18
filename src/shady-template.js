import { Mixin } from './mixin.js';
import { StaticTemplate } from './static-template.js';

export const ShadyTemplate = Mixin(SuperClass => {
  const Super = StaticTemplate(SuperClass);
  const finalized = new WeakSet();
  const ShadyCSS = window.ShadyCSS;
  const emulated = ShadyCSS && (!ShadyCSS.nativeShadow || !ShadyCSS.nativeCss);

  return class ShadyTemplateElement extends Super {
    static prepareTemplate(name) {
      if (!emulated) return;
      if (this.template == null) return;
      if (finalized.has(this)) return;
      ShadyCSS.prepareTemplate(this.template, name);
      finalized.add(this);
    }

    constructor() {
      super();
      const tagName = this.localName.toLowerCase();
      this.constructor.prepareTemplate(tagName);
    }

    connectedCallback() {
      super.connectedCallback();
      if (emulated) {
        ShadyCSS.styleElement(this);
      }
    }
  };
});

export { ShadyTemplate as ShadyTemplateMixin };
