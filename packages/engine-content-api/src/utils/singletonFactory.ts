export const singletonFactory = <T, Id = string, Args = undefined>(cb: (id: Id, args: Args) => T) => {
	const created: { [name: string]: T } = {}
	const createdIds = new Set<string>()
	const recursionGuard: string[] = []
	return (name: Id, args?: Args): T => {
		const idString = typeof name === 'string' ? name : JSON.stringify(name)
		if (createdIds.has(idString)) {
			return created[idString]
		}
		if (recursionGuard.includes(idString)) {
			throw new Error(`Recursion for ${idString} detected`)
		}
		recursionGuard.push(idString)
		const val = cb(name, args as Args)
		if (recursionGuard.pop() !== idString) {
			throw new Error('impl error')
		}
		created[idString] = val
		createdIds.add(idString)

		return val
	}
}
