import { GraphQlBuilder } from '@contember/client'
import { emptyArray, noop, returnFalse } from '@contember/react-utils'
import * as ReactDOM from 'react-dom'
import {
	Accessor,
	EntityAccessor,
	EntityForRemovalAccessor,
	EntityListAccessor,
	ErrorAccessor,
	FieldAccessor,
	GetSubTreeRoot,
	RootAccessor,
} from '../accessors'
import { MutationDataResponse, ReceivedData, ReceivedDataTree, ReceivedEntityData } from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { ConnectionMarker, EntityFieldMarkers, FieldMarker, MarkerTreeRoot, ReferenceMarker } from '../markers'
import { ExpectedEntityCount, FieldName, FieldValue, RemovalType, Scalar, SubTreeIdentifier } from '../treeParameters'
import { assertNever } from '../utils'
import { ErrorsPreprocessor } from './ErrorsPreprocessor'

type AddEntityEventListener = EntityAccessor['addEventListener']
type AddEntityListEventListener = EntityListAccessor['addEventListener']
type AddFieldEventListener = FieldAccessor['addEventListener']
type OnUpdate = (updatedData: EntityAccessor.NestedAccessor | undefined) => void
type OnReplace = EntityAccessor['replaceBy']
type OnUnlink = EntityAccessor['remove']
type BatchEntityUpdates = EntityAccessor['batchUpdates']
type BatchEntityListUpdates = EntityListAccessor['batchUpdates']

// If the listeners mutate the sub-tree, other listeners may want to respond to that, which in turn may trigger
// further responses, etc. We don't want the order of addition of event listeners to matter and we don't have
// the necessary information to perform some sort of a topological sort. We wouldn't want to do that anyway
// though.

// To get around all this, we just trigger all event listeners repeatedly until things settle and they stop
// mutating the entity. If, however, that doesn't happen until some number of iterations (I think the limit
// is actually fairly generous), we conclude that there is an infinite feedback loop and just shut things down.

// Notice also that we effectively shift the responsibility to check whether an update concerns them to the
// listeners.
const BEFORE_UPDATE_SETTLE_LIMIT = 100

type InternalRootStateNode = InternalEntityState | InternalEntityListState
type InternalStateNode = InternalEntityState | InternalEntityListState | InternalFieldState
type InternalEntityFields = Map<FieldName, InternalStateNode>

type OnEntityUpdate = (accessor: EntityAccessor | EntityForRemovalAccessor | undefined) => void
interface InternalEntityState {
	accessor: EntityAccessor | EntityForRemovalAccessor | undefined
	addEventListener: AddEntityEventListener
	batchUpdateDepth: number
	dirtyChildFields: Set<FieldName> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	eventListeners: {
		[Type in EntityAccessor.EntityEventType]: Set<EntityAccessor.EntityEventListenerMap[Type]> | undefined
	}
	fieldMarkers: EntityFieldMarkers
	fields: InternalEntityFields
	hasPendingUpdate: boolean
	id: string | EntityAccessor.UnpersistedEntityId
	onUpdate: OnEntityUpdate | Set<OnEntityUpdate>
	persistedData: AccessorTreeGenerator.InitialEntityData
	subTrees: Map<SubTreeIdentifier, RootAccessor> | undefined
}

type OnEntityListUpdate = (accessor: EntityListAccessor) => void
interface InternalEntityListState {
	accessor: EntityListAccessor
	addEventListener: AddEntityListEventListener
	batchUpdateDepth: number
	childIds: Set<string>
	dirtyChildIds: Set<string> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	eventListeners: {
		[Type in EntityListAccessor.EntityEventType]: Set<EntityListAccessor.EntityEventListenerMap[Type]> | undefined
	}
	fieldMarkers: EntityFieldMarkers
	hasPendingUpdate: boolean
	initialData: ReceivedEntityData<undefined>[] | Array<EntityAccessor | EntityForRemovalAccessor>
	onUpdate: OnEntityListUpdate
	preferences: ReferenceMarker.ReferencePreferences
}

type OnFieldUpdate = (placeholderName: FieldName, accessor: FieldAccessor) => void
interface InternalFieldState {
	accessor: FieldAccessor
	addEventListener: AddFieldEventListener
	errors: ErrorAccessor[]
	eventListeners: {
		[Type in FieldAccessor.FieldEventType]: Set<FieldAccessor.FieldEventListenerMap[Type]> | undefined
	}
	fieldMarker: FieldMarker
	hasPendingUpdate: boolean
	initialData: Scalar | undefined | FieldAccessor
	onUpdate: OnFieldUpdate
	persistedValue: FieldValue
	placeholderName: FieldName
	touchLog: Map<string, boolean> | undefined
}

