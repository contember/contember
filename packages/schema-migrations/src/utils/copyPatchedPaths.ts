import { Operation, Pointer } from 'rfc6902'

type JsonContainer = { [key: string]: unknown } | unknown[]

const isContainer = (value: unknown): value is JsonContainer => typeof value === 'object' && value !== null

const shallowCopy = (value: JsonContainer): JsonContainer => Array.isArray(value) ? [...value] : { ...value }

const getMutatedPointers = (operation: Operation): string[] => {
	switch (operation.op) {
		case 'test':
			return []
		case 'move':
			return [operation.from, operation.path]
		default:
			return [operation.path]
	}
}

/**
 * Returns a copy of `root` that the patch can mutate in place without touching `root`.
 * Only the containers on the paths the patch writes to are copied; everything else stays shared.
 */
export const copyPatchedPaths = <T extends object>(root: T, patch: Operation[]): T => {
	const rootCopy = { ...root }
	const copies = new Set<unknown>([rootCopy])
	for (const operation of patch) {
		for (const pointer of getMutatedPointers(operation)) {
			// The last token is the key the operation writes to; only its parents are mutated.
			const parentTokens = Pointer.fromJSON(pointer).tokens.slice(1, -1)
			let node: object = rootCopy
			for (const token of parentTokens) {
				const child: unknown = Reflect.get(node, token)
				if (!isContainer(child)) {
					break
				}
				const childCopy = copies.has(child) ? child : shallowCopy(child)
				copies.add(childCopy)
				Reflect.set(node, token, childCopy)
				node = childCopy
			}
		}
	}
	return rootCopy
}
