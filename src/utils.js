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