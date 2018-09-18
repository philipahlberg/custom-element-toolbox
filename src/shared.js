export function isSerializableValue(value) {
  const type = typeof value;
  return type === 'number' || type === 'string' || type === 'boolean';
}

export function isSerializableType(type) {
  return type === String || type === Number || type === Boolean;
}

/**
 * Convert 'PascalCase' or 'camelCase' to 'dash-case'.
 * @param str A PascalCase og camelCase string
 */
export function toDashCase(str) {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}
