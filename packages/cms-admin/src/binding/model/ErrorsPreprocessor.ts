import { assertNever } from 'cms-common'
import { MutationError, MutationRequestResult, MutationResult } from '../bindingTypes'
import { ErrorAccessor } from '../dao'
import { MutationGenerator } from './MutationGenerator'

class ErrorsPreprocessor {
	public constructor(private readonly requestResult?: MutationRequestResult) {}

	public preprocess(): ErrorsPreprocessor.ErrorTreeRoot {
		const treeRoot: ErrorsPreprocessor.ErrorTreeRoot = {}

		if (this.requestResult === undefined) {
			return treeRoot
		}

		for (const mutationAlias in this.requestResult) {
			const mutationResult = this.requestResult[mutationAlias]
			const processedResult = this.processMutationResult(mutationResult)

			if (processedResult === undefined) {
				continue
			}

			const [treeId, itemNumber] = mutationAlias.split(MutationGenerator.ALIAS_SEPARATOR)

			if (itemNumber === undefined) {
				if (treeId in treeRoot) {
					return this.rejectCorruptData()
				}
				treeRoot[treeId] = processedResult
			} else {
				const itemIndex = parseInt(itemNumber, 10)
				const child = treeRoot[treeId]

				if (!(treeId in treeRoot) || child === undefined) {
					treeRoot[treeId] = {
						nodeType: ErrorsPreprocessor.ErrorNodeType.NumberIndexed,
						children: {
							[itemIndex]: processedResult
						},
						errors: []
					}
				} else if (child.nodeType === ErrorsPreprocessor.ErrorNodeType.NumberIndexed) {
					child.children[itemIndex] = processedResult
				}
			}
		}
		return treeRoot
	}

	private processMutationResult(mutationResult: MutationResult): ErrorsPreprocessor.ErrorNode | undefined {
		if ((mutationResult.ok && mutationResult.validation.valid) || mutationResult.validation.errors.length === 0) {
			return undefined
		}
		return this.getErrorNode(mutationResult.validation.errors)
	}

	private getErrorNode(errors: MutationError[]): ErrorsPreprocessor.ErrorNode {
		const [head, ...tail] = errors

		let rootNode = this.getRootNode(head)

		errorLoop: for (const mutationError of tail) {
			let currentNode = rootNode

			for (let i = 0, pathLength = mutationError.path.length; i < pathLength; i++) {
				const pathNode = mutationError.path[i]

				if (currentNode.nodeType === ErrorsPreprocessor.ErrorNodeType.Leaf) {
					;((currentNode as any) as ErrorsPreprocessor.ErrorINode).nodeType =
						ErrorsPreprocessor.ErrorNodeType.FieldIndexed
					;((currentNode as any) as ErrorsPreprocessor.ErrorINode).children = {}
				}

				if (pathNode.__typename === '_FieldPathFragment') {
					if (currentNode.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed) {
						if (!(pathNode.field in currentNode.children)) {
							currentNode.children[pathNode.field] = this.getRootNode(mutationError, i + 1)
							if (i + 1 <= mutationError.path.length) {
								continue errorLoop
							}
						}
						currentNode = currentNode.children[pathNode.field]
					} else {
						this.rejectCorruptData()
					}
				} else if (pathNode.__typename === '_IndexPathFragment') {
					if (currentNode.nodeType === ErrorsPreprocessor.ErrorNodeType.NumberIndexed) {
						const alias = pathNode.alias

						if (alias === null) {
							throw new ErrorsPreprocessor.ErrorsPreprocessorError(
								`Corrupt data: undefined alias for node with index ${pathNode.index}.`
							)
						}

						const numericAlias = parseInt(alias, 10)

						if (!(numericAlias in currentNode.children)) {
							currentNode.children[numericAlias] = this.getRootNode(mutationError, i + 1)
							if (i + 1 <= mutationError.path.length) {
								continue errorLoop
							}
						}
						currentNode = currentNode.children[numericAlias]
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
			nodeType: ErrorsPreprocessor.ErrorNodeType.Leaf
		}

		for (let i = error.path.length - 1; i >= startIndex; i--) {
			const pathNode = error.path[i]
			if (pathNode.__typename === '_FieldPathFragment') {
				rootNode = {
					errors: [],
					nodeType: ErrorsPreprocessor.ErrorNodeType.FieldIndexed,
					children: {
						[pathNode.field]: rootNode
					}
				}
			} else if (pathNode.__typename === '_IndexPathFragment') {
				rootNode = {
					errors: [],
					nodeType: ErrorsPreprocessor.ErrorNodeType.NumberIndexed,
					children: {
						[pathNode.index]: rootNode
					}
				}
			} else {
				assertNever(pathNode)
			}
		}

		return rootNode
	}

	private rejectCorruptData(): never {
		throw new ErrorsPreprocessor.ErrorsPreprocessorError(
			'Received corrupted data: a node cannot be simultaneously field-indexed and path-indexed.'
		)
	}
}

namespace ErrorsPreprocessor {
	export interface LeafErrorNode {
		errors: ErrorAccessor[]
		nodeType: ErrorNodeType.Leaf
	}

	export interface NumberIndexedErrorNode {
		errors: ErrorAccessor[]
		nodeType: ErrorNodeType.NumberIndexed
		children: {
			[index: number]: ErrorNode
		}
	}

	export interface FieldIndexedErrorNode {
		errors: ErrorAccessor[]
		nodeType: ErrorNodeType.FieldIndexed
		children: {
			[index: string]: ErrorNode
		}
	}

	export type ErrorINode = NumberIndexedErrorNode | FieldIndexedErrorNode
	export type ErrorNode = ErrorINode | LeafErrorNode

	export enum ErrorNodeType {
		Leaf = 'Leaf',
		NumberIndexed = 'NumberIndexed',
		FieldIndexed = 'FieldIndexed'
	}

	export interface ErrorTreeRoot {
		[rootId: string]: ErrorNode
	}

	export class ErrorsPreprocessorError extends Error {}
}

export { ErrorsPreprocessor }
