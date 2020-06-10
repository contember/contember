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

type AddEntityEventListener = EntityAccessor['addEventListener']
type AddEntityListEventListener = EntityListAccessor['addEventListener']
type AddFieldEventListener = FieldAccessor['addEventListener']
type OnReplace = EntityAccessor['replaceBy']
type OnUnlink = EntityAccessor['remove']
type BatchEntityUpdates = EntityAccessor['batchUpdates']
type BatchEntityListUpdates = EntityListAccessor['batchUpdates']

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

// Entity realms address the fact that a single particular entity may appear several times throughout the tree in
// completely different contexts. Even with different fields.
interface EntityRealm {
	depth: number
	onUpdate: OnEntityFieldUpdate
}

interface InternalContainerState {
	batchUpdateDepth: number
	hasPendingUpdate: boolean
}

enum InternalStateType {
	Field = 1,
	SingleEntity,
	EntityList,
}

type OnEntityFieldUpdate = (state: InternalStateNode) => void
interface InternalEntityState extends InternalContainerState {
	type: InternalStateType.SingleEntity
	accessor: EntityAccessor | EntityForRemovalAccessor | null
	addEventListener: AddEntityEventListener
	dirtyChildren: Set<InternalStateNode> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	eventListeners: {
		[Type in EntityAccessor.EntityEventType]: Set<EntityAccessor.EntityEventListenerMap[Type]> | undefined
	}
	fields: Map<FieldName, InternalStateNode>
	id: string | EntityAccessor.UnpersistedEntityId
	persistedData: AccessorTreeGenerator.InitialEntityData
	realms: Map<EntityFieldMarkers, EntityRealm>
}

type OnEntityListUpdate = (state: InternalEntityListState) => void
interface InternalEntityListState extends InternalContainerState {
	type: InternalStateType.EntityList
	accessor: EntityListAccessor
	addEventListener: AddEntityListEventListener
	childrenKeys: Set<string>
	dirtyChildren: Set<InternalEntityState> | undefined
	errors: ErrorsPreprocessor.ErrorNode | undefined
	eventListeners: {
		[Type in EntityListAccessor.EntityListEventType]:
			| Set<EntityListAccessor.EntityListEventListenerMap[Type]>
			| undefined
	}
	fieldMarkers: EntityFieldMarkers
	initialData: ReceivedEntityData<undefined | null>[] | Array<EntityAccessor | EntityForRemovalAccessor>
	removeEntity: EntityListAccessor.RemoveEntity
	addEntity: EntityListAccessor.AddEntity
	batchUpdates: EntityListAccessor.BatchUpdates
	onUpdate: OnEntityListUpdate
	getEntityByKey: EntityListAccessor.GetEntityByKey
	preferences: ReferenceMarker.ReferencePreferences
}

type OnFieldUpdate = (state: InternalFieldState) => void
interface InternalFieldState {
	type: InternalStateType.Field
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
	private initialData: TreeRootAccessor | ReceivedDataTree<undefined> | undefined
	private updateData: AccessorTreeGenerator.UpdateData | undefined

