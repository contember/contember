import { ErrorAccessor } from '../accessors'
import type { ExecutionError, MutationDataResponse, ValidationError } from '../accessorTree'
import { ErrorsPreprocessor } from './ErrorsPreprocessor'
import { EventManager } from './EventManager'
import { EntityListState, EntityRealmState, getEntityMarker, StateNode } from './state'
import type { TreeStore } from './TreeStore'
import { SubMutationOperation } from './MutationGenerator'

export class AccessorErrorManager {
	private errorsByState: Map<StateNode, ErrorAccessor.ErrorsById> = new Map()

	private getNewErrorId = (() => {
		let errorId = 1

		return () => errorId++
	})()

	public constructor(private readonly eventManager: EventManager, private readonly treeStore: TreeStore) {}

	public hasErrors() {
		return !!this.errorsByState.size
	}

	public getErrors(): ErrorAccessor.Error[] {
		return Array.from(this.errorsByState.values(), it => Array.from(it.values())).flat()
	}

	public clearErrors() {
		this.eventManager.syncOperation(() => {
			for (const [stateNode] of this.errorsByState) {
				stateNode.errors = undefined
				this.eventManager.registerJustUpdated(stateNode, EventManager.NO_CHANGES_DIFFERENCE)
			}
			this.errorsByState.clear()
		})
	}

	public clearErrorsByState(state: StateNode): void {
		return this.eventManager.syncOperation(() => {
			if (!this.errorsByState.has(state)) {
				return
			}
			this.errorsByState.delete(state)
			state.errors = undefined
			this.eventManager.registerJustUpdated(state, EventManager.NO_CHANGES_DIFFERENCE)
		})
	}

	public replaceErrors(data: MutationDataResponse, operations: SubMutationOperation[]) {
		this.eventManager.syncOperation(() => {
			this.clearErrors()

			const preprocessor = new ErrorsPreprocessor(data, operations)
			const errorTreeRoot = preprocessor.preprocess()

			this.setRootStateErrors(errorTreeRoot)

			this.dumpErrorData(data)
		})
	}

	public addError(state: StateNode, error: ErrorAccessor.Error): () => void {
		return this.eventManager.syncOperation(() => {
			const errorId = this.getNewErrorId()

			let errorsById: ErrorAccessor.ErrorsById | undefined = this.errorsByState.get(state)
			if (errorsById === undefined) {
				this.errorsByState.set(state, (errorsById = new Map()))
			}
			errorsById.set(errorId, error)
			state.errors = new ErrorAccessor(Array.from(errorsById.values()))
			this.eventManager.registerJustUpdated(state, EventManager.NO_CHANGES_DIFFERENCE)

			return () =>
				this.eventManager.syncOperation(() => {
					const errorsById = this.errorsByState.get(state)
					if (errorsById === undefined) {
						return
					}
					errorsById.delete(errorId)
					if (errorsById.size) {
						state.errors = new ErrorAccessor(Array.from(errorsById.values()))
					} else {
						state.errors = undefined
						this.errorsByState.delete(state)
					}
					this.eventManager.registerJustUpdated(state, EventManager.NO_CHANGES_DIFFERENCE)
				})
		})
	}

	private addSeveralErrors(state: StateNode, errors: ErrorsPreprocessor.BaseErrorNode) {
		if (errors.validation) {
			for (const error of errors.validation) {
				this.addError(state, error)
			}
		}
		if (errors.execution) {
			for (const error of errors.execution) {
				this.addError(state, error)
			}
		}
	}

	private setRootStateErrors(errorTreeRoot: ErrorsPreprocessor.ErrorTreeRoot) {
		for (const rootStates of this.treeStore.subTreeStatesByRoot.values()) {
			for (const [subTreePlaceholder, rootError] of errorTreeRoot) {
				const rootState = rootStates.get(subTreePlaceholder)

				if (!rootState) {
					continue
				}
				switch (rootState.type) {
					case 'entityRealm': {
						this.setEntityStateErrors(rootState, rootError)
						break
					}
					case 'entityList': {
						this.setEntityListStateErrors(rootState, rootError)
						break
					}
				}
			}
		}
	}

	private setEntityStateErrors(
		state: EntityRealmState,
		errors: ErrorsPreprocessor.ErrorINode | ErrorsPreprocessor.LeafErrorNode,
	) {
		this.addSeveralErrors(state, errors)

		if (errors.nodeType !== 'iNode') {
			return
		}

		for (const [childKey, child] of errors.children) {
			if (typeof childKey !== 'string') {
				continue
			}
			if (child.nodeType === 'leaf') {
				const fieldState = state.children.get(childKey)

				if (fieldState?.type === 'field') {
					this.addSeveralErrors(fieldState, child)
					continue
				}
			}
			// Deliberately letting flow get here as well. Leaf errors *CAN* refer to relations as well.

			const fields = getEntityMarker(state).fields
			const placeholders = fields.placeholders.get(childKey)
			if (placeholders === undefined) {
				continue
			}
			const normalizedPlaceholders = typeof placeholders === 'string' ? new Set([placeholders]) : placeholders

			for (const normalizedPlaceholder of normalizedPlaceholders) {
				const fieldState = state.children.get(normalizedPlaceholder)
				if (fieldState === undefined) {
					continue
				}
				switch (fieldState.type) {
					case 'entityRealm':
						this.setEntityStateErrors(fieldState, child)
						break
					case 'entityList':
						this.setEntityListStateErrors(fieldState, child)
						break
				}
			}
		}
	}

	private setEntityListStateErrors(
		state: EntityListState,
		errors: ErrorsPreprocessor.ErrorINode | ErrorsPreprocessor.LeafErrorNode,
	) {
		this.addSeveralErrors(state, errors)

		if (errors.nodeType !== 'iNode') {
			return
		}

		for (const [childKey, childError] of errors.children) {
			let childState = state.children.get(childKey)

			if (childState === undefined) {
				continue
			}
			if (childState.type === 'entityRealmStub') {
				childState.getAccessor() // Force init
				childState = state.children.get(childKey)!
			}

			if (childError.nodeType === 'iNode') {
				this.setEntityStateErrors(childState as EntityRealmState, childError)
			}
		}
	}

	private dumpErrorData(data: MutationDataResponse) {
		// TODO this is just temporary
		for (const subTreePlaceholder in data) {
			const treeDatum = data[subTreePlaceholder]
			const executionErrors: Array<ExecutionError | ValidationError> = treeDatum.errors
			const allErrors = treeDatum?.validation?.errors
				? executionErrors.concat(treeDatum.validation.errors)
				: executionErrors
			const normalizedErrors = allErrors.map((error: ExecutionError | ValidationError) => {
				return {
					path: error.path
						.map(pathPart => {
							if (pathPart.__typename === '_FieldPathFragment') {
								return pathPart.field
							}
							if (pathPart.alias) {
								return `#${pathPart.index}(${pathPart.alias})`
							}
							return pathPart.index
						})
						.join('.'),
					type: 'type' in error ? error.type : undefined,
					message: typeof error.message === 'string' ? error.message : error.message?.text,
				}
			})
			if (Object.keys(normalizedErrors).length) {
				console.table(normalizedErrors)
			}
			if (treeDatum.errorMessage) {
				console.error(treeDatum.errorMessage)
			}
		}
	}
}
