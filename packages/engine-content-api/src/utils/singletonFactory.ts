import { ImplementationException } from '../exception'

export const singletonFactory = <T, Id = string, Args = undefined>(cb: (id: Id, args: Args) => T) => {
	const created = new Map<string, T>()
	const recursionGuard: string[] = []
	return (name: Id, args?: Args): T => {
		const idString = typeof name === 'string' ? name : JSON.stringify(name)
		const createdVal = created.get(idString)
		if (createdVal) {
			return createdVal
		}
		if (recursionGuard.includes(idString)) {
			throw new Error(`Recursion for ${idString} detected`)
		}
		recursionGuard.push(idString)
		const val = cb(name, args as Args)
		if (recursionGuard.pop() !== idString) {
			throw new ImplementationException()
		}
		created.set(idString, val)

		return val
	}
}
