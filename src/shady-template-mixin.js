import { Mixin } from './mixin.js';
import { StaticTemplateMixin } from './static-template-mixin.js';

const ShadyCSS = window.ShadyCSS;
const emulated = ShadyCSS && (
  !ShadyCSS.nativeShadow ||
  !ShadyCSS.nativeCss
);

const finalized = new WeakSet();

export const ShadyTemplateMixin = Mixin(SuperClass => {
  const Base = StaticTemplateMixin(SuperClass);
  return class ShadyTemplateElement extends Base {
    constructor() {
      super();
      const ctor = this.constructor;
      if (!ctor.template || finalized.has(ctor)) {
        return;
      }

      if (emulated) {
        ShadyCSS.prepareTemplate(ctor.template, this.localName);
      }

      finalized.add(ctor);
    }

    connectedCallback() {
      super.connectedCallback();
      if (finalized.has(this.constructor)) {
        if (emulated) {
          ShadyCSS.styleElement(this);
        }
      }
    }
  }
});