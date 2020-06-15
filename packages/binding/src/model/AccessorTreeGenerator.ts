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
	GetSubTree,
	SubTreeAccessor,
	TreeRootAccessor,
} from '../accessors'
import { MutationDataResponse, ReceivedData, ReceivedDataTree, ReceivedEntityData } from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import {
	ConnectionMarker,
	EntityFieldMarkers,
	FieldMarker,
	MarkerSubTree,
	MarkerSubTreeParameters,
	MarkerTreeRoot,
	PlaceholderGenerator,
	ReferenceMarker,
} from '../markers'
import { ExpectedEntityCount, FieldName, FieldValue, RemovalType, Scalar } from '../treeParameters'
import { assertNever } from '../utils'
import { ErrorsPreprocessor } from './ErrorsPreprocessor'

// This only applies to the 'beforeUpdate' event:

// If the listeners mutate the entity/list, other listeners may want to respond to that, which in turn may trigger
// further responses, etc. We don't want the order of addition of event listeners to matter and we don't have
// the necessary information to perform some sort of a topological sort. We wouldn't want to do that anyway
// though.

// To get around all this, we just trigger all event listeners repeatedly until things settle and they stop
// mutating the accessor. If, however, that doesn't happen until some number of iterations (I think the limit
// is actually fairly generous), we conclude that there is an infinite feedback loop and just shut things down.

// Notice also that we effectively shift the responsibility to check whether an update concerns them to the
// listeners.
const BEFORE_UPDATE_SETTLE_LIMIT = 20

// TODO the state initialization methods are kind of crap but we'll deal with them later.
type InternalRootStateNode = InternalEntityState | InternalEntityListState
type InternalStateNode = InternalEntityState | InternalEntityListState | InternalFieldState

interface InternalContainerState {
	batchUpdateDepth: number
	hasPendingUpdate: boolean
}

enum InternalStateType {
	Field = 1,
	SingleEntity,
	EntityList,
}

interface InternalEntityFieldPlannedRemoval {
	field: FieldName
	removalType: RemovalType
	removedEntity: InternalEntityState
}

type OnEntityFieldUpdate = (state: InternalStateNode) => void
interface InternalEntityState extends InternalContainerState {
	type: InternalStateType.SingleEntity
	accessor: EntityAccessor
	addEventListener: EntityAccessor.AddEntityEventListener
	childrenWithPendingUpdates: Set<InternalStateNode> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	eventListeners: {
		[Type in EntityAccessor.EntityEventType]: Set<EntityAccessor.EntityEventListenerMap[Type]> | undefined
	}
	fields: Map<FieldName, InternalStateNode>
	id: string | EntityAccessor.UnpersistedEntityId
	persistedData: AccessorTreeGenerator.InitialEntityData
	isScheduledForDeletion: boolean
	plannedRemovals: Set<InternalEntityFieldPlannedRemoval> | undefined

	// Entity realms address the fact that a single particular entity may appear several times throughout the tree in
	// completely different contexts. Even with different fields.
	// TODO it is rather unfortunate that we're effectively mandating EntityFieldMarkers to be unique across the tree.
	//  It is really just an implementation detail which ideally shouldn't have any bearing on the developer.
	//  It could probably just be a Set<OnEntityFieldUpdate>
	realms: Map<EntityFieldMarkers, OnEntityFieldUpdate>
	batchUpdates: EntityAccessor.BatchUpdates
	connectEntityAtField: EntityAccessor.ConnectEntityAtField
	disconnectEntityAtField: EntityAccessor.DisconnectEntityAtField
	deleteEntity: EntityAccessor.DeleteEntity
}

interface InternalEntityPlannedRemoval {
	removalType: RemovalType
	removedEntity: InternalEntityState
}

type OnEntityListUpdate = (state: InternalEntityListState) => void
interface InternalEntityListState extends InternalContainerState {
	type: InternalStateType.EntityList
	accessor: EntityListAccessor
	addEventListener: EntityListAccessor.AddEntityListEventListener
	childrenKeys: Set<string>
	childrenWithPendingUpdates: Set<InternalEntityState> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	eventListeners: {
		[Type in EntityListAccessor.EntityListEventType]:
			| Set<EntityListAccessor.EntityListEventListenerMap[Type]>
			| undefined
	}
	fieldMarkers: EntityFieldMarkers
	initialData: ReceivedEntityData<undefined | null>[] | Array<EntityAccessor | EntityForRemovalAccessor>
	plannedRemovals: Set<InternalEntityPlannedRemoval> | undefined

