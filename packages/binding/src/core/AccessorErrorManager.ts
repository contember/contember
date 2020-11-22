import { emptyArray } from '@contember/react-utils'
import { ExecutionError, MutationDataResponse, MutationError } from '../accessorTree'
import { ErrorsPreprocessor } from './ErrorsPreprocessor'
import { InternalEntityListState, InternalEntityState, InternalRootStateNode, InternalStateType } from './internalState'

enum ErrorPopulationMode {
	Add = 'add',
	Clear = 'clear',
}

export class AccessorErrorManager {
	private currentErrors: ErrorsPreprocessor.ErrorTreeRoot | undefined = undefined

	public constructor(
		private readonly subTreeStates: Map<string, InternalRootStateNode>,
		private readonly entityStore: Map<string, InternalEntityState>,
	) {}

	public setErrors(data: MutationDataResponse | undefined) {
		if (this.currentErrors) {
			this.setRootStateErrors(this.currentErrors, ErrorPopulationMode.Clear)
		}

		const preprocessor = new ErrorsPreprocessor(data)
		const errorTreeRoot = preprocessor.preprocess()
		this.currentErrors = errorTreeRoot

		this.setRootStateErrors(errorTreeRoot, ErrorPopulationMode.Add)

		this.dumpErrorData(data)
	}

	private setRootStateErrors(errorTreeRoot: ErrorsPreprocessor.ErrorTreeRoot, mode: ErrorPopulationMode) {
		for (const [subTreePlaceholder, rootError] of errorTreeRoot) {
			const rootState = this.subTreeStates.get(subTreePlaceholder)

			if (!rootState) {
				continue
			}
			switch (rootState.type) {
				case InternalStateType.SingleEntity: {
					if (rootError.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed) {
						this.setEntityStateErrors(rootState, rootError, mode)
					}
					break
				}
				case InternalStateType.EntityList: {
					if (rootError.nodeType === ErrorsPreprocessor.ErrorNodeType.KeyIndexed) {
						this.setEntityListStateErrors(rootState, rootError, mode)
					}
					break
				}
			}
		}
	}

	private setEntityStateErrors(
		state: InternalEntityState,
		errors: ErrorsPreprocessor.FieldIndexedErrorNode | ErrorsPreprocessor.LeafErrorNode,
		mode: ErrorPopulationMode,
	) {
		state.hasStaleAccessor = true
		state.hasPendingUpdate = true
		state.errors = mode === ErrorPopulationMode.Add ? errors.errors : emptyArray

		if (errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.FieldIndexed) {
			return
		}

		if (state.childrenWithPendingUpdates === undefined) {
			state.childrenWithPendingUpdates = new Set()
		}

		for (const [childKey, child] of errors.children) {
			if (child.nodeType === ErrorsPreprocessor.ErrorNodeType.Leaf) {
				const fieldState = state.fields.get(childKey)

				if (fieldState?.type === InternalStateType.Field) {
					fieldState.hasStaleAccessor = true
					fieldState.hasPendingUpdate = true
					fieldState.errors = mode === ErrorPopulationMode.Add ? child.errors : emptyArray
					state.childrenWithPendingUpdates.add(fieldState)
					continue
				}
			}
			// Deliberately letting flow get here as well. Leaf errors *CAN* refer to relations as well.

			const placeholders = state.markersContainer.placeholders.get(childKey)
			if (placeholders === undefined) {
				continue
			}
			const normalizedPlaceholders = typeof placeholders === 'string' ? new Set([placeholders]) : placeholders

			for (const normalizedPlaceholder of normalizedPlaceholders) {
				const fieldState = state.fields.get(normalizedPlaceholder)
				if (fieldState === undefined) {
					continue
				}
				if (fieldState.type === InternalStateType.SingleEntity) {
					if (child.nodeType !== ErrorsPreprocessor.ErrorNodeType.KeyIndexed) {
						state.childrenWithPendingUpdates.add(fieldState)
						this.setEntityStateErrors(fieldState, child, mode)
					}
				} else if (fieldState.type === InternalStateType.EntityList) {
					if (child.nodeType !== ErrorsPreprocessor.ErrorNodeType.FieldIndexed) {
						state.childrenWithPendingUpdates.add(fieldState)
						this.setEntityListStateErrors(fieldState, child, mode)
					}
				}
			}
		}
	}

	private setEntityListStateErrors(
		state: InternalEntityListState,
		errors: ErrorsPreprocessor.KeyIndexedErrorNode | ErrorsPreprocessor.LeafErrorNode,
		mode: ErrorPopulationMode,
	) {
		state.hasStaleAccessor = true
		state.hasPendingUpdate = true
		state.errors = mode === ErrorPopulationMode.Add ? errors.errors : emptyArray

		if (errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.KeyIndexed) {
			return
		}

		if (state.childrenWithPendingUpdates === undefined) {
			state.childrenWithPendingUpdates = new Set()
		}

		for (const [childKey, childError] of errors.children) {
			const childState = this.entityStore.get(childKey)

			if (childState && childError.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed) {
				state.childrenWithPendingUpdates.add(childState)
				this.setEntityStateErrors(childState, childError, mode)
			}
		}
	}

	private dumpErrorData(data: MutationDataResponse | undefined) {
		if (!data) {
			return
		}

		// TODO this is just temporary
		for (const subTreePlaceholder in data) {
			const treeDatum = data[subTreePlaceholder]
			const executionErrors: Array<ExecutionError | MutationError> = treeDatum.errors
			const allErrors = treeDatum?.validation?.errors
				? executionErrors.concat(treeDatum.validation.errors)
				: executionErrors
			const normalizedErrors = allErrors.map((error: ExecutionError | MutationError) => {
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
