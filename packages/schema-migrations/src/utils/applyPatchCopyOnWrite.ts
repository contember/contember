import { applyPatch, Operation, Pointer } from 'rfc6902'

type JsonContainer = { [key: string]: unknown } | unknown[]

// Pointer.evaluate in rfc6902 skips these tokens, so the copy walk must skip them too.
const skippedTokens = new Set(['__proto__', 'constructor', 'prototype'])

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
 * Applies the patch to a copy of `root`, leaving `root` untouched. Only the containers on the paths
 * the patch writes to are copied; everything else stays shared with `root`.
 */
export const applyPatchCopyOnWrite = <T extends object>(root: T, patch: Operation[]): { result: T; errors: Error[] } => {
	const result = { ...root }
	const copies = new Set<unknown>([result])
	const errors: Error[] = []
	for (const operation of patch) {
		// Each path is copied against the tree as the previous operations left it: array indices shift
		// and `move` relocates an uncopied original, so a path resolved up front can miss the target.
		for (const pointer of getMutatedPointers(operation)) {
			copyParents(result, pointer, copies)
		}
		for (const error of applyPatch(result, [operation])) {
			if (error !== null) {
				errors.push(error)
			}
		}
	}
	return { result, errors }
}

const copyParents = (root: object, pointer: string, copies: Set<unknown>): void => {
	const tokens = Pointer.fromJSON(pointer).tokens.slice(1)
	// rfc6902 writes into the node reached before the last token, unless that token is skipped.
	const lastToken = tokens.at(-1)
	const writtenTokens = lastToken !== undefined && skippedTokens.has(lastToken) ? tokens : tokens.slice(0, -1)
	const parentTokens = writtenTokens.filter(token => !skippedTokens.has(token))
	let node: object = root
	for (const token of parentTokens) {
		const child: unknown = Reflect.get(node, token)
		if (!isContainer(child)) {
			return
		}
		const childCopy = copies.has(child) ? child : shallowCopy(child)
		copies.add(childCopy)
		Reflect.set(node, token, childCopy)
		node = childCopy
	}
}
