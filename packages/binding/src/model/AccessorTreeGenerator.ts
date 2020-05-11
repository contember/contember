import { GraphQlBuilder } from '@contember/client'
import { emptyArray, noop, returnFalse } from '@contember/react-utils'
import { assertNever } from '../utils'
import { MutationDataResponse, ReceivedData, ReceivedDataTree, ReceivedEntityData } from '../accessorTree'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { BindingError } from '../BindingError'
import {
	Accessor,
	EntityAccessor,
	EntityForRemovalAccessor,
	EntityListAccessor,
	FieldAccessor,
	RootAccessor,
} from '../accessors'
import { ConnectionMarker, EntityFields, FieldMarker, MarkerTreeRoot, ReferenceMarker } from '../markers'
import { ExpectedEntityCount, FieldName, FieldValue, RemovalType, Scalar } from '../treeParameters'
import { ErrorsPreprocessor } from './ErrorsPreprocessor'
import * as ReactDOM from 'react-dom'

type AddEntityEventListener = EntityAccessor['addEventListener']
type AddEntityListEventListener = EntityListAccessor['addEventListener']
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

type InternalStateNode = InternalEntityState | InternalEntityListState | InternalFieldState
type InternalEntityFields = Map<FieldName, InternalStateNode>

interface InternalEntityState {
	isFrozenWhileUpdating: boolean
	batchUpdateDepth: number
	eventListeners: {
		[Type in EntityAccessor.EntityEventType]: Set<EntityAccessor.EntityEventListenerMap[Type]> | undefined
	}
	hasPendingUpdate: boolean
	dirtyChildFields: Set<FieldName> | undefined
	fields: InternalEntityFields
	accessor: EntityAccessor | EntityForRemovalAccessor | undefined
}

interface InternalEntityListState {
	isFrozenWhileUpdating: boolean
	batchUpdateDepth: number
	eventListeners: {
		[Type in EntityListAccessor.EntityEventType]: Set<EntityListAccessor.EntityEventListenerMap[Type]> | undefined
	}
	accessor: EntityListAccessor
	hasPendingUpdate: boolean
	dirtyChildIds: Set<string> | undefined
	childIds: Set<string>
}

interface InternalFieldState {
	touchLog: Map<string, boolean> | undefined
	accessor: FieldAccessor
	eventListeners: {
		[Type in FieldAccessor.FieldEventType]: Set<FieldAccessor.FieldEventListenerMap[Type]> | undefined
	}
}

class AccessorTreeGenerator {
	private persistedData: ReceivedDataTree<undefined> | undefined
	private initialData: RootAccessor | ReceivedDataTree<undefined> | undefined
	private errorTreeRoot?: ErrorsPreprocessor.ErrorTreeRoot
	private entityStore: Map<string, InternalEntityState> = new Map()
	private readonly getEntityByKey: (key: string) => EntityAccessor | EntityForRemovalAccessor | undefined = key =>
		this.entityStore.get(key)?.accessor

	public constructor(private tree: MarkerTreeRoot) {}

