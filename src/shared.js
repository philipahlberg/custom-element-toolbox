export function isSerializableValue(value) {
  const type = typeof value;
  return type === 'number' ||
    type === 'string' ||
    type === 'boolean';
}

export function isSerializableType(type) {
  return type === String ||
    type === Number ||
    type === Boolean;
}