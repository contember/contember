export function flipValue<V extends any = any, T extends any = boolean, F extends any = boolean>(value: V, truthy?: T, falsy?: F) {
  return value === (truthy ?? true) ? (falsy ?? false) : value === (falsy ?? false) ? (truthy ?? true) : undefined
}