	onUpdate: OnEntityListUpdate
	getEntityByKey: EntityListAccessor.GetEntityByKey
	preferences: ReferenceMarker.ReferencePreferences
	batchUpdates: EntityListAccessor.BatchUpdates
	connectEntity: EntityListAccessor.ConnectEntity
	createNewEntity: EntityListAccessor.CreateNewEntity
	disconnectEntity: EntityListAccessor.DisconnectEntity
}

type OnFieldUpdate = (state: InternalFieldState) => void
interface InternalFieldState {
	type: InternalStateType.Field
	accessor: FieldAccessor
	addEventListener: FieldAccessor.AddFieldEventListener
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
	isTouchedBy: FieldAccessor.IsTouchedBy
	updateValue: FieldAccessor.UpdateValue
}

class AccessorTreeGenerator {
	private persistedData: ReceivedDataTree<undefined> | undefined
	private initialData: TreeRootAccessor | ReceivedDataTree<undefined> | undefined
	private updateData: AccessorTreeGenerator.UpdateData | undefined

	private errorTreeRoot?: ErrorsPreprocessor.ErrorTreeRoot

	// TODO deletes and disconnects cause memory leaks here as they don't traverse the tree to remove nested states.
	//  This could theoretically also be intentional given that both operations happen relatively infrequently,
	//  or at least rarely enough that we could potentially just ignore the problem (which we're doing now).
	//  Nevertheless, no real analysis has been done and it could turn out to be a problem.
	private entityStore: Map<string, InternalEntityState> = new Map()
	private subTreeStates: Map<string, InternalRootStateNode> = new Map()

