const singletonFactory = <T, Args = undefined>(cb: (name: string, args: Args) => T) => {
  const created: { [name: string]: T } = {}
  const recursionGuard: string[] = []
  return (name: string, args?: Args): T => {
    if (created[name]) {
      return created[name]
    }
    if (recursionGuard.includes(name)) {
      throw new Error(`Recursion for ${name} detected`)
    }
    recursionGuard.push(name)
    const val = cb(name, args as Args)
    if (recursionGuard.pop() !== name) {
      throw new Error("impl error")
    }
    created[name] = val
    return val
  }
}

export default singletonFactory