	public generateLiveTree(
		persistedData: ReceivedDataTree<undefined> | undefined,
		initialData: RootAccessor | ReceivedDataTree<undefined> | undefined,
		updateData: AccessorTreeGenerator.UpdateData,
		errors?: MutationDataResponse,
	): void {
		//this.entityStore = new Map()
		const preprocessor = new ErrorsPreprocessor(errors)

		this.errorTreeRoot = preprocessor.preprocess()
		console.debug(this.errorTreeRoot, errors)

		this.persistedData = persistedData
		this.initialData = initialData

		const updateDataWithEvents = (newData: RootAccessor) => {
			ReactDOM.unstable_batchedUpdates(() => {
				updateData(newData, this.getEntityByKey)
				subTreeState.hasPendingUpdate = true
				this.flushPendingAccessorUpdates(subTreeState)
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
	): InternalEntityState | InternalEntityListState {
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

		const subTreeState =
			Array.isArray(data) || data === undefined || data instanceof EntityListAccessor
				? this.generateEntityListAccessor(tree.fields, data, errorNode, onUpdate)
				: this.generateEntityAccessor(tree.fields, data, errorNode, onUpdate, undefined)

		return subTreeState
	}

	private updateFields(
		id: string | EntityAccessor.UnpersistedEntityId,
		data: AccessorTreeGenerator.InitialEntityData,
		fieldStates: InternalEntityFields,
		entityMarkers: EntityFields,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		onUpdate: (identifier: string, updatedData: EntityAccessor.NestedAccessor | undefined) => void,
		onReplace: OnReplace,
		addEventListener: AddEntityEventListener,
		batchUpdates: BatchEntityUpdates,
		onUnlink?: OnUnlink,
	): EntityAccessor {
		// In the grand scheme of things, sub trees are actually fairly rare, and so we only initialize them if necessary
		let subTreeData: EntityAccessor.SubTreeData | undefined = undefined
		const typename = data ? (data instanceof Accessor ? data.typename : data[TYPENAME_KEY_NAME]) : undefined

		for (const [placeholderName, field] of entityMarkers) {
			if (placeholderName === PRIMARY_KEY_NAME) {
				// Falling back to null since that's what fields do. Arguably, we could also stringify the unpersisted entity id. Which is better?
				const idValue = typeof id === 'string' ? id : null
				fieldStates.set(placeholderName, {
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
					eventListeners: {
						afterUpdate: undefined,
					},
					touchLog: undefined,
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

				if (subTreeData === undefined) {
					subTreeData = new Map()
				}

				subTreeData.set(
					field.subTreeIdentifier || field.id,
					this.generateSubTree(field, initialData, () => undefined, undefined).accessor!,
				)
			} else if (field instanceof ReferenceMarker) {
				for (const referencePlaceholder in field.references) {
					const reference = field.references[referencePlaceholder]
					const fieldDatum = data
						? data instanceof Accessor
							? data.getField(referencePlaceholder)
							: data[referencePlaceholder]
						: undefined

					if (fieldDatum instanceof FieldAccessor) {
						throw new BindingError(
							`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`,
						)
					}

					const referenceError =
						errors && errors.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed
							? errors.children[field.fieldName] || errors.children[referencePlaceholder] || undefined
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
						} else if (
							!(fieldDatum instanceof FieldAccessor) &&
							(fieldDatum === null || typeof fieldDatum === 'object' || fieldDatum === undefined)
						) {
							fieldStates.set(
								referencePlaceholder,
								this.generateEntityAccessor(
									reference.fields,
									fieldDatum || undefined,
									referenceError,
									getOnReferenceUpdate(referencePlaceholder),
									undefined,
								),
							)
						} else {
							throw new BindingError(
								`Received a scalar value for field '${field.fieldName}' where a single entity was expected.` +
									`Perhaps you meant to use a variant of <Field />?`,
							)
						}
					} else if (reference.expectedCount === ExpectedEntityCount.PossiblyMany) {
						if (fieldDatum === undefined || Array.isArray(fieldDatum) || fieldDatum instanceof EntityListAccessor) {
							fieldStates.set(
								referencePlaceholder,
								this.generateEntityListAccessor(
									reference.fields,
									fieldDatum,
									referenceError,
									getOnReferenceUpdate(referencePlaceholder),
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
				const fieldDatum = data
					? data instanceof Accessor
						? data.getField(placeholderName)
						: data[placeholderName]
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
					const fieldState = this.createEmptyFieldState()
					const fieldErrors =
						errors &&
						errors.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed &&
						field.fieldName in errors.children
							? errors.children[field.fieldName].errors
							: emptyArray
					const persistedValue =
						fieldDatum instanceof FieldAccessor
							? fieldDatum.persistedValue
							: fieldDatum === undefined
							? null
							: fieldDatum
					const isTouchedBy = (agent: string) =>
						fieldState.touchLog === undefined ? false : fieldState.touchLog.get(agent) || false
					const onChange = function(
						this: FieldAccessor,
						newValue: Scalar | GraphQlBuilder.Literal,
						{ agent = FieldAccessor.userAgent }: FieldAccessor.UpdateOptions = {},
					) {
						if (fieldState.touchLog === undefined) {
							fieldState.touchLog = new Map()
						}
						fieldState.touchLog.set(agent, true)
						if (newValue === this.currentValue) {
							return
						}
						onUpdate(
							placeholderName,
							new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
								placeholderName,
								newValue,
								persistedValue,
								field.defaultValue,
								isTouchedBy,
								fieldErrors,
								() => noop, // TODO
								onChange,
							),
						)
					}
					let fieldValue: FieldValue
					if (fieldDatum === undefined) {
						// `fieldDatum` will be `undefined` when a repeater creates a clone based on no data or when we're creating
						// a new entity
						fieldValue = field.defaultValue === undefined ? null : field.defaultValue
					} else {
						fieldValue = fieldDatum instanceof FieldAccessor ? fieldDatum.currentValue : fieldDatum
					}
					fieldState.accessor = new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
						placeholderName,
						fieldValue,
						persistedValue,
						field.defaultValue,
						isTouchedBy,
						fieldErrors,
						() => noop, // TODO
						onChange,
					)
					fieldStates.set(placeholderName, fieldState)
				}
			} else if (field instanceof ConnectionMarker) {
				// Do nothing ‒ connections need no runtime representation
			} else {
				assertNever(field)
			}
		}

		return new EntityAccessor(
			id,
			typename,

			// We're technically exposing more info in runtime than we'd like but that way we don't have to allocate and
			// keep in sync two copies of the same data. TS hides the extra info anyway.
			fieldStates,
			subTreeData,
			errors ? errors.errors : emptyArray,
			addEventListener,
			batchUpdates,
			onReplace,
			onUnlink,
		)
	}

	private generateEntityAccessor(
		entityFields: EntityFields,
		persistedData: AccessorTreeGenerator.InitialEntityData,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		parentOnUpdate: OnUpdate,
		id: undefined | string | EntityAccessor.UnpersistedEntityId,
	): InternalEntityState {
		// TODO We need to merge different entities with the same id!

		if (id === undefined) {
			id = this.resolveOrCreateEntityId(persistedData)
		}
		const entityKey = typeof id === 'string' ? id : id.value

		let entityState: InternalEntityState
		const existingState = this.entityStore.get(entityKey)

		if (existingState === undefined) {
			this.entityStore.set(entityKey, (entityState = this.createEmptyEntityState()))
		} else {
			entityState = existingState
			entityState.hasPendingUpdate = true
			entityState.dirtyChildFields = new Set(entityState.fields.keys())
		}

		const performUpdate = () => {
			entityState.hasPendingUpdate = true
			parentOnUpdate(entityState.accessor)
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
					entityAccessor.subTreeData,
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
				!persistedData ||
				persistedData instanceof EntityForRemovalAccessor ||
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
		const addEventListener: EntityAccessor.AddEntityEventListener = (
			type: EntityAccessor.EntityEventType,
			listener: EntityAccessor.EntityEventListenerMap[typeof type],
		) => {
			if (entityState.eventListeners[type] === undefined) {
				entityState.eventListeners[type] = new Set<never>()
			}
			entityState.eventListeners[type]!.add(listener as any)
			return () => {
				if (entityState.eventListeners[type] === undefined) {
					return // Throw an error? This REALLY should not happen.
				}
				entityState.eventListeners[type]!.delete(listener as any)
				if (entityState.eventListeners[type]!.size === 0) {
					entityState.eventListeners[type] = undefined
				}
			}
		}
		entityState.accessor = this.updateFields(
			id,
			persistedData,
			entityState.fields,
			entityFields,
			errors,
			onUpdate,
			onReplace,
			addEventListener,
			batchUpdates,
			onRemove,
		)
		return entityState
	}

	private generateEntityListAccessor(
		entityFields: EntityFields,
		fieldData: ReceivedEntityData<undefined>[] | EntityListAccessor | undefined,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		parentOnUpdate: OnUpdate,
		preferences: ReferenceMarker.ReferencePreferences = ReferenceMarker.defaultReferencePreferences[
			ExpectedEntityCount.PossiblyMany
		],
	): InternalEntityListState {
		if (errors && errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.KeyIndexed) {
			throw new BindingError(
				`The error tree structure does not correspond to the marker tree. This should never happen.`,
			)
		}
		const entityListState = this.createEmptyEntityListState()

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
		const performUpdate = () => {
			parentOnUpdate(updateAccessorInstance())
		}
		const batchUpdates: BatchEntityListUpdates = performUpdates => {
			entityListState.batchUpdateDepth++
			const accessorBeforeUpdates = entityListState.accessor
			performUpdates(() => entityListState.accessor!)
			entityListState.batchUpdateDepth--
			if (entityListState.batchUpdateDepth === 0 && accessorBeforeUpdates !== entityListState.accessor) {
				performUpdate()
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
		const addEventListener: AddEntityListEventListener = (
			type: EntityListAccessor.EntityEventType,
			listener: EntityListAccessor.EntityEventListenerMap[typeof type],
		) => {
			if (entityListState.eventListeners[type] === undefined) {
				entityListState.eventListeners[type] = new Set<never>()
			}
			entityListState.eventListeners[type]!.add(listener as any)
			return () => {
				if (entityListState.eventListeners[type] === undefined) {
					return // Throw an error? This REALLY should not happen.
				}
				entityListState.eventListeners[type]!.delete(listener as any)
				if (entityListState.eventListeners[type]!.size === 0) {
					entityListState.eventListeners[type] = undefined
				}
			}
		}
		const generateNewAccessor = (
			datum: AccessorTreeGenerator.InitialEntityData,
			id: string | EntityAccessor.UnpersistedEntityId,
		): EntityAccessor => {
			const key = typeof id === 'string' ? id : id.value
			let childErrors

			if (errors && datum) {
				const errorKey =
					datum instanceof EntityAccessor || datum instanceof EntityForRemovalAccessor
						? datum.key
						: datum[PRIMARY_KEY_NAME]
				childErrors = errors.children[errorKey]
			} else {
				childErrors = undefined
			}

			const onUpdate: OnUpdate = newValue => onUpdateProxy(key, newValue)
			const entityState = this.generateEntityAccessor(entityFields, datum, childErrors, onUpdate, id)
			entityListState.childIds.add(key)

			return entityState.accessor as EntityAccessor
		}
		const getChildEntityByKey = (key: string) => {
			if (!entityListState.childIds.has(key)) {
				return undefined
			}
			return this.getEntityByKey(key)
		}
		entityListState.accessor = new EntityListAccessor(
			getChildEntityByKey,
			entityListState.childIds,
			errors ? errors.errors : emptyArray,
			addEventListener,
			batchUpdates,
			newEntity => {
				const newId = new EntityAccessor.UnpersistedEntityId()
				const newAccessor = generateNewAccessor(typeof newEntity === 'function' ? undefined : newEntity, newId)

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

		let sourceData = fieldData instanceof EntityListAccessor ? Array.from(fieldData) : fieldData || []
		if (
			sourceData.length === 0 ||
			sourceData.every(
				(datum: ReceivedEntityData<undefined> | EntityAccessor | EntityForRemovalAccessor | undefined) =>
					datum === undefined,
			)
		) {
			sourceData = Array(preferences.initialEntityCount).map(() => undefined)
		}

		for (const sourceDatum of sourceData) {
			generateNewAccessor(sourceDatum, this.resolveOrCreateEntityId(sourceDatum))
		}

		return entityListState
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
			replacement.subTreeData,
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

	private createEmptyFieldState(): InternalFieldState {
		return {
			accessor: (undefined as any) as FieldAccessor,
			eventListeners: {
				afterUpdate: undefined,
			},
			touchLog: undefined,
		}
	}

	private createEmptyEntityState(): InternalEntityState {
		return {
			accessor: undefined,
			batchUpdateDepth: 0,
			dirtyChildFields: undefined,
			eventListeners: {
				afterUpdate: undefined,
				beforeUpdate: undefined,
			},
			fields: new Map(),
			hasPendingUpdate: true,
			isFrozenWhileUpdating: false,
		}
	}

	private createEmptyEntityListState(): InternalEntityListState {
		return {
			accessor: (undefined as any) as EntityListAccessor,
			batchUpdateDepth: 0,
			childIds: new Set(),
			dirtyChildIds: undefined,
			eventListeners: {
				afterUpdate: undefined,
				beforeUpdate: undefined,
			},
			hasPendingUpdate: true,
			isFrozenWhileUpdating: false,
		}
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

	private flushPendingAccessorUpdates(rootState: InternalEntityState | InternalEntityListState) {
		// It is *CRUCIAL* that this is a BFS so that we update the components in top-down order.
		const agenda: Array<InternalEntityState | InternalEntityListState> = [rootState]

		for (const state of agenda) {
			console.log(state)
			if (!state.hasPendingUpdate) {
				continue
			}
			state.isFrozenWhileUpdating = true
			if (state.accessor instanceof EntityListAccessor) {
				const listState = state as InternalEntityListState

				if (listState.eventListeners.afterUpdate !== undefined) {
					for (const handler of listState.eventListeners.afterUpdate) {
						handler(listState.accessor)
					}
				}
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

				if (entityState.eventListeners.afterUpdate !== undefined) {
					for (const handler of entityState.eventListeners.afterUpdate) {
						handler(entityState.accessor)
					}
				}
				if (entityState.dirtyChildFields !== undefined) {
					for (const dirtyChildPlaceholder of entityState.dirtyChildFields) {
						const dirtyChildState = entityState.fields.get(dirtyChildPlaceholder)
						if (dirtyChildState === undefined) {
							throw new BindingError()
						}
						if (dirtyChildState.accessor instanceof FieldAccessor) {
							continue
						}
						agenda.push(dirtyChildState as InternalEntityState | InternalEntityListState)
					}
					entityState.dirtyChildFields = undefined
				}
			}
			state.isFrozenWhileUpdating = false
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
