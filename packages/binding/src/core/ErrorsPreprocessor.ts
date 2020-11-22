import { ErrorAccessor } from '../accessors'
import { MutationDataResponse, ValidationError, MutationResponse, ExecutionError } from '../accessorTree'
import { assertNever } from '../utils'
import { AliasTransformer } from './AliasTransformer'

class ErrorsPreprocessor {
	public constructor(private readonly requestResponse?: MutationDataResponse) {}

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

			const [treeId, itemKeyAlias] = AliasTransformer.splitAliasSections(mutationAlias)

			if (itemKeyAlias === undefined) {
				if (treeRoot.has(treeId)) {
					return this.rejectCorruptData()
				}
				treeRoot.set(treeId, processedResponse)
			} else {
				const itemKey = AliasTransformer.aliasToEntityKey(itemKeyAlias)
				const child = treeRoot.get(treeId)

				if (child === undefined) {
					treeRoot.set(treeId, {
						nodeType: ErrorsPreprocessor.ErrorNodeType.INode,
						children: new Map([[itemKey, processedResponse]]),
						validation: undefined,
						execution: undefined,
					})
				} else if (child.nodeType === ErrorsPreprocessor.ErrorNodeType.INode) {
					child.children.set(itemKey, processedResponse)
				}
			}
		}
		return treeRoot
	}

	private processMutationResponse(mutationResponse: MutationResponse): ErrorsPreprocessor.ErrorNode | undefined {
		if (mutationResponse.ok && mutationResponse.validation.valid && mutationResponse.errors.length === 0) {
			return undefined
		}
		if (mutationResponse.validation.errors.length) {
			return this.getErrorNode(mutationResponse.validation.errors)
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

				if (currentNode.nodeType === ErrorsPreprocessor.ErrorNodeType.Leaf) {
					;((currentNode as any) as ErrorsPreprocessor.ErrorINode).nodeType = ErrorsPreprocessor.ErrorNodeType.INode
					;((currentNode as any) as ErrorsPreprocessor.ErrorINode).children = new Map()
				}

				if (pathNode.__typename === '_FieldPathFragment') {
					if (currentNode.nodeType === ErrorsPreprocessor.ErrorNodeType.INode) {
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
					if (currentNode.nodeType === ErrorsPreprocessor.ErrorNodeType.INode) {
						const alias = pathNode.alias

						if (alias === null) {
							throw new ErrorsPreprocessor.ErrorsPreprocessorError(
								`Corrupt data: undefined alias for node with index ${pathNode.index}.`,
							)
						}

						const aliasKey = AliasTransformer.aliasToEntityKey(alias)

						if (!(aliasKey in currentNode.children)) {
							currentNode.children.set(aliasKey, this.getRootNode(error, i + 1))
							if (i + 1 <= error.path.length) {
								// This path has been handled by getRootNode
								continue errorLoop
							}
						}
						currentNode = currentNode.children.get(aliasKey)!
					} else {
						this.rejectCorruptData()
					}
				} else {
					assertNever(pathNode)
				}
			}
			if (this.isExecutionError(error)) {
				if (currentNode.execution === undefined) {
					currentNode.execution = [{ type: error.type, developerMessage: error.message }]
				} else {
					currentNode.execution.push({ type: error.type, developerMessage: error.message })
				}
			} else {
				if (currentNode.validation === undefined) {
					currentNode.validation = [{ message: error.message.text }]
				} else {
					currentNode.validation.push({ message: error.message.text })
				}
			}
		}

		return rootNode
	}

	private getRootNode(error: ValidationError | ExecutionError, startIndex: number = 0): ErrorsPreprocessor.ErrorNode {
		let rootNode: ErrorsPreprocessor.ErrorNode = {
			validation: this.isExecutionError(error) ? undefined : [{ message: error.message.text }],
			execution: this.isExecutionError(error) ? [{ type: error.type, developerMessage: error.message }] : undefined,
			nodeType: ErrorsPreprocessor.ErrorNodeType.Leaf,
		}

		for (let i = error.path.length - 1; i >= startIndex; i--) {
			const pathNode = error.path[i]
			if (pathNode.__typename === '_FieldPathFragment') {
				rootNode = {
					validation: undefined,
					execution: undefined,
					nodeType: ErrorsPreprocessor.ErrorNodeType.INode,
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
					validation: undefined,
					execution: undefined,
					nodeType: ErrorsPreprocessor.ErrorNodeType.INode,
					children: new Map([[AliasTransformer.aliasToEntityKey(alias), rootNode]]),
				}
			} else {
				assertNever(pathNode)
			}
		}

		return rootNode
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
		validation: ErrorAccessor.ValidationErrors | undefined
		execution: ErrorAccessor.ExecutionErrors | undefined
	}

	export interface LeafErrorNode extends BaseErrorNode {
		nodeType: ErrorNodeType.Leaf
	}

	export interface ErrorINode extends BaseErrorNode {
		nodeType: ErrorNodeType.INode
		children: Map<string, ErrorNode>
	}

	export type ErrorNode = ErrorINode | LeafErrorNode

	export enum ErrorNodeType {
		Leaf = 'Leaf',
		INode = 'INode',
	}

	export type ErrorTreeRoot = Map<string, ErrorNode>

	export class ErrorsPreprocessorError extends Error {}
}

export { ErrorsPreprocessor }
