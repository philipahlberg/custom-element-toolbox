export function query(selector) {
  return this.querySelector(selector);
}

export function dispatch(type, options, detail) {
  const init = Object.assign({
    bubbles: true,
    cancelable: true,
    detail
  }, options);

  return this.dispatchEvent(new CustomEvent(type, init));
}

export function listen(node, listener, options) {
  node.addEventListener(listener, options);
}

export function toggleAttribute(name, predicate) {
  if (predicate != null) {
    if (predicate) {
      this.setAttribute(name, '');
    } else {
      this.removeAttribute(name);
    }
  } else {
    if (this.hasAttribute(name)) {
      this.removeAttribute(name);
    } else {
      this.setAttribute(name, '');
    }
  }
}

export function createElement(
  tag,
  options = { namespace: 'html' },
  children = []
) {
  const {
    attributes,
    properties,
    namespace
  } = options;

  const ns = namespace.toLowerCase() === 'html'
    ? 'http://www.w3.org/1999/xhtml'
    : 'http://www.w3.org/2000/svg';

  const element = document.createElementNS(ns, tag);

  // Set attributes
  for (const key in attributes) {
    element.setAttribute(key, attributes[key]);
  }

  // Set properties
  Object.assign(element, properties);

  // Append children
  for (const node of children) {
    element.appendChild(node);
  }

  return element;
}

export function text(string) {
  return document.createTextNode(string);
}

export function div() {
  return createElement('div');
}

export function a(href) {
  return createElement('a', {
    properties: { href }
  });
}

export function connect(customElement) {
  document.body.appendChild(customElement);
}

export function disconnect(customElement) {
  document.body.removeChild(customElement);
}

export function snapshot(element) {
  const props = {};
  const options = element.constructor.properties;
  for (const key in options) {
    props[key] = element[key];
  }
  return props;
}

export function idle() {
  return new Promise(resolve => {
    requestIdleCallback(() => {
      resolve();
    });
  });
}

export function timeout(ms = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

export function frame() {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}
