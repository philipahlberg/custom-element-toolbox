import { Mixin } from './mixin.js';
import { StaticTemplateMixin } from './static-template-mixin.js';

export const ShadyTemplateMixin = Mixin(SuperClass => {
  const Base = StaticTemplateMixin(SuperClass);
  const finalized = new WeakSet();
  const ShadyCSS = window.ShadyCSS;
  const emulated = ShadyCSS && (
    !ShadyCSS.nativeShadow ||
    !ShadyCSS.nativeCss
  );

  return class ShadyTemplateElement extends Base {
    static prepareTemplate(name) {
      if (!emulated) return;
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
  }
});