class AccessorTreeGenerator {
	private persistedData: ReceivedDataTree<undefined> | undefined
	private initialData: RootAccessor | ReceivedDataTree<undefined> | undefined
	private errorTreeRoot?: ErrorsPreprocessor.ErrorTreeRoot
	private entityStore: Map<string, InternalEntityState> = new Map()
	private readonly getEntityByKey: (key: string) => EntityAccessor | EntityForRemovalAccessor | undefined = key =>
		this.entityStore.get(key)?.accessor

	private treeRootStates: WeakMap<MarkerTreeRoot, InternalRootStateNode> = new WeakMap()

	public constructor(private tree: MarkerTreeRoot) {}

	public generateLiveTree(
		persistedData: ReceivedDataTree<undefined> | undefined,
		initialData: RootAccessor | ReceivedDataTree<undefined> | undefined,
		updateData: AccessorTreeGenerator.UpdateData,
		errors?: MutationDataResponse,
	): void {
		let isFrozenWhileUpdating = false
		const preprocessor = new ErrorsPreprocessor(errors)

		this.errorTreeRoot = preprocessor.preprocess()
		console.debug(this.errorTreeRoot, errors)

		this.persistedData = persistedData
		this.initialData = initialData

		const updateDataWithEvents = (newData: RootAccessor) => {
			if (isFrozenWhileUpdating) {
				throw new BindingError(
					`Trying to perform an update while the whole accessor tree is already updating. This is most likely caused ` +
						`by updating the accessor tree during rendering or in the 'afterUpdate' event handler. That is a no-op. ` +
						`If you wish to react to changes, use the 'beforeUpdate' event handler.`,
				)
			}

			ReactDOM.unstable_batchedUpdates(() => {
				isFrozenWhileUpdating = true
				updateData(newData, this.getEntityByKey)
				subTreeState.hasPendingUpdate = true
				this.flushPendingAccessorUpdates(subTreeState)
				isFrozenWhileUpdating = false
			})
		}

		const subTreeState = this.generateSubTree(
			this.tree,
			initialData instanceof EntityAccessor ||
				initialData instanceof EntityListAccessor ||
				initialData instanceof EntityForRemovalAccessor
				? initialData
				: initialData === undefined
				? undefined
				: initialData[this.tree.id],
			updateDataWithEvents,
			this.errorTreeRoot,
		)

		updateDataWithEvents(subTreeState.accessor!)
	}

	private generateSubTree(
		tree: MarkerTreeRoot,
		data: ReceivedData<undefined> | RootAccessor,
		updateData: (newData: RootAccessor) => void,
		errors?: ErrorsPreprocessor.ErrorTreeRoot,
	): InternalRootStateNode {
		const errorNode = errors === undefined ? undefined : errors[tree.id]

		const onUpdate: OnUpdate = updatedData => {
			if (
				updatedData instanceof EntityAccessor ||
				updatedData instanceof EntityForRemovalAccessor ||
				updatedData instanceof EntityListAccessor
			) {
				subTreeState.hasPendingUpdate = true
				return updateData(updatedData)
			}
			return this.rejectInvalidAccessorTree()
		}

		let subTreeState: InternalEntityState | InternalEntityListState

		if (Array.isArray(data) || data === undefined || data instanceof EntityListAccessor) {
			const existingState = this.treeRootStates.get(tree) as InternalEntityListState
			const resolvedState = this.resolveOrCreateEntityListState(
				existingState,
				tree.fields,
				onUpdate,
				data,
				errorNode,
				undefined,
			)
			subTreeState = this.generateEntityListAccessor(resolvedState)
		} else {
			const existingState = this.treeRootStates.get(tree) as InternalEntityState
			const id = this.resolveOrCreateEntityId(data)
			const resolvedState = this.resolveOrCreateEntityState(id, existingState, tree.fields, onUpdate, data, errorNode)
			subTreeState = this.generateEntityAccessor(resolvedState)
		}
		this.treeRootStates.set(tree, subTreeState)

		return subTreeState
	}