	private readonly getEntityByKey = (key: string) => {
		const entity = this.entityStore.get(key)

		if (entity === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent entity: key '${key}' was not found.`)
		}
		return entity.accessor
	}
	private readonly getSubTree = ((parameters: MarkerSubTreeParameters) => {
		const placeholderName = PlaceholderGenerator.getMarkerSubTreePlaceholder(parameters)
		const subTreeState = this.subTreeStates.get(placeholderName)

		if (subTreeState === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent accessor sub tree.`)
		}
		return subTreeState.accessor
	}) as GetSubTree

	private isFrozenWhileUpdating = false
	private treeWideBatchUpdateDepth = 0

	public constructor(private tree: MarkerTreeRoot) {}

	public generateLiveTree(
		persistedData: ReceivedDataTree<undefined> | undefined,
		initialData: TreeRootAccessor | ReceivedDataTree<undefined> | undefined,
		updateData: AccessorTreeGenerator.UpdateData,
		errors?: MutationDataResponse,
	): void {
		const preprocessor = new ErrorsPreprocessor(errors)

		this.errorTreeRoot = preprocessor.preprocess()
		console.debug(this.errorTreeRoot, errors)

		this.persistedData = persistedData
		this.initialData = initialData
		this.updateData = updateData

		for (const [placeholderName, marker] of this.tree.subTrees) {
			const subTreeState = this.initializeSubTree(
				marker,
				initialData instanceof TreeRootAccessor
					? initialData.getSubTree(marker.parameters)
					: initialData === undefined
					? undefined
					: initialData[placeholderName],
				this.errorTreeRoot,
			)
			this.subTreeStates.set(placeholderName, subTreeState)
		}

		this.updateMainTree()
	}

	private performRootTreeOperation(operation: () => void) {
		this.treeWideBatchUpdateDepth++
		operation()
		this.treeWideBatchUpdateDepth--
		this.updateMainTree()
	}

	private updateMainTree() {
		if (this.treeWideBatchUpdateDepth > 0) {
			return
		}

		if (this.isFrozenWhileUpdating) {
			throw new BindingError(
				`Trying to perform an update while the whole accessor tree is already updating. This is most likely caused ` +
					`by updating the accessor tree during rendering or in the 'update' event handler, which is a no-op. ` +
					`If you wish to mutate the tree in reaction to changes, use the 'beforeUpdate' event handler.`,
			)
		}

		const rootsWithPendingUpdates = Array.from(this.subTreeStates.values()).filter(state => state.hasPendingUpdate)

		if (!rootsWithPendingUpdates.length) {
			return
		}

		ReactDOM.unstable_batchedUpdates(() => {
			this.isFrozenWhileUpdating = true
			this.updateData?.(new TreeRootAccessor(this.getEntityByKey, this.getSubTree))
			this.flushPendingAccessorUpdates(rootsWithPendingUpdates)
			this.isFrozenWhileUpdating = false
		})
	}

	private initializeSubTree(
		tree: MarkerSubTree,
		data: ReceivedData<undefined> | SubTreeAccessor,
		errors?: ErrorsPreprocessor.ErrorTreeRoot,
	): InternalRootStateNode {
		const errorNode = errors === undefined ? undefined : errors[tree.placeholderName]

		const onUpdate = (updatedState: InternalStateNode) => {
			updatedState.hasPendingUpdate = true
		}

		let subTreeState: InternalEntityState | InternalEntityListState

		if (Array.isArray(data) || data === undefined || data instanceof EntityListAccessor) {
			const existingState = this.subTreeStates.get(tree.placeholderName) as InternalEntityListState | undefined
			subTreeState = this.initializeEntityListAccessor(
				this.resolveOrCreateEntityListState(existingState, tree.fields, onUpdate, data, errorNode, undefined),
			)
		} else {
			const existingState = this.subTreeStates.get(tree.placeholderName) as InternalEntityState
			const id = this.resolveOrCreateEntityId(data)
			subTreeState = this.initializeEntityAccessor(
				this.resolveOrCreateEntityState(id, existingState, tree.fields, onUpdate, data, errorNode),
				tree.fields,
			)
		}
		this.subTreeStates.set(tree.placeholderName, subTreeState)

		return subTreeState
	}

	private updateFields(
		entityState: InternalEntityState,
		markers: EntityFieldMarkers,
		onEntityFieldUpdate: OnEntityFieldUpdate,
	): EntityAccessor {
		const typename = entityState.persistedData
			? entityState.persistedData instanceof Accessor
				? entityState.persistedData.typename
				: entityState.persistedData[TYPENAME_KEY_NAME]
			: undefined

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
					type: InternalStateType.Field,
					accessor: new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
						placeholderName,
						idValue,
						idValue,
						undefined,
						emptyArray, // There cannot be errors associated with the id, right? If so, we should probably handle them at the Entity level.
						returnFalse, // IDs cannot be updated, and thus they cannot be touched either
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
					isTouchedBy: returnFalse,
					updateValue: undefined as any,
				})
				continue
			}

			if (field instanceof MarkerSubTree) {
				let initialData: ReceivedData<undefined> | SubTreeAccessor

				if (this.initialData instanceof TreeRootAccessor) {
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

				entityState.fields.set(field.placeholderName, this.initializeSubTree(field, initialData, this.errorTreeRoot))
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
									onEntityFieldUpdate,
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
								onEntityFieldUpdate,
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
							onEntityFieldUpdate,
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
			entityState.errors ? entityState.errors.errors : emptyArray,
			entityState.addEventListener,
			entityState.batchUpdates,
			entityState.connectEntityAtField,
			entityState.disconnectEntityAtField,
			entityState.deleteEntity,
		)
	}

	private initializeEntityAccessor(entityState: InternalEntityState, markers: EntityFieldMarkers): InternalEntityState {
		const batchUpdatesImplementation: EntityAccessor.BatchUpdates = performUpdates => {
			if (entityState.isScheduledForDeletion) {
				throw new BindingError(`Trying to update an entity (or something within said entity) that has been deleted.`)
			}
			entityState.batchUpdateDepth++
			const accessorBeforeUpdates = entityState.accessor
			performUpdates(() => entityState.accessor!)
			entityState.batchUpdateDepth--
			if (entityState.batchUpdateDepth === 0 && accessorBeforeUpdates !== entityState.accessor) {
				updateAccessorInstance()
				for (const [, onUpdate] of entityState.realms) {
					onUpdate(entityState)
				}
			}
		}

		const performMutatingOperation = (operation: () => void) => {
			batchUpdatesImplementation(getAccessor => {
				operation()

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

		const updateAccessorInstance = () => {
			entityState.hasPendingUpdate = true
			return (entityState.accessor = new EntityAccessor(
				entityState.id,
				entityState.accessor.typename,
				entityState.fields,
				entityState.errors ? entityState.errors.errors : emptyArray,
				entityState.addEventListener,
				entityState.batchUpdates,
				entityState.connectEntityAtField,
				entityState.disconnectEntityAtField,
				entityState.deleteEntity,
			))
		}

		entityState.batchUpdates = performUpdates => {
			this.performRootTreeOperation(() => {
				performMutatingOperation(() => {
					batchUpdatesImplementation(performUpdates)
				})
			})
		}

		entityState.connectEntityAtField = (field, connectedEntityOrItsKey) => {
			throw new BindingError(`EntityAccessor.connectEntityAtField: not implemented`) // TODO
		}

		entityState.disconnectEntityAtField = field => {
			throw new BindingError(`EntityAccessor.disconnectEntityAtField: not implemented`) // TODO
		}

		entityState.deleteEntity = () => {
			this.performRootTreeOperation(() => {
				// Deliberately not calling performMutatingOperation ‒ no beforeUpdate events after deletion
				batchUpdatesImplementation(() => {
					entityState.isScheduledForDeletion = true
					updateAccessorInstance()
				})
			})
		}

		const processEntityDeletion = (stateForDeletion: InternalEntityState) => {
			entityState.childrenWithPendingUpdates?.delete(stateForDeletion)

			if (entityState.plannedRemovals === undefined) {
				entityState.plannedRemovals = new Set()
			}

			for (const [fieldName, fieldState] of entityState.fields) {
				if (fieldState === stateForDeletion) {
					entityState.fields.delete(fieldName)
					entityState.plannedRemovals.add({
						field: fieldName,
						removalType: 'delete',
						removedEntity: stateForDeletion,
					})
				}
			}
		}

		const onFieldUpdate = (updatedState: InternalStateNode) => {
			performMutatingOperation(() => {
				if (updatedState.type === InternalStateType.SingleEntity && updatedState.isScheduledForDeletion) {
					processEntityDeletion(updatedState)
				} else {
					this.markChildStateInNeedOfUpdate(entityState, updatedState)
				}
				updateAccessorInstance()
			})
		}

		entityState.accessor = this.updateFields(entityState, markers, onFieldUpdate)
		return entityState
	}

	private initializeEntityListAccessor(entityListState: InternalEntityListState): InternalEntityListState {
		if (entityListState.errors && entityListState.errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.KeyIndexed) {
			throw new BindingError(
				`The error tree structure does not correspond to the marker tree. This should never happen.`,
			)
		}

		const batchUpdatesImplementation: EntityListAccessor.BatchUpdates = performUpdates => {
			entityListState.batchUpdateDepth++
			const accessorBeforeUpdates = entityListState.accessor
			performUpdates(() => entityListState.accessor!)
			entityListState.batchUpdateDepth--
			if (entityListState.batchUpdateDepth === 0 && accessorBeforeUpdates !== entityListState.accessor) {
				updateAccessorInstance()
				entityListState.onUpdate(entityListState)
			}
		}

		const performMutatingOperation = (operation: () => void) => {
			batchUpdatesImplementation(getAccessor => {
				operation()

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

		const updateAccessorInstance = () => {
			entityListState.hasPendingUpdate = true
			return (entityListState.accessor = new EntityListAccessor(
				entityListState.getEntityByKey,
				entityListState.childrenKeys,
				entityListState.errors ? entityListState.errors.errors : emptyArray,
				entityListState.addEventListener,
				entityListState.batchUpdates,
				entityListState.connectEntity,
				entityListState.createNewEntity,
				entityListState.disconnectEntity,
			))
		}

		const processEntityDeletion = (stateForDeletion: InternalEntityState) => {
			entityListState.childrenWithPendingUpdates?.delete(stateForDeletion)

			if (entityListState.plannedRemovals === undefined) {
				entityListState.plannedRemovals = new Set()
			}
			const key = this.idToKey(stateForDeletion.id)

			entityListState.childrenKeys.delete(key)
			entityListState.plannedRemovals.add({
				removalType: 'delete',
				removedEntity: stateForDeletion,
			})
		}

		const onChildEntityUpdate: OnEntityFieldUpdate = updatedState => {
			if (updatedState.type !== InternalStateType.SingleEntity) {
				throw new BindingError(`Illegal entity list value.`)
			}

			performMutatingOperation(() => {
				if (updatedState.isScheduledForDeletion) {
					processEntityDeletion(updatedState)
				} else {
					this.markChildStateInNeedOfUpdate(entityListState, updatedState)
				}
				updateAccessorInstance()
			})
		}

		entityListState.batchUpdates = performUpdates => {
			this.performRootTreeOperation(() => {
				performMutatingOperation(() => {
					batchUpdatesImplementation(performUpdates)
				})
			})
		}

		entityListState.disconnectEntity = childEntityOrItsKey => {
			this.performRootTreeOperation(() => {
				performMutatingOperation(() => {
					const disconnectedChildKey =
						typeof childEntityOrItsKey === 'string' ? childEntityOrItsKey : childEntityOrItsKey.key

					const disconnectedChildState = this.entityStore.get(disconnectedChildKey)
					if (disconnectedChildState === undefined) {
						throw new BindingError(
							`EntityListAccessor: Cannot remove entity with key '${disconnectedChildKey}' as it doesn't exist.`,
						)
					}

					if (!entityListState.childrenKeys.has(disconnectedChildKey)) {
						throw new BindingError(
							`Entity list doesn't include an entity with key '${disconnectedChildKey}' and so it cannot remove it.`,
						)
					}
					const didDelete = disconnectedChildState.realms.delete(entityListState.fieldMarkers)
					if (!didDelete) {
						this.rejectInvalidAccessorTree()
					}
					if (entityListState.plannedRemovals === undefined) {
						entityListState.plannedRemovals = new Set()
					}
					entityListState.plannedRemovals.add({
						removedEntity: disconnectedChildState,
						removalType: 'disconnect',
					})
					entityListState.childrenKeys.delete(disconnectedChildKey)
					updateAccessorInstance()
				})
			})
		}

		// TODO
		entityListState.connectEntity = entityToConnectOrItsKey => {
			let connectedEntityKey: string

			if (typeof entityToConnectOrItsKey === 'string') {
				connectedEntityKey = entityToConnectOrItsKey
			} else {
				if (!entityToConnectOrItsKey.existsOnServer) {
					throw new BindingError(
						`EntityListAccessor: attempting to connect an entity with key '${entityToConnectOrItsKey.key}' that ` +
							`doesn't exist on server. That is currently impossible.`, // At least for now.
					)
				}
				connectedEntityKey = entityToConnectOrItsKey.key
			}

			const connectedState = this.entityStore.get(connectedEntityKey)
			if (connectedState === undefined) {
				throw new BindingError(
					`EntityListAccessor: attempting to connect an entity with key '${connectedEntityKey}' ` +
						`but it doesn't exist.`,
				)
			}

			connectedState.realms.set(entityListState.fieldMarkers, onChildEntityUpdate)
			updateAccessorInstance()
		}

		entityListState.createNewEntity = initialize => {
			entityListState.batchUpdates(() => {
				const newState = generateNewEntityState(undefined)
				this.markChildStateInNeedOfUpdate(entityListState, newState)
				initialize && newState.batchUpdates(initialize)
			})
		}

		const generateNewEntityState = (datum: AccessorTreeGenerator.InitialEntityData): InternalEntityState => {
			const id = this.resolveOrCreateEntityId(datum)
			const key = this.idToKey(id)
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

			const entityState = this.initializeEntityAccessor(
				this.resolveOrCreateEntityState(
					id,
					this.getExistingEntityState(id),
					entityListState.fieldMarkers,
					onChildEntityUpdate,
					datum,
					childErrors,
				),
				entityListState.fieldMarkers,
			)

			entityListState.childrenKeys.add(key)

			return entityState
		}
		entityListState.getEntityByKey = (key: string) => {
			if (!entityListState.childrenKeys.has(key)) {
				throw new BindingError(`EntityList: cannot retrieve an entity with key '${key}' as is is not on the list.`)
			}
			const entity = this.getEntityByKey(key)
			if (entity === null) {
				throw new BindingError(`Corrupted data`)
			}
			return entity
		}

		for (const sourceDatum of entityListState.initialData) {
			generateNewEntityState(sourceDatum)
		}

		updateAccessorInstance()

		return entityListState
	}

	private initializeFieldAccessor(fieldState: InternalFieldState): InternalFieldState {
		fieldState.isTouchedBy = (agent: string) =>
			fieldState.touchLog === undefined ? false : fieldState.touchLog.get(agent) || false
		const createNewInstance = (value: FieldValue) =>
			new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
				fieldState.placeholderName,
				value,
				fieldState.persistedValue,
				fieldState.fieldMarker.defaultValue,
				fieldState.errors,
				fieldState.isTouchedBy,
				fieldState.addEventListener,
				fieldState.updateValue,
			)
		fieldState.updateValue = (
			newValue: Scalar | GraphQlBuilder.Literal,
			{ agent = FieldAccessor.userAgent }: FieldAccessor.UpdateOptions = {},
		) => {
			this.performRootTreeOperation(() => {
				if (fieldState.touchLog === undefined) {
					fieldState.touchLog = new Map()
				}
				fieldState.touchLog.set(agent, true)
				if (newValue === fieldState.accessor.currentValue) {
					return
				}
				fieldState.hasPendingUpdate = true
				fieldState.accessor = createNewInstance(newValue)
				fieldState.onUpdate(fieldState)
			})
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
				type: InternalStateType.Field,
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
				updateValue: (undefined as any) as FieldAccessor.UpdateValue,
				isTouchedBy: (undefined as any) as FieldAccessor.IsTouchedBy,
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
		onUpdate: OnEntityFieldUpdate,
		persistedData: AccessorTreeGenerator.InitialEntityData,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
	): InternalEntityState {
		const entityKey = this.idToKey(id)

		if (existingState === undefined) {
			const entityState: InternalEntityState = {
				type: InternalStateType.SingleEntity,
				accessor: undefined as any,
				addEventListener: undefined as any,
				batchUpdateDepth: 0,
				childrenWithPendingUpdates: undefined,
				errors,
				eventListeners: {
					update: undefined,
					beforeUpdate: undefined,
				},
				fields: new Map(),
				hasPendingUpdate: true,
				isScheduledForDeletion: false,
				plannedRemovals: undefined,
				id,
				persistedData,
				realms: new Map([[fieldMarkers, onUpdate]]),
				batchUpdates: (undefined as any) as EntityAccessor.BatchUpdates,
				connectEntityAtField: (undefined as any) as EntityAccessor.ConnectEntityAtField,
				disconnectEntityAtField: (undefined as any) as EntityAccessor.DisconnectEntityAtField,
				deleteEntity: (undefined as any) as EntityAccessor.DeleteEntity,
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
		existingState.realms.set(fieldMarkers, onUpdate)

		if (existingState.childrenWithPendingUpdates === undefined) {
			existingState.childrenWithPendingUpdates = new Set(existingState.fields.values())
		} else {
			for (const [, childState] of existingState.fields) {
				existingState.childrenWithPendingUpdates.add(childState)
			}
		}
		return existingState
	}

	private getExistingEntityState(id: string | EntityAccessor.UnpersistedEntityId): InternalEntityState | undefined {
		return this.entityStore.get(this.idToKey(id))
	}

	private resolveOrCreateEntityListState(
		existingState: InternalEntityListState | undefined,
		fieldMarkers: EntityFieldMarkers,
		onUpdate: OnEntityListUpdate,
		initialData: ReceivedEntityData<undefined | null>[] | EntityListAccessor | undefined,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		preferences: ReferenceMarker.ReferencePreferences | undefined,
	): InternalEntityListState {
		preferences = preferences || ReferenceMarker.defaultReferencePreferences[ExpectedEntityCount.PossiblyMany]

		let sourceData = initialData instanceof EntityListAccessor ? Array.from(initialData) : initialData || []
		if (
			sourceData.length === 0 ||
			sourceData.every(
				(datum: ReceivedEntityData<undefined | null> | EntityAccessor | EntityForRemovalAccessor | undefined) =>
					datum === undefined,
			)
		) {
			sourceData = Array(preferences.initialEntityCount).map(() => undefined)
		}

		if (existingState === undefined) {
			const state: InternalEntityListState = {
				type: InternalStateType.EntityList,
				errors,
				fieldMarkers,
				onUpdate,
				preferences,
				addEventListener: undefined as any,
				initialData: sourceData,
				batchUpdateDepth: 0,
				childrenKeys: new Set(),
				childrenWithPendingUpdates: undefined,
				eventListeners: {
					update: undefined,
					beforeUpdate: undefined,
				},
				plannedRemovals: undefined,
				hasPendingUpdate: true,
				accessor: (undefined as any) as EntityListAccessor,
				batchUpdates: (undefined as any) as EntityListAccessor.BatchUpdates,
				connectEntity: (undefined as any) as EntityListAccessor.ConnectEntity,
				createNewEntity: (undefined as any) as EntityListAccessor.CreateNewEntity,
				disconnectEntity: (undefined as any) as EntityListAccessor.DisconnectEntity,
				getEntityByKey: (undefined as any) as EntityListAccessor.GetEntityByKey,
			}
			state.addEventListener = this.getAddEventListener(state)
			return state
		}

		existingState.batchUpdateDepth = 0
		existingState.hasPendingUpdate = true
		existingState.errors = errors
		existingState.onUpdate = onUpdate
		existingState.initialData = sourceData

		if (existingState.childrenWithPendingUpdates === undefined) {
			existingState.childrenWithPendingUpdates = new Set(
				Array.from(existingState.childrenKeys, id => this.entityStore.get(id)!),
			)
		} else {
			for (const childId of existingState.childrenKeys) {
				const childState = this.entityStore.get(childId)
				if (childState === undefined) {
					continue
				}
				existingState.childrenWithPendingUpdates.add(childState)
			}
		}
		// TODO This is kind of crap. We should resolve child ids from here.
		// 	It's also a memory leak in the entity store.
		existingState.childrenKeys.clear()
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

	private idToKey(id: string | EntityAccessor.UnpersistedEntityId) {
		if (typeof id === 'string') {
			return id
		}
		return id.value
	}

	private markChildStateInNeedOfUpdate(
		entityListState: InternalEntityListState,
		updatedState: InternalEntityState,
	): void
	private markChildStateInNeedOfUpdate(entityState: InternalEntityState, updatedState: InternalStateNode): void
	private markChildStateInNeedOfUpdate(
		state: InternalEntityListState | InternalEntityState,
		updatedState: InternalStateNode,
	): void {
		if (state.childrenWithPendingUpdates === undefined) {
			state.childrenWithPendingUpdates = new Set()
		}
		state.childrenWithPendingUpdates.add(updatedState as InternalEntityState)
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

	private flushPendingAccessorUpdates(rootStates: Array<InternalEntityState | InternalEntityListState>) {
		// It is *CRUCIAL* that this is a BFS so that we update the components in top-down order.
		const agenda: InternalStateNode[] = rootStates

		for (const state of agenda) {
			//console.log(state)
			if (!state.hasPendingUpdate) {
				continue
			}
			state.hasPendingUpdate = false

			if (state.eventListeners.update !== undefined) {
				for (const handler of state.eventListeners.update) {
					// TS can't quite handle the polymorphism here but this is fine.
					state.accessor && handler(state.accessor as any)
				}
			}
			switch (state.type) {
				case InternalStateType.SingleEntity:
				case InternalStateType.EntityList: {
					if (state.childrenWithPendingUpdates !== undefined) {
						for (const childState of state.childrenWithPendingUpdates) {
							agenda.push(childState)
						}
						state.childrenWithPendingUpdates = undefined
					}
					break
				}
				case InternalStateType.Field:
					// Do nothing
					break
				default:
					assertNever(state)
			}
		}
	}
}

namespace AccessorTreeGenerator {
	export type UpdateData = (newData: TreeRootAccessor) => void

	export type InitialEntityData = ReceivedEntityData<undefined | null> | EntityAccessor | EntityForRemovalAccessor
}

export { AccessorTreeGenerator }
