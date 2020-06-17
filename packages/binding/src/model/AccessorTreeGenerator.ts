import { GraphQlBuilder } from '@contember/client'
import { emptyArray, noop, returnFalse } from '@contember/react-utils'
import * as ReactDOM from 'react-dom'
import {
	EntityAccessor,
	EntityListAccessor,
	ErrorAccessor,
	FieldAccessor,
	GetSubTree,
	TreeRootAccessor,
} from '../accessors'
import { BoxedSingleEntityId, NormalizedQueryResponseData, PersistedEntityDataStore } from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import {
	ConnectionMarker,
	EntityFieldMarkers,
	FieldMarker,
	MarkerTreeRoot,
	PlaceholderGenerator,
	ReferenceMarker,
	SubTreeMarker,
	SubTreeMarkerParameters,
} from '../markers'
import { ExpectedEntityCount, FieldName, FieldValue, Scalar } from '../treeParameters'
import { assertNever } from '../utils'
import { ErrorsPreprocessor } from './ErrorsPreprocessor'
import {
	InternalEntityListState,
	InternalEntityState,
	InternalFieldState,
	InternalRootStateNode,
	InternalStateNode,
	InternalStateType,
	OnEntityListUpdate,
	OnEntityUpdate,
	OnFieldUpdate,
} from './internalState'
import { MutationGenerator } from './MutationGenerator'

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

class AccessorTreeGenerator {
	private updateData: AccessorTreeGenerator.UpdateData | undefined
	private persistedEntityData: PersistedEntityDataStore = new Map()

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
	private readonly getSubTree = ((parameters: SubTreeMarkerParameters) => {
		const placeholderName = PlaceholderGenerator.getSubTreeMarkerPlaceholder(parameters)
		const subTreeState = this.subTreeStates.get(placeholderName)

		if (subTreeState === undefined) {
			throw new BindingError(`Trying to retrieve a non-existent accessor sub tree.`)
		}
		return subTreeState.accessor
	}) as GetSubTree

	private readonly getAllEntities = (entityStore => {
		return function*(): Generator<EntityAccessor> {
			for (const [, entity] of entityStore) {
				yield entity.accessor
			}
		}
	})(this.entityStore)

	private readonly getAllTypeNames = (): Set<string> => {
		const typeNames = new Set<string>()

		for (const [, { typeName }] of this.entityStore) {
			typeName && typeNames.add(typeName)
		}

		return typeNames
	}

	private isFrozenWhileUpdating = false
	private treeWideBatchUpdateDepth = 0

	public constructor(private markerTree: MarkerTreeRoot) {}

	public initializeLiveTree(
		persistedData: NormalizedQueryResponseData,
		updateData: AccessorTreeGenerator.UpdateData,
	): void {
		//const preprocessor = new ErrorsPreprocessor(errors)

		//const errorTreeRoot = preprocessor.preprocess()
		//console.debug(errorTreeRoot, errors)

		this.persistedEntityData = persistedData.persistedEntityDataStore
		this.updateData = updateData

		for (const [placeholderName, marker] of this.markerTree.subTrees) {
			const subTreeState = this.initializeSubTree(
				marker,
				persistedData.subTreeDataStore.get(placeholderName),
				undefined,
			)
			this.subTreeStates.set(placeholderName, subTreeState)
		}

		this.updateMainTree()
	}

