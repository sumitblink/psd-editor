
export function createFactory(_class, ...args) {
  return new _class(...args);
}

export function toFixed(value, decimal = 2) {
  return +value.toFixed(decimal);
}