	private updateFields(
		entityState: InternalEntityState,
		onUpdate: (identifier: string, updatedData: EntityAccessor.NestedAccessor | undefined) => void,
		onReplace: OnReplace,
		batchUpdates: BatchEntityUpdates,
		onUnlink?: OnUnlink,
	): EntityAccessor {
		const typename = entityState.persistedData
			? entityState.persistedData instanceof Accessor
				? entityState.persistedData.typename
				: entityState.persistedData[TYPENAME_KEY_NAME]
			: undefined

		const getSubTreeRoot: GetSubTreeRoot = identifier => entityState.subTrees?.get(identifier)

		for (const [placeholderName, field] of entityState.fieldMarkers) {
			if (placeholderName === PRIMARY_KEY_NAME) {
				// Falling back to null since that's what fields do. Arguably, we could also stringify the unpersisted entity id. Which is better?
				const idValue = typeof entityState.id === 'string' ? entityState.id : null
				entityState.fields.set(placeholderName, {
					accessor: new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
						placeholderName,
						idValue,
						idValue,
						undefined,
						returnFalse, // IDs cannot be updated, and thus they cannot be touched either
						emptyArray, // There cannot be errors associated with the id, right? If so, we should probably handle them at the Entity level.
						() => noop, // It won't ever fire but at the same time it makes other code simpler.
						undefined, // IDs cannot be updated
					),
					addEventListener: () => noop,
					eventListeners: {
						afterUpdate: undefined,
					},
					placeholderName,
					fieldMarker: field as FieldMarker,
					initialData: idValue,
					onUpdate: noop,
					errors: emptyArray,
					touchLog: undefined,
					hasPendingUpdate: false,
					persistedValue: idValue,
				})
				continue
			}

			if (field instanceof MarkerTreeRoot) {
				let initialData: ReceivedData<undefined> | RootAccessor

				if (
					this.initialData instanceof EntityAccessor ||
					this.initialData instanceof EntityListAccessor ||
					this.initialData instanceof EntityForRemovalAccessor
				) {
					if (this.persistedData === undefined) {
						initialData = undefined
					} else {
						initialData = this.persistedData[field.id]
					}
				} else if (this.initialData === undefined) {
					initialData = undefined
				} else {
					initialData = this.initialData[field.id]
				}

				if (entityState.subTrees === undefined) {
					entityState.subTrees = new Map()
				}

				entityState.subTrees.set(
					field.subTreeIdentifier || field.id,
					this.generateSubTree(field, initialData, () => undefined, undefined).accessor!,
				)
			} else if (field instanceof ReferenceMarker) {
				for (const referencePlaceholder in field.references) {
					const reference = field.references[referencePlaceholder]
					const fieldDatum = entityState.persistedData
						? entityState.persistedData instanceof Accessor
							? entityState.persistedData.getField(referencePlaceholder)
							: entityState.persistedData[referencePlaceholder]
						: undefined

					if (fieldDatum instanceof FieldAccessor) {
						throw new BindingError(
							`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`,
						)
					}

					const referenceError =
						entityState.errors && entityState.errors.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed
							? entityState.errors.children[field.fieldName] ||
							  entityState.errors.children[referencePlaceholder] ||
							  undefined
							: undefined

					const getOnReferenceUpdate = (placeholderName: string) => (
						newValue: EntityAccessor.NestedAccessor | undefined,
					) => onUpdate(placeholderName, newValue)
					if (reference.expectedCount === ExpectedEntityCount.UpToOne) {
						if (Array.isArray(fieldDatum) || fieldDatum instanceof EntityListAccessor) {
							throw new BindingError(
								`Received a collection of entities for field '${field.fieldName}' where a single entity was expected. ` +
									`Perhaps you wanted to use a <Repeater />?`,
							)
						} else if (fieldDatum === null || typeof fieldDatum === 'object' || fieldDatum === undefined) {
							const entityId = this.resolveOrCreateEntityId(fieldDatum || undefined)
							const referenceEntityState = this.generateEntityAccessor(
								this.resolveOrCreateEntityState(
									entityId,
									this.getExistingEntityState(entityId),
									reference.fields,
									getOnReferenceUpdate(referencePlaceholder),
									fieldDatum || undefined,
									referenceError,
								),
							)
							entityState.fields.set(referencePlaceholder, referenceEntityState)
						} else {
							throw new BindingError(
								`Received a scalar value for field '${field.fieldName}' where a single entity was expected.` +
									`Perhaps you meant to use a variant of <Field />?`,
							)
						}
					} else if (reference.expectedCount === ExpectedEntityCount.PossiblyMany) {
						if (fieldDatum === undefined || Array.isArray(fieldDatum) || fieldDatum instanceof EntityListAccessor) {
							const referenceEntityListState = this.resolveOrCreateEntityListState(
								entityState.fields.get(referencePlaceholder) as InternalEntityListState | undefined,
								reference.fields,
								getOnReferenceUpdate(referencePlaceholder),
								fieldDatum,
								referenceError,
								reference.preferences,
							)
							entityState.fields.set(referencePlaceholder, this.generateEntityListAccessor(referenceEntityListState))
						} else if (typeof fieldDatum === 'object') {
							// Intentionally allowing `fieldDatum === null` here as well since this should only happen when a *hasOne
							// relation is unlinked, e.g. a Person does not have a linked Nationality.
							throw new BindingError(
								`Received a referenced entity for field '${field.fieldName}' where a collection of entities was expected.` +
									`Perhaps you wanted to use a <HasOne />?`,
							)
						} else {
							throw new BindingError(
								`Received a scalar value for field '${field.fieldName}' where a collection of entities was expected.` +
									`Perhaps you meant to use a variant of <Field />?`,
							)
						}
					} else {
						return assertNever(reference.expectedCount)
					}
				}
			} else if (field instanceof FieldMarker) {
				const fieldDatum = entityState.persistedData
					? entityState.persistedData instanceof Accessor
						? entityState.persistedData.getField(placeholderName)
						: entityState.persistedData[placeholderName]
					: undefined
				if (
					fieldDatum instanceof EntityListAccessor ||
					fieldDatum instanceof EntityAccessor ||
					fieldDatum instanceof EntityForRemovalAccessor
				) {
					return this.rejectInvalidAccessorTree()
				} else if (Array.isArray(fieldDatum)) {
					throw new BindingError(
						`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use a <Repeater />?`,
					)
				} else if (!(fieldDatum instanceof FieldAccessor) && typeof fieldDatum === 'object' && fieldDatum !== null) {
					throw new BindingError(
						`Received a referenced entity where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use <HasOne />?`,
					)
				} else {
					const fieldErrors: ErrorAccessor[] =
						entityState.errors &&
						entityState.errors.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed &&
						field.fieldName in entityState.errors.children
							? entityState.errors.children[field.fieldName].errors
							: emptyArray
					const fieldState = this.generateFieldAccessor(
						this.resolveOrCreateFieldState(
							placeholderName,
							entityState.fields.get(placeholderName) as InternalFieldState | undefined,
							field,
							onUpdate,
							fieldDatum,
							fieldErrors,
						),
					)
					entityState.fields.set(placeholderName, fieldState)
				}
			} else if (field instanceof ConnectionMarker) {
				// Do nothing ‒ connections need no runtime representation
			} else {
				assertNever(field)
			}
		}

