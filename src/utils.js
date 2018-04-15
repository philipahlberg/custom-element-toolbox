export function toDashCase(str) {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}

export function toCamelCase(str) {
  return str.replace(/-([a-z])/ig, (m) => m[1].toUpperCase());
}

export function isBoolean(value) {
  return value != null && (value === 'false' || value === 'true' || typeof value === 'boolean');
}

export function toBoolean(value) {
  return value !== 'false' && Boolean(value);
}

export function has(target, prop) {
  return target.hasOwnProperty(prop);
}

export function empty() {
  return Object.create(null);
}

export function freeze(object) {
  return Object.freeze(object);
}

export const EMPTY = freeze(empty());

const timeouts = new WeakMap();

export function debounce(fn) {
  const wrapper = () => {
    fn();
    timeouts.delete(fn);
  }

  return () => {
    clearTimeout(timeouts.get(fn));
    timeouts.set(fn, setTimeout(wrapper, 1));
  }
}

const called = new WeakSet();

export function once(fn) {
  return () => {
    if (!called.has(fn)) {
      fn();
      called.add(fn);
    }
  }
}

const input = new WeakMap();
const output = new WeakMap();

export function cache(fn) {
  return (...args) => {
    const previous = input.get(fn);
    const equal = previous && args.every(
      (item, i) => item === previous[i]
    );
    if (equal) {
      return output.get(fn);
    } else {
      const result = fn(...args);
      input.set(fn, args);
      output.set(fn, result);
      return result;
    }
  }
}
