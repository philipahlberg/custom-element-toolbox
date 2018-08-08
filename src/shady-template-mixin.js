import { Mixin } from './mixin.js';
import { StaticTemplateMixin } from './static-template-mixin.js';

const ShadyCSS = window.ShadyCSS;
const emulated = ShadyCSS && (
  !ShadyCSS.nativeShadow ||
  !ShadyCSS.nativeCss
);

export const ShadyTemplateMixin = Mixin(SuperClass => {
  const Base = StaticTemplateMixin(SuperClass);
  let finalized = false;

  return class ShadyTemplateElement extends Base {
    constructor() {
      super();
      const ctor = this.constructor;
      if (finalized || ctor.template == null) {
        return;
      }

      if (emulated) {
        ShadyCSS.prepareTemplate(ctor.template, this.localName);
      }

      finalized = true;
    }

    connectedCallback() {
      super.connectedCallback();
      if (finalized && emulated) {
        ShadyCSS.styleElement(this);
      }
    }
  }
});