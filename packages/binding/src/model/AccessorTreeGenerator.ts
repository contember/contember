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
	RootAccessor,
} from '../accessors'
import { MutationDataResponse, ReceivedData, ReceivedDataTree, ReceivedEntityData } from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import {
	ConnectionMarker,
	EntityFieldMarkers,
	FieldMarker,
	MarkerTreeParameters,
	MarkerTreeRoot,
	PlaceholderGenerator,
	ReferenceMarker,
	TaggedQualifiedEntityList,
	TaggedQualifiedSingleEntity,
	TaggedUnconstrainedQualifiedEntityList,
	TaggedUnconstrainedQualifiedSingleEntity,
} from '../markers'
import { ExpectedEntityCount, FieldName, FieldValue, RemovalType, Scalar } from '../treeParameters'
import { assertNever } from '../utils'
import { ErrorsPreprocessor } from './ErrorsPreprocessor'

type AddEntityEventListener = EntityAccessor['addEventListener']
type AddEntityListEventListener = EntityListAccessor['addEventListener']
type AddFieldEventListener = FieldAccessor['addEventListener']
type OnReplace = EntityAccessor['replaceBy']
type OnUnlink = EntityAccessor['remove']
type BatchEntityUpdates = EntityAccessor['batchUpdates']
type BatchEntityListUpdates = EntityListAccessor['batchUpdates']

// This only applies to the 'beforeUpdate' event:

// If the listeners mutate the sub-tree, other listeners may want to respond to that, which in turn may trigger
// further responses, etc. We don't want the order of addition of event listeners to matter and we don't have
// the necessary information to perform some sort of a topological sort. We wouldn't want to do that anyway
// though.

// To get around all this, we just trigger all event listeners repeatedly until things settle and they stop
// mutating the accessor. If, however, that doesn't happen until some number of iterations (I think the limit
// is actually fairly generous), we conclude that there is an infinite feedback loop and just shut things down.

// Notice also that we effectively shift the responsibility to check whether an update concerns them to the
// listeners.
const BEFORE_UPDATE_SETTLE_LIMIT = 20

type InternalRootStateNode = InternalEntityState | InternalEntityListState
type InternalStateNode = InternalEntityState | InternalEntityListState | InternalFieldState

// Entity realms address the fact that a single particular entity may appear several times throughout the tree in
// completely different contexts. Even with different fields.
interface EntityRealm {
	depth: number
	onUpdate: OnEntityUpdate
}

interface InternalContainerState {
	batchUpdateDepth: number
	hasPendingUpdate: boolean
}

type OnEntityUpdate = (accessor: EntityAccessor | EntityForRemovalAccessor | null) => void
interface InternalEntityState extends InternalContainerState {
	accessor: EntityAccessor | EntityForRemovalAccessor | null
	addEventListener: AddEntityEventListener
	dirtyChildFields: Set<FieldName> | undefined
	dirtySubTrees: Set<string> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	eventListeners: {
		[Type in EntityAccessor.EntityEventType]: Set<EntityAccessor.EntityEventListenerMap[Type]> | undefined
	}
	fields: Map<FieldName, InternalStateNode>
	id: string | EntityAccessor.UnpersistedEntityId
	persistedData: AccessorTreeGenerator.InitialEntityData
	realms: Map<EntityFieldMarkers, EntityRealm>
	subTrees: Map<string, InternalRootStateNode> | undefined
}

