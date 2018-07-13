export const isIt = <T extends object>(val: any, property: keyof T): val is T => {
  return val[property] !== undefined
}