	private errorTreeRoot?: ErrorsPreprocessor.ErrorTreeRoot
	private entityStore: Map<string, InternalEntityState> = new Map()
	private readonly getEntityByKey = (key: string) => {
		const entity = this.entityStore.get(key)

		if (entity === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent entity.`)
		}
		return entity.accessor
	}
	private subTreeStates: Map<string, InternalRootStateNode> = new Map()
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
				newState => {
					newState.hasPendingUpdate = true
				},
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
					`by updating the accessor tree during rendering or in the 'afterUpdate' event handler. That is a no-op. ` +
					`If you wish to react to changes, use the 'beforeUpdate' event handler.`,
			)
		}

		ReactDOM.unstable_batchedUpdates(() => {
			this.isFrozenWhileUpdating = true
			this.updateData?.(new TreeRootAccessor(this.getEntityByKey, this.getSubTree))
			this.flushPendingAccessorUpdates(
				Array.from(this.tree.subTrees.keys())
					.map(placeholderName => this.subTreeStates.get(placeholderName)!)
					.filter(state => state.hasPendingUpdate),
			)
			this.isFrozenWhileUpdating = false
		})
	}

	private initializeSubTree(
		tree: MarkerSubTree,
		data: ReceivedData<undefined> | SubTreeAccessor,
		updateData: (state: InternalRootStateNode) => void,
		errors?: ErrorsPreprocessor.ErrorTreeRoot,
	): InternalRootStateNode {
		const errorNode = errors === undefined ? undefined : errors[tree.placeholderName]

		const onUpdate = (updatedState: InternalStateNode) => {
			if (subTreeState.dirtyChildren === undefined) {
				subTreeState.dirtyChildren = new Set()
			}
			subTreeState.dirtyChildren.add(updatedState as any)

			if (!subTreeState.hasPendingUpdate) {
				subTreeState.hasPendingUpdate = true
				return updateData(subTreeState)
			}
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
		onReplace: OnReplace,
		batchUpdates: BatchEntityUpdates,
		onUnlink?: OnUnlink,
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

				entityState.fields.set(
					field.placeholderName,
					this.initializeSubTree(field, initialData, onEntityFieldUpdate, undefined),
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
			this.getSubTree,
			entityState.errors ? entityState.errors.errors : emptyArray,
			entityState.addEventListener,
			batchUpdates,
			onReplace,
			onUnlink,
		)
	}

	private initializeEntityAccessor(entityState: InternalEntityState, markers: EntityFieldMarkers): InternalEntityState {
		const performUpdate = () => {
			if (entityState.hasPendingUpdate) {
				return
			}
			entityState.hasPendingUpdate = true
			this.treeWideBatchUpdateDepth++
			const realmCount = entityState.realms.size
			let i = 1
			for (const [, { onUpdate }] of entityState.realms) {
				if (i++ === realmCount) {
					this.treeWideBatchUpdateDepth--
				}
				onUpdate(entityState)
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
		const onFieldUpdate = (updatedState: InternalStateNode) => {
			const entityAccessor = entityState.accessor
			if (!(entityAccessor instanceof EntityAccessor)) {
				return this.rejectInvalidAccessorTree()
			}
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

			if (entityState.dirtyChildren === undefined) {
				entityState.dirtyChildren = new Set()
			}
			entityState.dirtyChildren.add(updatedState)
			return onUpdateProxy(newAccessor)
		}
		const onReplace: OnReplace = replacement => onUpdateProxy(this.replaceEntity(entityState, replacement, onRemove))
		const onRemove = (removalType: RemovalType) => {
			// TODO update this to mean remove a hasOne child field, not the whole entity.
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
		entityState.accessor = this.updateFields(entityState, markers, onFieldUpdate, onReplace, batchUpdates, onRemove)
		return entityState
	}

	private initializeEntityListAccessor(entityListState: InternalEntityListState): InternalEntityListState {
		if (entityListState.errors && entityListState.errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.KeyIndexed) {
			throw new BindingError(
				`The error tree structure does not correspond to the marker tree. This should never happen.`,
			)
		}

		const batchUpdatesImplementation: BatchEntityListUpdates = performUpdates => {
			entityListState.batchUpdateDepth++
			const accessorBeforeUpdates = entityListState.accessor
			performUpdates(() => entityListState.accessor!)
			entityListState.batchUpdateDepth--
			if (entityListState.batchUpdateDepth === 0 && accessorBeforeUpdates !== entityListState.accessor) {
				entityListState.onUpdate(entityListState)
			}
		}

		const performMutatingOperation = (operation: () => void) => {
			batchUpdatesImplementation(getAccessor => {
				operation()

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

		const updateAccessorInstance = () => {
			entityListState.hasPendingUpdate = true
			return (entityListState.accessor = new EntityListAccessor(
				entityListState.getEntityByKey,
				entityListState.childrenKeys,
				entityListState.errors ? entityListState.errors.errors : emptyArray,
				entityListState.addEventListener,
				entityListState.batchUpdates,
				entityListState.removeEntity,
				entityListState.addEntity,
			))
		}
		const markDirtyChildState = (updatedState: InternalEntityState) => {
			if (entityListState.dirtyChildren === undefined) {
				entityListState.dirtyChildren = new Set()
			}
			entityListState.dirtyChildren.add(updatedState)
		}
		const onUpdateProxy: OnEntityFieldUpdate = updatedState => {
			if (updatedState.type !== InternalStateType.SingleEntity) {
				throw new BindingError(`Illegal entity list value.`)
			}

			performMutatingOperation(() => markDirtyChildState(updatedState))
		}

		entityListState.batchUpdates = performUpdates => {
			this.performRootTreeOperation(() => {
				performMutatingOperation(() => {
					batchUpdatesImplementation(performUpdates)
				})
			})
		}

		// TODO
		entityListState.removeEntity = (key, removalType) => {
			this.performRootTreeOperation(() => {
				performMutatingOperation(() => {
					const childState = this.entityStore.get(key)
					if (childState === undefined) {
						throw new BindingError(`Cannot remove entity with key '${key}' as it doesn't exist.`)
					}
					if (!entityListState.childrenKeys.has(key)) {
						throw new BindingError(
							`Entity list doesn't include an entity with key '${key}' and so it cannot remove it.`,
						)
					}
					const childRealm = childState.realms.get(entityListState.fieldMarkers)
					if (childRealm === undefined) {
						this.rejectInvalidAccessorTree()
					}
					/*
						if (entityListState.dirtyChildren === undefined) {
							entityListState.dirtyChildren = new Set()
						}
						entityListState.dirtyChildren.add(key)
					*/

					/*if (
						!childState.persistedData ||
						childState.persistedData instanceof EntityForRemovalAccessor ||
						!(childState.accessor instanceof EntityAccessor)
					) {
						childRealm.removalType = removalType
					}

					if (childState.batchUpdateDepth !== 0) {
						throw new BindingError(`Removing entities that are being batch updated is a no-op.`)
					}

					onUpdateProxy(
						key,
						new EntityForRemovalAccessor(childState.accessor, childState.accessor.replaceBy, removalType),
					)*/
				})
			})
		}

		entityListState.addEntity = newEntity => {
			entityListState.batchUpdates(getAccessor => {
				const newState = generateNewEntityState(typeof newEntity === 'function' ? undefined : newEntity)
				markDirtyChildState(newState)

				if (typeof newEntity === 'function') {
					newEntity(getAccessor, typeof newState.id === 'string' ? newState.id : newState.id.value)
				}
			})
		}

		const generateNewEntityState = (datum: AccessorTreeGenerator.InitialEntityData): InternalEntityState => {
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

			const entityState = this.initializeEntityAccessor(
				this.resolveOrCreateEntityState(
					id,
					this.getExistingEntityState(id),
					entityListState.fieldMarkers,
					onUpdateProxy,
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
			fieldState.accessor = createNewInstance(newValue)
			fieldState.onUpdate(fieldState)
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
		const entityKey = typeof id === 'string' ? id : id.value

		if (existingState === undefined) {
			const entityState: InternalEntityState = {
				type: InternalStateType.SingleEntity,
				accessor: null,
				addEventListener: undefined as any,
				batchUpdateDepth: 0,
				dirtyChildren: undefined,
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

		if (existingState.dirtyChildren === undefined) {
			existingState.dirtyChildren = new Set(existingState.fields.values())
		} else {
			for (const [, childState] of existingState.fields) {
				existingState.dirtyChildren.add(childState)
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
				dirtyChildren: undefined,
				eventListeners: {
					update: undefined,
					beforeUpdate: undefined,
				},
				hasPendingUpdate: true,
				accessor: (undefined as any) as EntityListAccessor,
				removeEntity: (undefined as any) as EntityListAccessor.RemoveEntity,
				addEntity: (undefined as any) as EntityListAccessor.AddEntity,
				batchUpdates: (undefined as any) as EntityListAccessor.BatchUpdates,
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

		if (existingState.dirtyChildren === undefined) {
			existingState.dirtyChildren = new Set(Array.from(existingState.childrenKeys, id => this.entityStore.get(id)!))
		} else {
			for (const childId of existingState.childrenKeys) {
				const childState = this.entityStore.get(childId)
				if (childState === undefined) {
					continue
				}
				existingState.dirtyChildren.add(childState)
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
			if (state.eventListeners.update !== undefined) {
				for (const handler of state.eventListeners.update) {
					// TS can't quite handle the polymorphism here but this is fine.
					state.accessor && handler(state.accessor as any)
				}
			}
			if (state.type === InternalStateType.Field) {
				// Do nothing
			} else if (state.type === InternalStateType.EntityList || state.type === InternalStateType.SingleEntity) {
				if (state.dirtyChildren !== undefined) {
					for (const dirtyChildState of state.dirtyChildren) {
						agenda.push(dirtyChildState)
					}
					state.dirtyChildren = undefined
				}
			} else {
				assertNever(state)
			}
			state.hasPendingUpdate = false
		}
	}
}

namespace AccessorTreeGenerator {
	export type UpdateData = (newData: TreeRootAccessor) => void

	export type InitialEntityData = ReceivedEntityData<undefined | null> | EntityAccessor | EntityForRemovalAccessor
}

export { AccessorTreeGenerator }