type OnEntityListUpdate = (accessor: EntityListAccessor) => void
interface InternalEntityListState extends InternalContainerState {
	accessor: EntityListAccessor
	addEventListener: AddEntityListEventListener
	childIds: Set<string>
	dirtyChildIds: Set<string> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	eventListeners: {
		[Type in EntityListAccessor.EntityListEventType]:
			| Set<EntityListAccessor.EntityListEventListenerMap[Type]>
			| undefined
	}
	fieldMarkers: EntityFieldMarkers
	initialData: ReceivedEntityData<undefined>[] | Array<EntityAccessor | EntityForRemovalAccessor>
	removeEntity: EntityListAccessor.RemoveEntity
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
	private readonly getEntityByKey = (key: string) => {
		const entity = this.entityStore.get(key)

		if (entity === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent entity.`)
		}
		return entity.accessor
	}

	private treeRootStates: WeakMap<MarkerTreeRoot, InternalRootStateNode> = new WeakMap()
	private treeWideBatchUpdateDepth = 0

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
			if (this.treeWideBatchUpdateDepth > 0) {
				return
			}

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

		const subTreeState = this.initializeSubTree(
			this.tree,
			initialData instanceof EntityAccessor ||
				initialData instanceof EntityListAccessor ||
				initialData instanceof EntityForRemovalAccessor
				? initialData
				: initialData === undefined
				? undefined
				: initialData[this.tree.placeholderName],
			updateDataWithEvents,
			this.errorTreeRoot,
		)

		updateDataWithEvents(subTreeState.accessor!)
	}

	private initializeSubTree(
		tree: MarkerTreeRoot,
		data: ReceivedData<undefined> | RootAccessor,
		updateData: (newData: RootAccessor) => void,
		errors?: ErrorsPreprocessor.ErrorTreeRoot,
	): InternalRootStateNode {
		const errorNode = errors === undefined ? undefined : errors[tree.placeholderName]

		const onUpdate = (updatedData: EntityAccessor.NestedAccessor | null) => {
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
			subTreeState = this.initializeEntityListAccessor(resolvedState)
		} else {
			const existingState = this.treeRootStates.get(tree) as InternalEntityState
			const id = this.resolveOrCreateEntityId(data)
			const resolvedState = this.resolveOrCreateEntityState(id, existingState, tree.fields, onUpdate, data, errorNode)
			subTreeState = this.initializeEntityAccessor(resolvedState, tree.fields)
		}
		this.treeRootStates.set(tree, subTreeState)

		return subTreeState
	}

	private updateFields(
		entityState: InternalEntityState,
		markers: EntityFieldMarkers,
		onFieldUpdate: (identifier: string, updatedData: EntityAccessor.NestedAccessor | null) => void,
		onSubTreeUpdate: (placeholderName: string, updatedRoot: RootAccessor) => void,
		onReplace: OnReplace,
		batchUpdates: BatchEntityUpdates,
		onUnlink?: OnUnlink,
	): EntityAccessor {
		const typename = entityState.persistedData
			? entityState.persistedData instanceof Accessor
				? entityState.persistedData.typename
				: entityState.persistedData[TYPENAME_KEY_NAME]
			: undefined

		// TODO move this and change sub tree identifiers
		function getSubTree(parameters: TaggedQualifiedSingleEntity): EntityAccessor | EntityForRemovalAccessor | null
		function getSubTree(parameters: TaggedQualifiedEntityList): EntityListAccessor
		function getSubTree(parameters: TaggedUnconstrainedQualifiedSingleEntity): EntityAccessor
		function getSubTree(parameters: TaggedUnconstrainedQualifiedEntityList): EntityListAccessor
		function getSubTree(
			parameters: MarkerTreeParameters,
		): EntityAccessor | EntityForRemovalAccessor | null | EntityListAccessor {
			return entityState.subTrees?.get(PlaceholderGenerator.getMarkerTreePlaceholder(parameters))?.accessor || null
		}

		// We're overwriting existing states in entityState.fields which could already be there from a different
		// entity realm. Most of the time this results in an equivalent accessor instance, and so for those cases this
		// is rather inefficient. However, there are cases where we do want to do this. (E.g. refresh after a persist)
		// or when a reference further down the tree would introduce more fields.
		for (const [placeholderName, field] of markers) {
			if (placeholderName === PRIMARY_KEY_NAME) {
				// TODO get rid of this verbose monstrosity and handle ids properly.
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
						update: undefined,
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
						initialData = this.persistedData[field.placeholderName]
					}
				} else if (this.initialData === undefined) {
					initialData = undefined
				} else {
					initialData = this.initialData[field.placeholderName]
				}

				if (entityState.subTrees === undefined) {
					entityState.subTrees = new Map()
				}

				const onThisSubTreeUpdate = (newRoot: RootAccessor) => onSubTreeUpdate(field.placeholderName, newRoot)

				entityState.subTrees.set(
					field.placeholderName,
					this.initializeSubTree(field, initialData, onThisSubTreeUpdate, undefined),
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

					const getOnReferenceUpdate = (placeholderName: string) => (newValue: EntityAccessor.NestedAccessor | null) =>
						onFieldUpdate(placeholderName, newValue)
					if (reference.expectedCount === ExpectedEntityCount.UpToOne) {
						if (Array.isArray(fieldDatum) || fieldDatum instanceof EntityListAccessor) {
							throw new BindingError(
								`Received a collection of entities for field '${field.fieldName}' where a single entity was expected. ` +
									`Perhaps you wanted to use a <Repeater />?`,
							)
						} else if (fieldDatum === null || typeof fieldDatum === 'object' || fieldDatum === undefined) {
							const entityId = this.resolveOrCreateEntityId(fieldDatum || undefined)
							const referenceEntityState = this.initializeEntityAccessor(
								this.resolveOrCreateEntityState(
									entityId,
									this.getExistingEntityState(entityId),
									reference.fields,
									getOnReferenceUpdate(referencePlaceholder),
									fieldDatum || undefined,
									referenceError,
								),
								reference.fields,
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
							entityState.fields.set(referencePlaceholder, this.initializeEntityListAccessor(referenceEntityListState))
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
					const fieldState = this.initializeFieldAccessor(
						this.resolveOrCreateFieldState(
							placeholderName,
							entityState.fields.get(placeholderName) as InternalFieldState | undefined,
							field,
							onFieldUpdate,
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
			getSubTree,
			entityState.errors ? entityState.errors.errors : emptyArray,
			entityState.addEventListener,
			batchUpdates,
			onReplace,
			onUnlink,
		)
	}

	private initializeEntityAccessor(entityState: InternalEntityState, markers: EntityFieldMarkers): InternalEntityState {
		const performUpdate = () => {
			entityState.hasPendingUpdate = true
			this.treeWideBatchUpdateDepth++
			const realmCount = entityState.realms.size
			let i = 1
			for (const [, { onUpdate }] of entityState.realms) {
				if (i++ === realmCount) {
					this.treeWideBatchUpdateDepth--
				}
				onUpdate(entityState.accessor)
			}
		}
		const onUpdateProxy = (newValue: EntityAccessor | EntityForRemovalAccessor | null) => {
			batchUpdates(getAccessor => {
				entityState.accessor = newValue

				if (
					entityState.eventListeners.beforeUpdate === undefined ||
					entityState.eventListeners.beforeUpdate.size === 0
				) {
					return
				}

				let currentAccessor: EntityAccessor
				for (let i = 0; i < BEFORE_UPDATE_SETTLE_LIMIT; i++) {
					currentAccessor = getAccessor()
					for (const listener of entityState.eventListeners.beforeUpdate) {
						listener(getAccessor)
					}
					if (currentAccessor === getAccessor()) {
						return
					}
				}
				throw new BindingError(
					`EntityAccessor beforeUpdate event: maximum stabilization limit exceeded. ` +
						`This likely means an infinite feedback loop in your code.`,
				)
			})
		}
		const onFieldUpdate = (updatedField: FieldName, updatedData: EntityAccessor.NestedAccessor | null) => {
			const entityAccessor = entityState.accessor
			if (!(entityAccessor instanceof EntityAccessor)) {
				return this.rejectInvalidAccessorTree()
			}
			const currentFieldState = entityState.fields.get(updatedField)
			if (
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
				entityAccessor.getSubTree,
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
		const onSubTreeUpdate = (placeholderName: string, updatedRoot: RootAccessor) => {
			const entityAccessor = entityState.accessor
			if (!(entityAccessor instanceof EntityAccessor)) {
				return this.rejectInvalidAccessorTree()
			}
			if (entityState.subTrees === undefined) {
				entityState.subTrees = new Map()
			}
			const subTreeState = entityState.subTrees.get(placeholderName)
			if (
				subTreeState === undefined //||
				//currentFieldState.accessor === updatedData
				// TODO this shouldn't be necessary to comment out. Something's super fishy with hasOne relations.
			) {
				return
			}
			subTreeState.accessor = updatedRoot
			const newAccessor = new EntityAccessor(
				entityAccessor.runtimeId,
				entityAccessor.typename,
				entityState.fields,
				entityAccessor.getSubTree,
				entityAccessor.errors,
				entityAccessor.addEventListener,
				entityAccessor.batchUpdates,
				entityAccessor.replaceBy,
				entityAccessor.remove,
			)

			if (entityState.dirtySubTrees === undefined) {
				entityState.dirtySubTrees = new Set()
			}
			entityState.dirtySubTrees.add(placeholderName)

			if (entityState.hasPendingUpdate) {
				return
			}
			onUpdateProxy(newAccessor)
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
				// TODO it isn't safe to just delete it as the entity may be linked from other places too.
				//		Just leaving it is a memory leak though.
				//this.entityStore.delete(entityState.accessor?.key!)
				return onUpdateProxy(null)
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
		entityState.accessor = this.updateFields(
			entityState,
			markers,
			onFieldUpdate,
			onSubTreeUpdate,
			onReplace,
			batchUpdates,
			onRemove,
		)
		return entityState
	}

	private initializeEntityListAccessor(entityListState: InternalEntityListState): InternalEntityListState {
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
				accessor.removeEntity,
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

		const removeEntity: EntityListAccessor.RemoveEntity = function(this: EntityListAccessor, key, removalType) {
			// TODO
		}

		const onUpdateProxy = (key: string, newValue: EntityAccessor.NestedAccessor | null) => {
			batchUpdates(getAccessor => {
				if (
					!(newValue instanceof EntityAccessor || newValue instanceof EntityForRemovalAccessor || newValue === null)
				) {
					throw new BindingError(`Illegal entity list value.`)
				}
				if (newValue === null) {
					entityListState.dirtyChildIds?.delete(key)
					entityListState.childIds.delete(key)
					// TODO delete the entity from the store
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

				let currentAccessor: EntityListAccessor
				for (let i = 0; i < BEFORE_UPDATE_SETTLE_LIMIT; i++) {
					currentAccessor = getAccessor()
					for (const listener of entityListState.eventListeners.beforeUpdate) {
						listener(getAccessor)
					}
					if (currentAccessor === getAccessor()) {
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

			const onUpdate = (newValue: EntityAccessor.NestedAccessor | null) => onUpdateProxy(key, newValue)

			const entityState = this.initializeEntityAccessor(
				this.resolveOrCreateEntityState(
					id,
					this.getExistingEntityState(id),
					entityListState.fieldMarkers,
					onUpdate,
					datum,
					childErrors,
				),
				entityListState.fieldMarkers,
			)

			entityListState.childIds.add(key)

			return entityState.accessor as EntityAccessor
		}
		const getChildEntityByKey = (key: string) => {
			if (!entityListState.childIds.has(key)) {
				throw new BindingError(`Corrupted data`)
			}
			const entity = this.getEntityByKey(key)
			if (entity === null) {
				throw new BindingError(`Corrupted data`)
			}
			return entity
		}

		for (const sourceDatum of entityListState.initialData) {
			generateNewAccessor(sourceDatum)
		}

		entityListState.removeEntity = removeEntity
		entityListState.accessor = new EntityListAccessor(
			getChildEntityByKey,
			entityListState.childIds,
			entityListState.errors ? entityListState.errors.errors : emptyArray,
			entityListState.addEventListener,
			batchUpdates,
			entityListState.removeEntity,
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

	private initializeFieldAccessor(fieldState: InternalFieldState): InternalFieldState {
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
			replacement.getSubTree,
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
					update: undefined,
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
				accessor: null,
				addEventListener: undefined as any,
				batchUpdateDepth: 0,
				dirtyChildFields: undefined,
				dirtySubTrees: undefined,
				errors,
				eventListeners: {
					update: undefined,
					beforeUpdate: undefined,
				},
				fields: new Map(),
				hasPendingUpdate: true,
				id,
				persistedData,
				realms: new Map([
					[
						fieldMarkers,
						{
							depth: 0, // TODO
							onUpdate,
						},
					],
				]),
				subTrees: undefined,
			}
			entityState.addEventListener = this.getAddEventListener(entityState)
			this.entityStore.set(entityKey, entityState)
			return entityState
		}

		// TODO use entity fields?
		existingState.batchUpdateDepth = 0
		existingState.hasPendingUpdate = true
		existingState.errors = errors
		existingState.persistedData = persistedData
		existingState.realms.set(fieldMarkers, {
			depth: 0, // TODO
			onUpdate,
		})

		if (existingState.dirtyChildFields === undefined) {
			existingState.dirtyChildFields = new Set(existingState.fields.keys())
		} else {
			for (const [fieldName] of existingState.fields) {
				existingState.dirtyChildFields.add(fieldName)
			}
		}
		if (existingState.subTrees) {
			if (existingState.dirtySubTrees === undefined) {
				existingState.dirtySubTrees = new Set(existingState.subTrees.keys())
			} else {
				for (const [subTreePlaceholder] of existingState.subTrees) {
					existingState.dirtySubTrees.add(subTreePlaceholder)
				}
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
				batchUpdateDepth: 0,
				childIds: new Set(),
				dirtyChildIds: undefined,
				eventListeners: {
					update: undefined,
					beforeUpdate: undefined,
				},
				hasPendingUpdate: true,
				accessor: (undefined as any) as EntityListAccessor,
				removeEntity: (undefined as any) as EntityListAccessor.RemoveEntity,
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
			//console.log(state)
			if (!state.hasPendingUpdate) {
				continue
			}
			if (state.eventListeners.update !== undefined) {
				for (const handler of state.eventListeners.update) {
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
				if (entityState.dirtySubTrees !== undefined && entityState.subTrees !== undefined) {
					for (const dirtySubTreeIdentifier of entityState.dirtySubTrees) {
						const dirtySubTree = entityState.subTrees.get(dirtySubTreeIdentifier)
						if (dirtySubTree === undefined) {
							throw new BindingError()
						}
						agenda.push(dirtySubTree)
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
		getEntityByKey: (key: string) => EntityAccessor | EntityForRemovalAccessor | null,
	) => void

	export type InitialEntityData = ReceivedEntityData<undefined> | EntityAccessor | EntityForRemovalAccessor
}

export { AccessorTreeGenerator }
