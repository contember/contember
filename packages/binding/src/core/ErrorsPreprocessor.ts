import type { ErrorAccessor } from '../accessors'
import type { ExecutionError, MutationDataResponse, MutationResponse, ValidationError } from '../accessorTree'
import type { EntityId, FieldName, PlaceholderName } from '../treeParameters'
import { assertNever } from '../utils'
import { MutationAlias, mutationOperationSubTreeType } from './requestAliases'

class ErrorsPreprocessor {
	public constructor(private readonly requestResponse: MutationDataResponse) {}

	public preprocess(): ErrorsPreprocessor.ErrorTreeRoot {
		const treeRoot: ErrorsPreprocessor.ErrorTreeRoot = new Map()

		if (this.requestResponse === undefined) {
			return treeRoot
		}

		for (const mutationAlias in this.requestResponse) {
			const mutationResponse = this.requestResponse[mutationAlias]
			const processedResponse = this.processMutationResponse(mutationResponse)

			if (processedResponse === undefined) {
				continue
			}

			const operation = MutationAlias.decodeTopLevel(mutationAlias)

			if (operation === undefined) {
				continue
			}

			const { subTreeType, subTreePlaceholder, entityId } = operation

			if (subTreeType === mutationOperationSubTreeType.singleEntity) {
				if (treeRoot.has(subTreePlaceholder)) {
					return this.rejectCorruptData()
				}
				treeRoot.set(subTreePlaceholder, processedResponse)
			} else if (subTreeType === mutationOperationSubTreeType.entityList) {
				const child = treeRoot.get(subTreePlaceholder)

				if (child === undefined) {
					treeRoot.set(subTreePlaceholder, {
						nodeType: 'iNode',
						children: new Map([[entityId, processedResponse]]),
						validation: [],
						execution: [],
					})
				} else if (child.nodeType === 'iNode') {
					child.children.set(entityId, processedResponse)
				}
			} else {
				return assertNever(subTreeType)
			}
		}
		return treeRoot
	}

	private processMutationResponse(mutationResponse: MutationResponse): ErrorsPreprocessor.ErrorNode | undefined {
		if (mutationResponse.ok && mutationResponse.validation?.valid && mutationResponse.errors.length === 0) {
			return undefined
		}
		if (mutationResponse.validation?.errors.length) {
			return this.getErrorNode(mutationResponse.validation?.errors)
		}
		if (mutationResponse.errors.length) {
			return this.getErrorNode(mutationResponse.errors)
		}
		return undefined
	}

	private getErrorNode(errors: ValidationError[] | ExecutionError[]): ErrorsPreprocessor.ErrorNode {
		const [head, ...tail] = errors

		let rootNode = this.getRootNode(head)

		errorLoop: for (const error of tail) {
			let currentNode = rootNode

			for (let i = 0, pathLength = error.path.length; i < pathLength; i++) {
				const pathNode = error.path[i]

				if (currentNode.nodeType === 'leaf') {
					(currentNode as any as ErrorsPreprocessor.ErrorINode).nodeType = 'iNode'
					;(currentNode as any as ErrorsPreprocessor.ErrorINode).children = new Map()
				}

				if (pathNode.__typename === '_FieldPathFragment') {
					if (currentNode.nodeType === 'iNode') {
						let alias = pathNode.field
						let nextIndex = i + 1
						if (nextIndex in error.path) {
							const nextPathNode = error.path[nextIndex]

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
							currentNode.children.set(alias, this.getRootNode(error, nextIndex))
							if (nextIndex <= error.path.length) {
								// This path has been handled by getRootNode
								continue errorLoop
							}
						}
						currentNode = currentNode.children.get(alias)!
					} else {
						this.rejectCorruptData()
					}
				} else if (pathNode.__typename === '_IndexPathFragment') {
					if (currentNode.nodeType === 'iNode') {
						const alias = pathNode.alias

						if (alias === null) {
							throw new ErrorsPreprocessor.ErrorsPreprocessorError(
								`Corrupt data: undefined alias for node with index ${pathNode.index}.`,
							)
						}

						const entityId = MutationAlias.decodeEntityId(alias)

						if (!(entityId in currentNode.children)) {
							currentNode.children.set(entityId, this.getRootNode(error, i + 1))
							if (i + 1 <= error.path.length) {
								// This path has been handled by getRootNode
								continue errorLoop
							}
						}
						currentNode = currentNode.children.get(entityId)!
					} else {
						this.rejectCorruptData()
					}
				} else {
					assertNever(pathNode)
				}
			}
			if (this.isExecutionError(error)) {
				currentNode.execution.push({ type: 'execution', code: error.type, developerMessage: error.message })
			} else {
				currentNode.validation.push(this.createValidationError(error.message.text))
			}
		}

		return rootNode
	}

	private getRootNode(error: ValidationError | ExecutionError, startIndex: number = 0): ErrorsPreprocessor.ErrorNode {
		let rootNode: ErrorsPreprocessor.ErrorNode = {
			validation: this.isExecutionError(error) ? [] : [this.createValidationError(error.message.text)],
			execution: this.isExecutionError(error) ? [{ type: 'execution', code: error.type, developerMessage: error.message }] : [],
			nodeType: 'leaf',
		}

		for (let i = error.path.length - 1; i >= startIndex; i--) {
			const pathNode = error.path[i]
			if (pathNode.__typename === '_FieldPathFragment') {
				rootNode = {
					validation: [],
					execution: [],
					nodeType: 'iNode',
					children: new Map([[pathNode.field, rootNode]]),
				}
			} else if (pathNode.__typename === '_IndexPathFragment') {
				const alias = pathNode.alias

				if (alias === null) {
					throw new ErrorsPreprocessor.ErrorsPreprocessorError(
						`Corrupt data: undefined alias for node with index ${pathNode.index}.`,
					)
				}

				rootNode = {
					validation: [],
					execution: [],
					nodeType: 'iNode',
					children: new Map([[MutationAlias.decodeEntityId(alias), rootNode]]),
				}
			} else {
				assertNever(pathNode)
			}
		}

		return rootNode
	}

	private createValidationError(message: string): ErrorAccessor.ValidationError {
		if (message === 'Field is required') {
			// TODO this is just awful. Validation errors currently don't have error codes which makes it more difficult
			// 	to translate the error messages. This is the most common such error, and so we just make up a code
			// 	in order to facilitate error handling further downstream.
			return {
				type: 'validation',
				code: 'fieldRequired',
				message,
			}
		}
		return { type: 'validation', message, code: undefined }
	}

	private isExecutionError(error: ValidationError | ExecutionError): error is ExecutionError {
		return 'type' in error
	}

	private rejectCorruptData(): never {
		throw new ErrorsPreprocessor.ErrorsPreprocessorError(
			'Received corrupted data: a node cannot be simultaneously field-indexed and path-indexed.',
		)
	}
}

namespace ErrorsPreprocessor {
	export interface BaseErrorNode {
		validation: ErrorAccessor.ValidationError[]
		execution: ErrorAccessor.ExecutionError[]
	}

	export interface LeafErrorNode extends BaseErrorNode {
		nodeType: 'leaf'
	}

	export interface ErrorINode extends BaseErrorNode {
		nodeType: 'iNode'
		children: Map<FieldName | EntityId, ErrorNode>
	}

	export type ErrorNode = ErrorINode | LeafErrorNode

	export type ErrorTreeRoot = Map<PlaceholderName, ErrorNode>

	export class ErrorsPreprocessorError extends Error {}
}

export { ErrorsPreprocessor }
