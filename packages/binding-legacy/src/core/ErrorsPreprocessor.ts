import type { EntityId, ErrorAccessor, FieldName, PlaceholderName } from '@contember/binding-common'
import { DataBindingTransactionResult } from '@contember/binding-common'
import { assertNever } from '@contember/binding-common'
import { MutationAlias } from './requestAliases'
import { SubMutationOperation } from './MutationGenerator'
import { MutationError, MutationResult, ValidationError } from '@contember/client'

class ErrorsPreprocessor {
	public constructor(
		private readonly requestResponse: DataBindingTransactionResult,
		private readonly operations: SubMutationOperation[],
	) {}

	public preprocess(): ErrorsPreprocessor.ErrorTreeRoot {
		const treeRoot: ErrorsPreprocessor.ErrorTreeRoot = new Map()

		if (this.requestResponse === undefined) {
			return treeRoot
		}

		for (const operation of this.operations) {
			const mutationResponse = this.requestResponse.data[operation.alias]
			const processedResponse = this.processMutationResponse(mutationResponse)

			if (processedResponse === undefined) {
				continue
			}
			const { subTreeType, subTreePlaceholder, id } = operation

			if (subTreeType === 'single') {
				if (treeRoot.has(subTreePlaceholder)) {
					return this.rejectCorruptData()
				}
				treeRoot.set(subTreePlaceholder, processedResponse)
			} else if (subTreeType === 'list') {
				const child = treeRoot.get(subTreePlaceholder)

				if (child === undefined) {
					treeRoot.set(subTreePlaceholder, {
						nodeType: 'iNode',
						children: new Map([[id, processedResponse]]),
						validation: [],
						execution: [],
					})
				} else if (child.nodeType === 'iNode') {
					child.children.set(id, processedResponse)
				}
			} else {
				return assertNever(subTreeType)
			}

		}
		return treeRoot
	}

	private processMutationResponse(mutationResponse: MutationResult): ErrorsPreprocessor.ErrorNode | undefined {
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

	private getErrorNode(errors: ValidationError[] | MutationError[]): ErrorsPreprocessor.ErrorNode {
		const [head, ...tail] = errors

		let rootNode = this.getRootNode(head)

		errorLoop: for (const error of tail) {
			let currentNode = rootNode

			const path = 'paths' in error ? (error.paths[0] ?? []) : error.path

			for (let i = 0, pathLength = path.length; i < pathLength; i++) {
				const pathNode = path[i]

				if (currentNode.nodeType === 'leaf') {
					(currentNode as any as ErrorsPreprocessor.ErrorINode).nodeType = 'iNode'
					;(currentNode as any as ErrorsPreprocessor.ErrorINode).children = new Map()
				}

				if ('field' in pathNode) {
					if (currentNode.nodeType === 'iNode') {
						let alias = pathNode.field
						let nextIndex = i + 1
						if (nextIndex in path) {
							const nextPathNode = path[nextIndex]

							if (
								'index' in nextPathNode &&
								typeof nextPathNode.alias === 'string' &&
								nextPathNode.alias.startsWith(pathNode.field)
							) {
								// We're dealing with a reduced hasMany relation.
								i++
								nextIndex++
								alias = nextPathNode.alias
							}
						}

						if (!currentNode.children.has(alias)) {
							currentNode.children.set(alias, this.getRootNode(error, nextIndex))
							if (nextIndex <= path.length) {
								// This path has been handled by getRootNode
								continue errorLoop
							}
						}
						currentNode = currentNode.children.get(alias)!
					} else {
						this.rejectCorruptData()
					}
				} else if ('index' in path) {
					if (currentNode.nodeType === 'iNode') {
						const alias = pathNode.alias

						if (alias === null) {
							throw new ErrorsPreprocessor.ErrorsPreprocessorError(
								`Corrupt data: undefined alias for node with index ${pathNode.index}.`,
							)
						}

						const entityId = MutationAlias.decodeEntityId(alias)

						if (!currentNode.children.has(entityId)) {
							currentNode.children.set(entityId, this.getRootNode(error, i + 1))
							if (i + 1 <= path.length) {
								// This path has been handled by getRootNode
								continue errorLoop
							}
						}
						currentNode = currentNode.children.get(entityId)!
					} else {
						this.rejectCorruptData()
					}
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

	private getRootNode(error: ValidationError | MutationError, startIndex: number = 0): ErrorsPreprocessor.ErrorNode {
		let rootNode: ErrorsPreprocessor.ErrorNode = {
			validation: this.isExecutionError(error) ? [] : [this.createValidationError(error.message.text)],
			execution: this.isExecutionError(error) ? [{ type: 'execution', code: error.type, developerMessage: error.message }] : [],
			nodeType: 'leaf',
		}
		const path = 'paths' in error ? (error.paths[0] ?? []) : error.path
		for (let i = path.length - 1; i >= startIndex; i--) {
			const pathNode = path[i]
			if ('field' in pathNode) {
				rootNode = {
					validation: [],
					execution: [],
					nodeType: 'iNode',
					children: new Map([[pathNode.field, rootNode]]),
				}
			} else if ('index' in pathNode) {
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

	private isExecutionError(error: ValidationError | MutationError): error is MutationError {
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
