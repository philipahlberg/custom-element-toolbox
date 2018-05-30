export function query(selector) {
  return this.querySelector(selector);
}

export function snapshot(element) {
  const props = {};
  const options = element.constructor.properties;
  for (const key of Object.keys(options)) {
    props[key] = element[key];
  }
  return props;
}

export function timeout(ms = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}