		return new EntityAccessor(
			entityState.id,
			typename,

			// We're technically exposing more info in runtime than we'd like but that way we don't have to allocate and
			// keep in sync two copies of the same data. TS hides the extra info anyway.
			entityState.fields,
			getSubTreeRoot,
			entityState.errors ? entityState.errors.errors : emptyArray,
			entityState.addEventListener,
			batchUpdates,
			onReplace,
			onUnlink,
		)
	}

	private generateEntityAccessor(entityState: InternalEntityState): InternalEntityState {
		const performUpdate = () => {
			entityState.hasPendingUpdate = true
			if (typeof entityState.onUpdate === 'function') {
				entityState.onUpdate(entityState.accessor)
			} else {
				for (const onUpdate of entityState.onUpdate) {
					onUpdate(entityState.accessor)
				}
			}
		}
		const onUpdateProxy = (newValue: EntityAccessor | EntityForRemovalAccessor | undefined) => {
			batchUpdates(getAccessor => {
				entityState.accessor = newValue

				if (
					entityState.eventListeners.beforeUpdate === undefined ||
					entityState.eventListeners.beforeUpdate.size === 0
				) {
					return
				}

				for (let i = 0; i < BEFORE_UPDATE_SETTLE_LIMIT; i++) {
					for (const listener of entityState.eventListeners.beforeUpdate) {
						listener(getAccessor)
					}
					if (entityState.accessor === getAccessor()) {
						return
					}
				}
				throw new BindingError(
					`EntityAccessor beforeUpdate event: maximum stabilization limit exceeded. ` +
						`This likely means an infinite feedback loop in your code.`,
				)
			})
		}
		const onUpdate = (updatedField: FieldName, updatedData: EntityAccessor.NestedAccessor | undefined) => {
			const entityAccessor = entityState.accessor
			if (entityAccessor instanceof EntityAccessor) {
				const currentFieldState = entityState.fields.get(updatedField)
				if (
					!(entityAccessor instanceof EntityAccessor) ||
					currentFieldState === undefined //||
					//currentFieldState.accessor === updatedData
					// TODO this shouldn't be necessary to comment out. Something's super fishy with hasOne relations.
				) {
					return
				}
				currentFieldState.accessor = updatedData
				const newAccessor = new EntityAccessor(
					entityAccessor.runtimeId,
					entityAccessor.typename,
					entityState.fields,
					entityAccessor.getSubTreeRoot,
					entityAccessor.errors,
					entityAccessor.addEventListener,
					entityAccessor.batchUpdates,
					entityAccessor.replaceBy,
					entityAccessor.remove,
				)

				if (entityState.dirtyChildFields === undefined) {
					entityState.dirtyChildFields = new Set()
				}
				entityState.dirtyChildFields.add(updatedField)
				return onUpdateProxy(newAccessor)
			}
			return this.rejectInvalidAccessorTree()
		}
		const onReplace: OnReplace = replacement => onUpdateProxy(this.replaceEntity(entityState, replacement, onRemove))
		const onRemove = (removalType: RemovalType) => {
			if (entityState.batchUpdateDepth !== 0) {
				throw new BindingError(`Removing entities that are being batch updated is a no-op.`)
			}
			if (
				!entityState.persistedData ||
				entityState.persistedData instanceof EntityForRemovalAccessor ||
				!(entityState.accessor instanceof EntityAccessor)
			) {
				this.entityStore.delete(entityState.accessor?.key!)
				return onUpdateProxy(undefined)
			}

			onUpdateProxy(new EntityForRemovalAccessor(entityState.accessor, entityState.accessor.replaceBy, removalType))
		}
		const batchUpdates: BatchEntityUpdates = performUpdates => {
			entityState.batchUpdateDepth++
			const accessorBeforeUpdates = entityState.accessor
			performUpdates(() => {
				const accessor = entityState.accessor
				if (accessor instanceof EntityAccessor) {
					return accessor
				}
				throw new BindingError(`The entity that was being batch-updated somehow got deleted which was a no-op.`)
			})
			entityState.batchUpdateDepth--
			if (entityState.batchUpdateDepth === 0 && accessorBeforeUpdates !== entityState.accessor) {
				performUpdate()
			}
		}
		entityState.accessor = this.updateFields(entityState, onUpdate, onReplace, batchUpdates, onRemove)
		return entityState
	}

	private generateEntityListAccessor(entityListState: InternalEntityListState): InternalEntityListState {
		if (entityListState.errors && entityListState.errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.KeyIndexed) {
			throw new BindingError(
				`The error tree structure does not correspond to the marker tree. This should never happen.`,
			)
		}

		const updateAccessorInstance = () => {
			const accessor = entityListState.accessor!
			entityListState.hasPendingUpdate = true
			return (entityListState.accessor = new EntityListAccessor(
				accessor.getEntityByKey,
				entityListState.childIds,
				accessor.errors,
				accessor.addEventListener,
				accessor.batchUpdates,
				accessor.addNew,
			))
		}
		const batchUpdates: BatchEntityListUpdates = performUpdates => {
			entityListState.batchUpdateDepth++
			const accessorBeforeUpdates = entityListState.accessor
			performUpdates(() => entityListState.accessor!)
			entityListState.batchUpdateDepth--
			if (entityListState.batchUpdateDepth === 0 && accessorBeforeUpdates !== entityListState.accessor) {
				entityListState.onUpdate(entityListState.accessor)
			}
		}

		const onUpdateProxy = (key: string, newValue: EntityAccessor.NestedAccessor | undefined) => {
			batchUpdates(getAccessor => {
				if (
					!(
						newValue instanceof EntityAccessor ||
						newValue instanceof EntityForRemovalAccessor ||
						newValue === undefined
					)
				) {
					throw new BindingError(`Illegal entity list value.`)
				}
				if (newValue === undefined) {
					entityListState.childIds.delete(key)
				} else {
					const childState = this.entityStore.get(key)
					if (childState === undefined) {
						this.rejectInvalidAccessorTree()
					}

					childState.accessor = newValue

					if (entityListState.dirtyChildIds === undefined) {
						entityListState.dirtyChildIds = new Set()
					}
					entityListState.dirtyChildIds.add(key)
				}
				updateAccessorInstance()

				if (
					entityListState.eventListeners.beforeUpdate === undefined ||
					entityListState.eventListeners.beforeUpdate.size === 0
				) {
					return
				}

				for (let i = 0; i < BEFORE_UPDATE_SETTLE_LIMIT; i++) {
					for (const listener of entityListState.eventListeners.beforeUpdate) {
						listener(getAccessor)
					}
					if (entityListState.accessor === getAccessor()) {
						return
					}
				}
				throw new BindingError(
					`EntityAccessor beforeUpdate event: maximum stabilization limit exceeded. ` +
						`This likely means an infinite feedback loop in your code.`,
				)
			})
		}
		const generateNewAccessor = (datum: AccessorTreeGenerator.InitialEntityData): EntityAccessor => {
			const id = this.resolveOrCreateEntityId(datum)
			const key = typeof id === 'string' ? id : id.value
			let childErrors

			if (entityListState.errors && datum) {
				const errorKey =
					datum instanceof EntityAccessor || datum instanceof EntityForRemovalAccessor
						? datum.key
						: datum[PRIMARY_KEY_NAME]
				childErrors = (entityListState.errors as ErrorsPreprocessor.KeyIndexedErrorNode).children[errorKey]
			} else {
				childErrors = undefined
			}

			const onUpdate: OnUpdate = newValue => onUpdateProxy(key, newValue)

			const entityState = this.generateEntityAccessor(
				this.resolveOrCreateEntityState(
					id,
					this.getExistingEntityState(id),
					entityListState.fieldMarkers,
					onUpdate,
					datum,
					childErrors,
				),
			)

			entityListState.childIds.add(key)

			return entityState.accessor as EntityAccessor
		}
		const getChildEntityByKey = (key: string) => {
			if (!entityListState.childIds.has(key)) {
				return undefined
			}
			return this.getEntityByKey(key)
		}

		for (const sourceDatum of entityListState.initialData) {
			generateNewAccessor(sourceDatum)
		}

		entityListState.accessor = new EntityListAccessor(
			getChildEntityByKey,
			entityListState.childIds,
			entityListState.errors ? entityListState.errors.errors : emptyArray,
			entityListState.addEventListener,
			batchUpdates,
			newEntity => {
				const newAccessor = generateNewAccessor(typeof newEntity === 'function' ? undefined : newEntity)

				if (typeof newEntity === 'function') {
					entityListState.accessor!.batchUpdates(getAccessor => {
						onUpdateProxy(newAccessor.key, newAccessor)
						newEntity(getAccessor, newAccessor.key)
					})
				} else {
					onUpdateProxy(newAccessor.key, newAccessor)
				}
			},
		)

		return entityListState
	}

	private generateFieldAccessor(fieldState: InternalFieldState): InternalFieldState {
		const isTouchedBy = (agent: string) =>
			fieldState.touchLog === undefined ? false : fieldState.touchLog.get(agent) || false
		const createNewInstance = (value: FieldValue) =>
			new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
				fieldState.placeholderName,
				value,
				fieldState.persistedValue,
				fieldState.fieldMarker.defaultValue,
				isTouchedBy,
				fieldState.errors,
				fieldState.addEventListener,
				onChange,
			)
		const onChange = function(
			this: FieldAccessor,
			newValue: Scalar | GraphQlBuilder.Literal,
			{ agent = FieldAccessor.userAgent }: FieldAccessor.UpdateOptions = {},
		) {
			if (this !== fieldState.accessor) {
				throw new BindingError(
					`Trying to update a field value via a stale FieldAccessor. Perhaps you're dealing with stale props?`,
				)
			}
			if (fieldState.touchLog === undefined) {
				fieldState.touchLog = new Map()
			}
			fieldState.touchLog.set(agent, true)
			if (newValue === this.currentValue) {
				return
			}
			fieldState.hasPendingUpdate = true
			fieldState.onUpdate(fieldState.placeholderName, createNewInstance(newValue))
		}

		let fieldValue: FieldValue
		if (fieldState.initialData === undefined) {
			// `initialData` will be `undefined` when a repeater creates a clone based on no data or when we're creating
			// a new entity
			fieldValue = fieldState.fieldMarker.defaultValue === undefined ? null : fieldState.fieldMarker.defaultValue
		} else {
			fieldValue =
				fieldState.initialData instanceof FieldAccessor ? fieldState.initialData.currentValue : fieldState.initialData
		}
		fieldState.accessor = createNewInstance(fieldValue)

		return fieldState
	}

	private replaceEntity(
		original: InternalEntityState,
		replacement: EntityAccessor,
		onRemove?: EntityAccessor['remove'],
	): EntityAccessor {
		// TODO: we also need to update the callbacks inside replacement.data
		const blueprint =
			original.accessor instanceof EntityAccessor ? original.accessor : original.accessor!.entityAccessor
		return new EntityAccessor(
			replacement.runtimeId,
			blueprint.typename,
			original.fields,
			replacement.getSubTreeRoot,
			blueprint.errors,
			blueprint.addEventListener,
			blueprint.batchUpdates,
			blueprint.replaceBy,
			onRemove || blueprint.remove,
		)
	}

	private rejectInvalidAccessorTree(): never {
		throw new BindingError(
			`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`,
		)
	}

	private resolveOrCreateFieldState(
		placeholderName: FieldName,
		existingState: InternalFieldState | undefined,
		fieldMarker: FieldMarker,
		onUpdate: OnFieldUpdate,
		initialData: Scalar | undefined | FieldAccessor,
		errors: ErrorAccessor[],
	): InternalFieldState {
		const persistedValue =
			initialData instanceof FieldAccessor ? initialData.persistedValue : initialData === undefined ? null : initialData
		if (existingState === undefined) {
			const state: InternalFieldState = {
				errors,
				fieldMarker,
				onUpdate,
				placeholderName,
				persistedValue,
				initialData,
				addEventListener: undefined as any,
				accessor: (undefined as any) as FieldAccessor,
				eventListeners: {
					afterUpdate: undefined,
				},
				touchLog: undefined,
				hasPendingUpdate: true,
			}
			state.addEventListener = this.getAddEventListener(state)
			return state
		}

		existingState.errors = errors
		existingState.onUpdate = onUpdate
		existingState.initialData = initialData
		existingState.persistedValue = persistedValue
		existingState.hasPendingUpdate = true

		return existingState
	}

	private resolveOrCreateEntityState(
		id: string | EntityAccessor.UnpersistedEntityId,
		existingState: InternalEntityState | undefined,
		fieldMarkers: EntityFieldMarkers,
		onUpdate: OnEntityUpdate,
		persistedData: AccessorTreeGenerator.InitialEntityData,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
	): InternalEntityState {
		const entityKey = typeof id === 'string' ? id : id.value

		if (existingState === undefined) {
			const entityState: InternalEntityState = {
				id,
				errors,
				persistedData,
				fieldMarkers,
				onUpdate,
				accessor: undefined,
				batchUpdateDepth: 0,
				dirtyChildFields: undefined,
				addEventListener: undefined as any,
				eventListeners: {
					afterUpdate: undefined,
					beforeUpdate: undefined,
				},
				subTrees: undefined,
				fields: new Map(),
				hasPendingUpdate: true,
			}
			entityState.addEventListener = this.getAddEventListener(entityState)
			this.entityStore.set(entityKey, entityState)
			return entityState
		}

		// TODO use entity fields?
		existingState.batchUpdateDepth = 0
		existingState.hasPendingUpdate = true
		existingState.errors = errors
		existingState.onUpdate = onUpdate
		existingState.persistedData = persistedData

		if (existingState.dirtyChildFields === undefined) {
			existingState.dirtyChildFields = new Set(existingState.fields.keys())
		} else {
			for (const [fieldName] of existingState.fields) {
				existingState.dirtyChildFields.add(fieldName)
			}
		}
		return existingState
	}

	private getExistingEntityState(id: string | EntityAccessor.UnpersistedEntityId): InternalEntityState | undefined {
		return this.entityStore.get(typeof id === 'string' ? id : id.value)
	}

	private resolveOrCreateEntityListState(
		existingState: InternalEntityListState | undefined,
		fieldMarkers: EntityFieldMarkers,
		onUpdate: OnEntityListUpdate,
		initialData: ReceivedEntityData<undefined>[] | EntityListAccessor | undefined,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		preferences: ReferenceMarker.ReferencePreferences | undefined,
	): InternalEntityListState {
		preferences = preferences || ReferenceMarker.defaultReferencePreferences[ExpectedEntityCount.PossiblyMany]

		let sourceData = initialData instanceof EntityListAccessor ? Array.from(initialData) : initialData || []
		if (
			sourceData.length === 0 ||
			sourceData.every(
				(datum: ReceivedEntityData<undefined> | EntityAccessor | EntityForRemovalAccessor | undefined) =>
					datum === undefined,
			)
		) {
			sourceData = Array(preferences.initialEntityCount).map(() => undefined)
		}

		if (existingState === undefined) {
			const state: InternalEntityListState = {
				errors,
				fieldMarkers,
				onUpdate,
				preferences,
				addEventListener: undefined as any,
				initialData: sourceData,
				accessor: (undefined as any) as EntityListAccessor,
				batchUpdateDepth: 0,
				childIds: new Set(),
				dirtyChildIds: undefined,
				eventListeners: {
					afterUpdate: undefined,
					beforeUpdate: undefined,
				},
				hasPendingUpdate: true,
			}
			state.addEventListener = this.getAddEventListener(state)
			return state
		}

		existingState.batchUpdateDepth = 0
		existingState.hasPendingUpdate = true
		existingState.errors = errors
		existingState.onUpdate = onUpdate
		existingState.initialData = sourceData

		if (existingState.dirtyChildIds === undefined) {
			existingState.dirtyChildIds = new Set(existingState.childIds)
		} else {
			for (const childId of existingState.childIds) {
				existingState.dirtyChildIds.add(childId)
			}
		}
		// TODO This is kind of crap. We should resolve child ids from here.
		// 	It's also a memory leak in the entity store.
		existingState.childIds.clear()
		return existingState
	}

	private resolveOrCreateEntityId(
		data: AccessorTreeGenerator.InitialEntityData,
	): string | EntityAccessor.UnpersistedEntityId {
		return data
			? data instanceof EntityAccessor || data instanceof EntityForRemovalAccessor
				? data.runtimeId
				: data[PRIMARY_KEY_NAME]
			: new EntityAccessor.UnpersistedEntityId()
	}

	private getAddEventListener(state: {
		eventListeners: {
			[eventType: string]: Set<Function> | undefined
		}
	}) {
		return (type: string, listener: Function) => {
			if (state.eventListeners[type] === undefined) {
				state.eventListeners[type] = new Set<never>()
			}
			state.eventListeners[type]!.add(listener as any)
			return () => {
				if (state.eventListeners[type] === undefined) {
					return // Throw an error? This REALLY should not happen.
				}
				state.eventListeners[type]!.delete(listener as any)
				if (state.eventListeners[type]!.size === 0) {
					state.eventListeners[type] = undefined
				}
			}
		}
	}

	private flushPendingAccessorUpdates(rootState: InternalEntityState | InternalEntityListState) {
		// It is *CRUCIAL* that this is a BFS so that we update the components in top-down order.
		const agenda: Array<InternalEntityState | InternalEntityListState | InternalFieldState> = [rootState]

		for (const state of agenda) {
			console.log(state)
			if (!state.hasPendingUpdate) {
				continue
			}
			if (state.eventListeners.afterUpdate !== undefined) {
				for (const handler of state.eventListeners.afterUpdate) {
					// TS can't quite handle the polymorphism here but this is fine.
					state.accessor && handler(state.accessor as any)
				}
			}
			if (state.accessor instanceof FieldAccessor) {
				// Do nothing
			} else if (state.accessor instanceof EntityListAccessor) {
				const listState = state as InternalEntityListState

				if (listState.dirtyChildIds !== undefined) {
					for (const dirtyChildId of listState.dirtyChildIds) {
						const dirtyChildState = this.entityStore.get(dirtyChildId)
						if (dirtyChildState === undefined) {
							throw new BindingError()
						}
						agenda.push(dirtyChildState)
					}
					listState.dirtyChildIds = undefined
				}
			} else {
				const entityState = state as InternalEntityState

				if (entityState.dirtyChildFields !== undefined) {
					for (const dirtyChildPlaceholder of entityState.dirtyChildFields) {
						const dirtyChildState = entityState.fields.get(dirtyChildPlaceholder)
						if (dirtyChildState === undefined) {
							throw new BindingError()
						}
						agenda.push(dirtyChildState)
					}
					entityState.dirtyChildFields = undefined
				}
			}
			state.hasPendingUpdate = false
		}
	}
}

namespace AccessorTreeGenerator {
	export type UpdateData = (
		newData: RootAccessor,
		getEntityByKey: (key: string) => EntityAccessor | EntityForRemovalAccessor | undefined,
	) => void

	export type InitialEntityData = ReceivedEntityData<undefined> | EntityAccessor | EntityForRemovalAccessor
}

export { AccessorTreeGenerator }