	public generatePersistMutation() {
		const generator = new MutationGenerator(this.markerTree, this.subTreeStates, this.entityStore)

		return generator.getPersistMutation()
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
			this.updateData?.(
				new TreeRootAccessor(this.getEntityByKey, this.getSubTree, this.getAllEntities, this.getAllTypeNames),
			)
			this.flushPendingAccessorUpdates(rootsWithPendingUpdates)
			this.isFrozenWhileUpdating = false
		})
	}

	private initializeSubTree(
		tree: SubTreeMarker,
		persistedRootData: BoxedSingleEntityId | Set<string> | undefined,
		errors: ErrorsPreprocessor.ErrorTreeRoot | undefined,
	): InternalRootStateNode {
		const errorNode = errors === undefined ? undefined : errors[tree.placeholderName]

		let subTreeState: InternalEntityState | InternalEntityListState

		if (tree.parameters.type === 'qualifiedEntityList' || tree.parameters.type === 'unconstrainedQualifiedEntityList') {
			const persistedEntityIds: Set<string> = persistedRootData instanceof Set ? persistedRootData : new Set()
			subTreeState = this.initializeEntityListAccessor(tree.fields, noop, persistedEntityIds, errorNode, undefined)
		} else {
			const id =
				persistedRootData instanceof BoxedSingleEntityId
					? persistedRootData.id
					: new EntityAccessor.UnpersistedEntityId()
			subTreeState = this.initializeEntityAccessor(id, tree.fields, noop, errorNode)
		}
		this.subTreeStates.set(tree.placeholderName, subTreeState)

		return subTreeState
	}

	private initializeEntityFields(entityState: InternalEntityState, markers: EntityFieldMarkers): void {
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
					onFieldUpdate: noop,
					errors: emptyArray,
					touchLog: undefined,
					hasPendingUpdate: false,
					persistedValue: idValue,
					isTouchedBy: returnFalse,
					updateValue: undefined as any,
				})
				continue
			}

			if (field instanceof SubTreeMarker) {
				// Do nothing: all sub trees have been hoisted and shouldn't appear here.
			} else if (field instanceof ReferenceMarker) {
				for (const referencePlaceholder in field.references) {
					const reference = field.references[referencePlaceholder]
					const fieldDatum = entityState.persistedData?.get(referencePlaceholder)

					const referenceError =
						entityState.errors && entityState.errors.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed
							? entityState.errors.children[field.fieldName] ||
							  entityState.errors.children[referencePlaceholder] ||
							  undefined
							: undefined

					if (reference.expectedCount === ExpectedEntityCount.UpToOne) {
						if (fieldDatum instanceof Set) {
							throw new BindingError(
								`Received a collection of entities for field '${field.fieldName}' where a single entity was expected. ` +
									`Perhaps you wanted to use a <Repeater />?`,
							)
						} else if (fieldDatum instanceof BoxedSingleEntityId || fieldDatum === null || fieldDatum === undefined) {
							const entityId =
								fieldDatum instanceof BoxedSingleEntityId ? fieldDatum.id : new EntityAccessor.UnpersistedEntityId()
							const referenceEntityState = this.initializeEntityAccessor(
								entityId,
								reference.fields,
								entityState.onChildFieldUpdate,
								referenceError,
							)
							entityState.fields.set(referencePlaceholder, referenceEntityState)
						} else {
							throw new BindingError(
								`Received a scalar value for field '${field.fieldName}' where a single entity was expected.` +
									`Perhaps you meant to use a variant of <Field />?`,
							)
						}
					} else if (reference.expectedCount === ExpectedEntityCount.PossiblyMany) {
						if (fieldDatum === undefined || fieldDatum instanceof Set) {
							entityState.fields.set(
								referencePlaceholder,
								this.initializeEntityListAccessor(
									reference.fields,
									entityState.onChildFieldUpdate,
									fieldDatum || new Set(),
									referenceError,
									reference.preferences,
								),
							)
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
				const fieldDatum = entityState.persistedData?.get(placeholderName)

				if (fieldDatum instanceof Set) {
					throw new BindingError(
						`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use a <Repeater />?`,
					)
				} else if (fieldDatum instanceof BoxedSingleEntityId) {
					throw new BindingError(
						`Received a referenced entity where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use <HasOne />?`,
					)
				} else {
					if (entityState.fields.get(placeholderName)) {
						continue
					}
					const fieldErrors: ErrorAccessor[] =
						entityState.errors &&
						entityState.errors.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed &&
						field.fieldName in entityState.errors.children
							? entityState.errors.children[field.fieldName].errors
							: emptyArray
					const fieldState = this.initializeFieldAccessor(
						placeholderName,
						field,
						entityState.onChildFieldUpdate,
						fieldDatum,
						fieldErrors,
					)
					entityState.fields.set(placeholderName, fieldState)
				}
			} else if (field instanceof ConnectionMarker) {
				// Do nothing ‒ connections need no runtime representation
			} else {
				assertNever(field)
			}
		}
	}

	private initializeEntityAccessor(
		id: string | EntityAccessor.UnpersistedEntityId,
		fieldMarkers: EntityFieldMarkers,
		onEntityUpdate: OnEntityUpdate,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
	): InternalEntityState {
		const entityKey = this.idToKey(id)
		const existingEntityState = this.entityStore.get(entityKey)

		const updateAccessorInstance = (state: InternalEntityState) => {
			state.hasPendingUpdate = true
			return (state.accessor = new EntityAccessor(
				state.id,
				state.typeName,

				// We're technically exposing more info in runtime than we'd like but that way we don't have to allocate and
				// keep in sync two copies of the same data. TS hides the extra info anyway.
				state.fields,
				state.errors ? state.errors.errors : emptyArray,
				state.addEventListener,
				state.batchUpdates,
				state.connectEntityAtField,
				state.disconnectEntityAtField,
				state.deleteEntity,
			))
		}

		if (existingEntityState !== undefined) {
			existingEntityState.realms.add(onEntityUpdate)
			this.initializeEntityFields(existingEntityState, fieldMarkers)
			updateAccessorInstance(existingEntityState)
			return existingEntityState
		}

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
			typeName: undefined,
			id,
			persistedData: this.persistedEntityData.get(entityKey),
			realms: new Set([onEntityUpdate]),
			onChildFieldUpdate: (updatedState: InternalStateNode) => {
				performMutatingOperation(() => {
					if (updatedState.type === InternalStateType.SingleEntity && updatedState.isScheduledForDeletion) {
						processEntityDeletion(updatedState)
					} else {
						this.markChildStateInNeedOfUpdate(entityState, updatedState)
					}
					updateAccessorInstance(entityState)
				})
			},
			batchUpdates: performUpdates => {
				this.performRootTreeOperation(() => {
					performMutatingOperation(() => {
						batchUpdatesImplementation(performUpdates)
					})
				})
			},
			connectEntityAtField: (field, entityToConnectOrItsKey) => {
				this.performRootTreeOperation(() => {
					performMutatingOperation(() => {
						const [connectedEntityKey, connectedState] = this.resolveAndPrepareEntityToConnect(
							entityState,
							entityToConnectOrItsKey,
						)

						throw new BindingError('EntityAccessor.connectEntity: not implemented')
						//connectedState.realms.set(entityState.fieldMarkers, onChildEntityUpdate)
						//entityState.fields.add(connectedEntityKey)
						//updateAccessorInstance()
					})
				})
			},
			disconnectEntityAtField: field => {
				const stateToDisconnect = entityState.fields.get(field)

				if (stateToDisconnect === undefined) {
					throw new BindingError(`Cannot disconnect field '${field}' as it doesn't exist.`)
				}
				if (stateToDisconnect.type !== InternalStateType.SingleEntity) {
					throw new BindingError(`Trying to disconnect the field '${field}' but it isn't a has-one relation.`)
				}
				stateToDisconnect.realms.delete(entityState.onChildFieldUpdate)

				const referenceMarkers = (fieldMarkers.get(field)! as ReferenceMarker).references[field].fields
				const newEntityState = this.initializeEntityAccessor(
					new EntityAccessor.UnpersistedEntityId(),
					referenceMarkers,
					entityState.onChildFieldUpdate,
					undefined,
				)
				entityState.fields.set(field, newEntityState)

				throw new BindingError(`EntityAccessor.disconnectEntityAtField: not implemented`) // TODO
			},
			deleteEntity: () => {
				this.performRootTreeOperation(() => {
					// Deliberately not calling performMutatingOperation ‒ no beforeUpdate events after deletion
					batchUpdatesImplementation(() => {
						entityState.isScheduledForDeletion = true
						updateAccessorInstance(entityState)
					})
				})
			},
		}
		entityState.addEventListener = this.getAddEventListener(entityState)
		this.entityStore.set(entityKey, entityState)

		const typeName = entityState.persistedData?.get(TYPENAME_KEY_NAME)

		if (typeof typeName === 'string') {
			entityState.typeName = typeName
		}

		const batchUpdatesImplementation: EntityAccessor.BatchUpdates = performUpdates => {
			if (entityState.isScheduledForDeletion) {
				throw new BindingError(`Trying to update an entity (or something within said entity) that has been deleted.`)
			}
			entityState.batchUpdateDepth++
			const accessorBeforeUpdates = entityState.accessor
			performUpdates(() => entityState.accessor!)
			entityState.batchUpdateDepth--
			if (entityState.batchUpdateDepth === 0 && accessorBeforeUpdates !== entityState.accessor) {
				updateAccessorInstance(entityState)
				for (const onUpdate of entityState.realms) {
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

		this.initializeEntityFields(entityState, fieldMarkers)
		updateAccessorInstance(entityState)
		return entityState
	}

	private initializeEntityListAccessor(
		fieldMarkers: EntityFieldMarkers,
		onEntityListUpdate: OnEntityListUpdate,
		persistedEntityIds: Set<string>,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		preferences: ReferenceMarker.ReferencePreferences = ReferenceMarker.defaultReferencePreferences[
			ExpectedEntityCount.PossiblyMany
		],
	): InternalEntityListState {
		if (errors && errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.KeyIndexed) {
			throw new BindingError(
				`The error tree structure does not correspond to the marker tree. This should never happen.`,
			)
		}

		const entityListState: InternalEntityListState = {
			type: InternalStateType.EntityList,
			errors,
			fieldMarkers,
			onEntityListUpdate,
			persistedEntityIds,
			preferences,
			addEventListener: undefined as any,
			accessor: (undefined as any) as EntityListAccessor,
			batchUpdateDepth: 0,
			childrenKeys: new Set(),
			childrenWithPendingUpdates: undefined,
			eventListeners: {
				update: undefined,
				beforeUpdate: undefined,
			},
			plannedRemovals: undefined,
			hasPendingUpdate: true,
			onChildEntityUpdate: updatedState => {
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
			},
			batchUpdates: performUpdates => {
				this.performRootTreeOperation(() => {
					performMutatingOperation(() => {
						batchUpdatesImplementation(performUpdates)
					})
				})
			},
			connectEntity: entityToConnectOrItsKey => {
				this.performRootTreeOperation(() => {
					performMutatingOperation(() => {
						const [connectedEntityKey, connectedState] = this.resolveAndPrepareEntityToConnect(
							entityListState,
							entityToConnectOrItsKey,
						)

						connectedState.realms.add(entityListState.onChildEntityUpdate)
						entityListState.childrenKeys.add(connectedEntityKey)
						updateAccessorInstance()
					})
				})
			},
			createNewEntity: initialize => {
				entityListState.batchUpdates(() => {
					const newState = generateNewEntityState(undefined)
					this.markChildStateInNeedOfUpdate(entityListState, newState)
					updateAccessorInstance()
					initialize && newState.batchUpdates(initialize)
				})
			},
			disconnectEntity: childEntityOrItsKey => {
				// TODO disallow this if the EntityList is at the top level
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
						const didDelete = disconnectedChildState.realms.delete(entityListState.onChildEntityUpdate)
						if (!didDelete) {
							this.rejectInvalidAccessorTree()
						}
						if (entityListState.persistedEntityIds.has(disconnectedChildKey)) {
							if (entityListState.plannedRemovals === undefined) {
								entityListState.plannedRemovals = new Set()
							}
							entityListState.plannedRemovals.add({
								removedEntity: disconnectedChildState,
								removalType: 'disconnect',
							})
						}
						entityListState.childrenKeys.delete(disconnectedChildKey)
						updateAccessorInstance()
					})
				})
			},
			getChildEntityByKey: key => {
				if (!entityListState.childrenKeys.has(key)) {
					throw new BindingError(`EntityList: cannot retrieve an entity with key '${key}' as is is not on the list.`)
				}
				const entity = this.getEntityByKey(key)
				if (entity === null) {
					throw new BindingError(`Corrupted data`)
				}
				return entity
			},
		}
		entityListState.addEventListener = this.getAddEventListener(entityListState)

		const batchUpdatesImplementation: EntityListAccessor.BatchUpdates = performUpdates => {
			entityListState.batchUpdateDepth++
			const accessorBeforeUpdates = entityListState.accessor
			performUpdates(() => entityListState.accessor!)
			entityListState.batchUpdateDepth--
			if (entityListState.batchUpdateDepth === 0 && accessorBeforeUpdates !== entityListState.accessor) {
				updateAccessorInstance()
				entityListState.onEntityListUpdate(entityListState)
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
				entityListState.getChildEntityByKey,
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

		const generateNewEntityState = (persistedId: string | undefined): InternalEntityState => {
			const id = persistedId === undefined ? new EntityAccessor.UnpersistedEntityId() : persistedId
			const key = this.idToKey(id)
			let childErrors

			if (entityListState.errors) {
				childErrors = (entityListState.errors as ErrorsPreprocessor.KeyIndexedErrorNode).children[key]
			} else {
				childErrors = undefined
			}

			const entityState = this.initializeEntityAccessor(
				id,
				entityListState.fieldMarkers,
				entityListState.onChildEntityUpdate,
				childErrors,
			)

			entityListState.childrenKeys.add(key)

			return entityState
		}

		const initialData: Set<string | undefined> =
			persistedEntityIds.size === 0
				? new Set(Array(preferences.initialEntityCount).map(() => undefined))
				: persistedEntityIds
		for (const entityId of initialData) {
			generateNewEntityState(entityId)
		}

		updateAccessorInstance()

		return entityListState
	}

	private initializeFieldAccessor(
		placeholderName: FieldName,
		fieldMarker: FieldMarker,
		onFieldUpdate: OnFieldUpdate,
		persistedValue: Scalar | undefined,
		errors: ErrorAccessor[],
	): InternalFieldState {
		let resolvedFieldValue: FieldValue
		if (persistedValue === undefined) {
			// `persistedValue` will be `undefined` when a repeater creates a clone based on no data or when we're creating
			// a new entity
			resolvedFieldValue = fieldMarker.defaultValue === undefined ? null : fieldMarker.defaultValue
		} else {
			resolvedFieldValue = persistedValue
		}

		const fieldState: InternalFieldState = {
			type: InternalStateType.Field,
			errors,
			fieldMarker,
			onFieldUpdate,
			placeholderName,
			persistedValue: persistedValue === undefined ? null : persistedValue,
			addEventListener: undefined as any,
			accessor: (undefined as any) as FieldAccessor,
			eventListeners: {
				update: undefined,
			},
			touchLog: undefined,
			hasPendingUpdate: true,
			updateValue: (
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
					fieldState.onFieldUpdate(fieldState)
				})
			},
			isTouchedBy: (agent: string) =>
				fieldState.touchLog === undefined ? false : fieldState.touchLog.get(agent) || false,
		}
		fieldState.addEventListener = this.getAddEventListener(fieldState)
		//return state

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

		fieldState.accessor = createNewInstance(resolvedFieldValue)

		return fieldState
	}

	private rejectInvalidAccessorTree(): never {
		throw new BindingError(
			`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`,
		)
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

	private resolveAndPrepareEntityToConnect(
		rootState: InternalEntityState | InternalEntityListState,
		entityToConnectOrItsKey: string | EntityAccessor,
	): [string, InternalEntityState] {
		let connectedEntityKey: string

		if (typeof entityToConnectOrItsKey === 'string') {
			connectedEntityKey = entityToConnectOrItsKey
		} else {
			if (!entityToConnectOrItsKey.existsOnServer) {
				throw new BindingError(
					`Attempting to connect an entity with key '${entityToConnectOrItsKey.key}' that ` +
						`doesn't exist on server. That is currently impossible.`, // At least for now.
				)
			}
			connectedEntityKey = entityToConnectOrItsKey.key
		}

		const connectedState = this.entityStore.get(connectedEntityKey)
		if (connectedState === undefined) {
			throw new BindingError(`Attempting to connect an entity with key '${connectedEntityKey}' but it doesn't exist.`)
		}
		if (connectedState.isScheduledForDeletion) {
			// As far as the other realms are concerned, this entity is deleted. We don't want to just make it re-appear
			// for them just because some other random relation decided to connect it.
			connectedState.realms.clear()
			connectedState.isScheduledForDeletion = false
		}

		if (rootState.plannedRemovals) {
			// If the entity was previously scheduled for removal, undo that.
			for (const plannedRemoval of rootState.plannedRemovals) {
				if (plannedRemoval.removedEntity === connectedState) {
					rootState.plannedRemovals.delete(plannedRemoval as any)
				}
			}
		}

		return [connectedEntityKey, connectedState]
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
}

export { AccessorTreeGenerator }
