export function omit<T extends Object, K extends keyof T>(object: T, properties: ReadonlyArray<K>, strict: boolean = false): Omit<T, K> {
  const next: Partial<T> = { ...object }

  for (let key of properties) {
    if (key in object) {
      delete next[key]
    } else if (strict) {
      throw new Error(`Key "${String(key)}" does not exist in object ${JSON.stringify(object)}`)
    }
  }

  return next as Omit<T, K>
}
