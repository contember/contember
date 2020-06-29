import { ErrorAccessor } from '../accessors'
import { MutationDataResponse, MutationError, MutationResponse } from '../accessorTree'
import { assertNever } from '../utils'
import { AliasTransformer } from './AliasTransformer'

class ErrorsPreprocessor {
	public constructor(private readonly requestResponse?: MutationDataResponse) {}

	public preprocess(): ErrorsPreprocessor.ErrorTreeRoot {
		const treeRoot: ErrorsPreprocessor.ErrorTreeRoot = {}

		if (this.requestResponse === undefined) {
			return treeRoot
		}

		for (const mutationAlias in this.requestResponse) {
			const mutationResponse = this.requestResponse[mutationAlias]
			const processedResponse = this.processMutationResponse(mutationResponse)

			if (processedResponse === undefined) {
				continue
			}

			const [treeId, itemKeyAlias] = AliasTransformer.splitAliasSections(mutationAlias)

			if (itemKeyAlias === undefined) {
				if (treeId in treeRoot) {
					return this.rejectCorruptData()
				}
				treeRoot[treeId] = processedResponse
			} else {
				const itemKey = AliasTransformer.aliasToEntityKey(itemKeyAlias)
				const child = treeRoot[treeId]

				if (!(treeId in treeRoot) || child === undefined) {
					treeRoot[treeId] = {
						nodeType: ErrorsPreprocessor.ErrorNodeType.INode,
						children: {
							[itemKey]: processedResponse,
						},
						errors: [],
					}
				} else if (child.nodeType === ErrorsPreprocessor.ErrorNodeType.INode) {
					child.children[itemKey] = processedResponse
				}
			}
		}
		return treeRoot
	}

	private processMutationResponse(mutationResponse: MutationResponse): ErrorsPreprocessor.ErrorNode | undefined {
		if ((mutationResponse.ok && mutationResponse.validation.valid) || mutationResponse.validation.errors.length === 0) {
			return undefined
		}
		return this.getErrorNode(mutationResponse.validation.errors)
	}

	private getErrorNode(errors: MutationError[]): ErrorsPreprocessor.ErrorNode {
		const [head, ...tail] = errors

		let rootNode = this.getRootNode(head)

		errorLoop: for (const mutationError of tail) {
			let currentNode = rootNode

			for (let i = 0, pathLength = mutationError.path.length; i < pathLength; i++) {
				const pathNode = mutationError.path[i]

				if (currentNode.nodeType === ErrorsPreprocessor.ErrorNodeType.Leaf) {
					;((currentNode as any) as ErrorsPreprocessor.ErrorINode).nodeType = ErrorsPreprocessor.ErrorNodeType.INode
					;((currentNode as any) as ErrorsPreprocessor.ErrorINode).children = {}
				}

				if (pathNode.__typename === '_FieldPathFragment') {
					if (currentNode.nodeType === ErrorsPreprocessor.ErrorNodeType.INode) {
						let alias = pathNode.field
						let nextIndex = i + 1
						if (nextIndex in mutationError.path) {
							const nextPathNode = mutationError.path[nextIndex]

							if (
								nextPathNode.__typename === '_IndexPathFragment' &&
								typeof nextPathNode.alias === 'string' &&
								nextPathNode.alias.startsWith(pathNode.field)
							) {
								// We're dealing with a reduced hasMany relation.
								i++
								nextIndex++
								alias = nextPathNode.alias
							}
						}

						if (!(alias in currentNode.children)) {
							currentNode.children[alias] = this.getRootNode(mutationError, nextIndex)
							if (nextIndex <= mutationError.path.length) {
								// This path has been handled by getRootNode
								continue errorLoop
							}
						}
						currentNode = currentNode.children[alias]
					} else {
						this.rejectCorruptData()
					}
				} else if (pathNode.__typename === '_IndexPathFragment') {
					if (currentNode.nodeType === ErrorsPreprocessor.ErrorNodeType.INode) {
						const alias = pathNode.alias

						if (alias === null) {
							throw new ErrorsPreprocessor.ErrorsPreprocessorError(
								`Corrupt data: undefined alias for node with index ${pathNode.index}.`,
							)
						}

						const aliasKey = AliasTransformer.aliasToEntityKey(alias)

						if (!(aliasKey in currentNode.children)) {
							currentNode.children[aliasKey] = this.getRootNode(mutationError, i + 1)
							if (i + 1 <= mutationError.path.length) {
								// This path has been handled by getRootNode
								continue errorLoop
							}
						}
						currentNode = currentNode.children[aliasKey]
					} else {
						this.rejectCorruptData()
					}
				} else {
					assertNever(pathNode)
				}
			}
			currentNode.errors.push(new ErrorAccessor(mutationError.message.text))
		}

		return rootNode
	}

	private getRootNode(error: MutationError, startIndex: number = 0): ErrorsPreprocessor.ErrorNode {
		let rootNode: ErrorsPreprocessor.ErrorNode = {
			errors: [new ErrorAccessor(error.message.text)],
			nodeType: ErrorsPreprocessor.ErrorNodeType.Leaf,
		}

		for (let i = error.path.length - 1; i >= startIndex; i--) {
			const pathNode = error.path[i]
			if (pathNode.__typename === '_FieldPathFragment') {
				rootNode = {
					errors: [],
					nodeType: ErrorsPreprocessor.ErrorNodeType.INode,
					children: {
						[pathNode.field]: rootNode,
					},
				}
			} else if (pathNode.__typename === '_IndexPathFragment') {
				const alias = pathNode.alias

				if (alias === null) {
					throw new ErrorsPreprocessor.ErrorsPreprocessorError(
						`Corrupt data: undefined alias for node with index ${pathNode.index}.`,
					)
				}

				rootNode = {
					errors: [],
					nodeType: ErrorsPreprocessor.ErrorNodeType.INode,
					children: {
						[AliasTransformer.aliasToEntityKey(alias)]: rootNode,
					},
				}
			} else {
				assertNever(pathNode)
			}
		}

		return rootNode
	}

	private rejectCorruptData(): never {
		throw new ErrorsPreprocessor.ErrorsPreprocessorError(
			'Received corrupted data: a node cannot be simultaneously field-indexed and path-indexed.',
		)
	}
}

namespace ErrorsPreprocessor {
	export interface LeafErrorNode {
		errors: ErrorAccessor[]
		nodeType: ErrorNodeType.Leaf
	}

	export interface ErrorINode {
		nodeType: ErrorNodeType.INode
		errors: ErrorAccessor[]
		children: {
			[key: string]: ErrorNode
		}
	}

	export type ErrorNode = ErrorINode | LeafErrorNode

	export enum ErrorNodeType {
		Leaf = 'Leaf',
		INode = 'INode',
	}

	export interface ErrorTreeRoot {
		[rootId: string]: ErrorNode
	}

	export class ErrorsPreprocessorError extends Error {}
}

export { ErrorsPreprocessor }
