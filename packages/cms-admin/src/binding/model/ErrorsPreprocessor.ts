import { assertNever } from 'cms-common'
import { MutationError, MutationResult } from '../bindingTypes'
import { ErrorAccessor } from '../dao/ErrorAccessor'
import { ErrorCollectionAccessor } from '../dao/ErrorCollectionAccessor'

class ErrorsPreprocessor {
	public constructor(private readonly mutationResult: MutationResult) {}

	public preprocess(): ErrorsPreprocessor.ErrorNode {
		if (
			(this.mutationResult.ok && this.mutationResult.validation.valid) ||
			this.mutationResult.validation.errors.length === 0
		) {
			return {
				errors: new ErrorCollectionAccessor(),
				nodeType: ErrorsPreprocessor.ErrorNodeType.Leaf
			}
		}
		return this.getErrorNode(this.mutationResult.validation.errors)
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
						if (!(pathNode.index in currentNode.children)) {
							currentNode.children[pathNode.index] = this.getRootNode(mutationError, i + 1)
							if (i + 1 <= mutationError.path.length) {
								continue errorLoop
							}
						}
						currentNode = currentNode.children[pathNode.index]
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
					errors: new ErrorCollectionAccessor(),
					nodeType: ErrorsPreprocessor.ErrorNodeType.FieldIndexed,
					children: {
						[pathNode.field]: rootNode
					}
				}
			} else if (pathNode.__typename === '_IndexPathFragment') {
				rootNode = {
					errors: new ErrorCollectionAccessor(),
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

	private rejectCorruptData() {
		throw new ErrorsPreprocessor.ErrorsPreprocessorError(
			'Received corrupted data: a node cannot be simultaneously field-indexed and path-indexed.'
		)
	}
}

namespace ErrorsPreprocessor {
	export interface LeafErrorNode {
		errors: ErrorCollectionAccessor
		nodeType: ErrorNodeType.Leaf
	}

	export interface NumberIndexedErrorNode {
		errors: ErrorCollectionAccessor
		nodeType: ErrorNodeType.NumberIndexed
		children: {
			[index: number]: ErrorNode
		}
	}

	export interface FieldIndexedErrorNode {
		errors: ErrorCollectionAccessor
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

	export class ErrorsPreprocessorError extends Error {}
}

export { ErrorsPreprocessor }
