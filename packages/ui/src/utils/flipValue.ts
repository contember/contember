export function flipValue<V = any, T = boolean, F = boolean>(value: V, truthy?: T, falsy?: F) {
  return value === (truthy ?? true) ? (falsy ?? false) : value === (falsy ?? false) ? (truthy ?? true) : undefined
}
