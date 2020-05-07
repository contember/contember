import { GraphQlBuilder } from '@contember/client'
import { emptyArray, returnFalse } from '@contember/react-utils'
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
type OnUpdate = (updatedData: EntityAccessor.FieldDatum) => void
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

interface InternalEntityState {
	isFrozenWhileUpdating: boolean
	batchUpdateDepth: number
	eventListeners: {
		[Type in EntityAccessor.EntityEventType]?: Set<EntityAccessor.EntityEventListenerMap[Type]>
	}
	accessor: EntityAccessor | EntityForRemovalAccessor | undefined
}

interface InternalEntityListState {
	isFrozenWhileUpdating: boolean
	batchUpdateDepth: number
	eventListeners: {
		[Type in EntityListAccessor.EntityEventType]?: Set<EntityListAccessor.EntityEventListenerMap[Type]>
	}
	accessor: EntityListAccessor | undefined
	childIds: Set<string>
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
		this.entityStore = new Map()
		const preprocessor = new ErrorsPreprocessor(errors)

		this.errorTreeRoot = preprocessor.preprocess()
		console.debug(this.errorTreeRoot, errors)

		this.persistedData = persistedData
		this.initialData = initialData

		ReactDOM.unstable_batchedUpdates(() => {
			updateData(
				this.generateSubTree(
					this.tree,
					initialData instanceof EntityAccessor ||
						initialData instanceof EntityListAccessor ||
						initialData instanceof EntityForRemovalAccessor
						? initialData
						: initialData === undefined
						? undefined
						: initialData[this.tree.id],
					updateData,
					this.errorTreeRoot,
				),
				this.getEntityByKey,
			)
		})
	}

	private generateSubTree(
		tree: MarkerTreeRoot,
		data: ReceivedData<undefined> | RootAccessor,
		updateData: AccessorTreeGenerator.UpdateData,
		errors?: ErrorsPreprocessor.ErrorTreeRoot,
	): RootAccessor {
		const errorNode = errors === undefined ? undefined : errors[tree.id]

		const onUpdate: OnUpdate = (updatedData: EntityAccessor.FieldDatum) => {
			if (
				updatedData instanceof EntityAccessor ||
				updatedData instanceof EntityForRemovalAccessor ||
				updatedData instanceof EntityListAccessor
			) {
				return updateData(updatedData, this.getEntityByKey)
			}
			return this.rejectInvalidAccessorTree()
		}

		return Array.isArray(data) || data === undefined || data instanceof EntityListAccessor
			? this.generateEntityListAccessor(tree.fields, data, errorNode, onUpdate)
			: this.generateEntityAccessor(tree.fields, data, errorNode, onUpdate)
	}

	private updateFields(
		id: string | EntityAccessor.UnpersistedEntityId,
		data: AccessorTreeGenerator.InitialEntityData,
		fields: EntityFields,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		onUpdate: (identifier: string, updatedData: EntityAccessor.FieldDatum) => void,
		onReplace: OnReplace,
		addEventListener: AddEntityEventListener,
		batchUpdates: BatchEntityUpdates,
		onUnlink?: OnUnlink,
	): EntityAccessor {
		const fieldData: EntityAccessor.FieldData = new Map()
		// In the grand scheme of things, sub trees are actually fairly rare, and so we only initialize them if necessary
		let subTreeData: EntityAccessor.SubTreeData | undefined = undefined
		const typename = data ? (data instanceof Accessor ? data.typename : data[TYPENAME_KEY_NAME]) : undefined

		for (const [placeholderName, field] of fields) {
			if (placeholderName === PRIMARY_KEY_NAME) {
				// Falling back to null since that's what fields do. Arguably, we could also stringify the unpersisted entity id. Which is better?
				const idValue = typeof id === 'string' ? id : null
				fieldData.set(
					placeholderName,
					new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
						placeholderName,
						idValue,
						idValue,
						undefined,
						returnFalse, // IDs cannot be updated, and thus they cannot be touched either
						emptyArray, // There cannot be errors associated with the id, right? If so, we should probably handle them at the Entity level.
						undefined, // IDs cannot be updated
					),
				)
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
					this.generateSubTree(field, initialData, () => undefined, undefined),
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

					const getOnReferenceUpdate = (placeholderName: string) => (newValue: EntityAccessor.FieldDatum) => {
						ReactDOM.unstable_batchedUpdates(() => {
							onUpdate(placeholderName, newValue)
						})
					}
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
							fieldData.set(
								referencePlaceholder,
								this.generateEntityAccessor(
									reference.fields,
									fieldDatum || undefined,
									referenceError,
									getOnReferenceUpdate(referencePlaceholder),
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
							fieldData.set(
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
					let touchLog: Map<string, boolean> | undefined
					const isTouchedBy = (agent: string) => (touchLog === undefined ? false : touchLog.get(agent) || false)
					const onChange = function(
						this: FieldAccessor,
						newValue: Scalar | GraphQlBuilder.Literal,
						{ agent = FieldAccessor.userAgent }: FieldAccessor.UpdateOptions = {},
					) {
						if (touchLog === undefined) {
							touchLog = new Map()
						}
						touchLog.set(agent, true)
						if (newValue === this.currentValue) {
							return
						}
						ReactDOM.unstable_batchedUpdates(() => {
							onUpdate(
								placeholderName,
								new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
									placeholderName,
									newValue,
									persistedValue,
									field.defaultValue,
									isTouchedBy,
									fieldErrors,
									onChange,
								),
							)
						})
					}
					let fieldValue: FieldValue
					if (fieldDatum === undefined) {
						// `fieldDatum` will be `undefined` when a repeater creates a clone based on no data or when we're creating
						// a new entity
						fieldValue = field.defaultValue === undefined ? null : field.defaultValue
					} else {
						fieldValue = fieldDatum instanceof FieldAccessor ? fieldDatum.currentValue : fieldDatum
					}
					fieldData.set(
						placeholderName,
						new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
							placeholderName,
							fieldValue,
							persistedValue,
							field.defaultValue,
							isTouchedBy,
							fieldErrors,
							onChange,
						),
					)
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
			fieldData,
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
		id?: string | EntityAccessor.UnpersistedEntityId,
	): EntityAccessor {
		// TODO We need to merge different entities with the same id!

		if (id === undefined) {
			id = this.getEntityId(persistedData)
		}
		const entityKey = typeof id === 'string' ? id : id.value
		const entityState = this.createEmptyEntityState()
		this.entityStore.set(entityKey, entityState)

		const performUpdate = () => {
			if (entityState.isFrozenWhileUpdating) {
				throw new BindingError(
					`Trying to perform an update while the whole accessor tree is already updating. If you wish to react to ` +
						`changes, use the 'beforeUpdate' event so that it is possible to avoid thrashing.`,
				)
			}
			ReactDOM.unstable_batchedUpdates(() => {
				entityState.isFrozenWhileUpdating = true
				parentOnUpdate(entityState.accessor)
				if (entityState.eventListeners.afterUpdate === undefined) {
					entityState.isFrozenWhileUpdating = false
					return
				}
				for (const handler of entityState.eventListeners.afterUpdate) {
					handler(entityState.accessor)
				}
				entityState.isFrozenWhileUpdating = false
			})
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
		const onUpdate = (updatedField: FieldName, updatedData: EntityAccessor.FieldDatum) => {
			const entityAccessor = entityState.accessor
			if (entityAccessor instanceof EntityAccessor) {
				return onUpdateProxy(this.withUpdatedField(entityAccessor, updatedField, updatedData))
			}
			return this.rejectInvalidAccessorTree()
		}
		const onReplace: OnReplace = replacement => {
			const entityAccessor = entityState.accessor
			if (entityAccessor instanceof EntityAccessor || entityAccessor instanceof EntityForRemovalAccessor) {
				return onUpdateProxy(this.asDifferentEntity(entityAccessor, replacement, onRemove))
			}
			return this.rejectInvalidAccessorTree()
		}
		const onRemove = (removalType: RemovalType) => {
			if (entityState.batchUpdateDepth !== 0) {
				throw new BindingError(`Removing entities that are being batch updated is a no-op.`)
			}
			onUpdateProxy(this.removeEntity(persistedData, entityState.accessor, removalType))
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
		return (entityState.accessor = this.updateFields(
			id,
			persistedData,
			entityFields,
			errors,
			onUpdate,
			onReplace,
			addEventListener,
			batchUpdates,
			onRemove,
		))
	}

	private generateEntityListAccessor(
		entityFields: EntityFields,
		fieldData: ReceivedEntityData<undefined>[] | EntityListAccessor | undefined,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		parentOnUpdate: OnUpdate,
		preferences: ReferenceMarker.ReferencePreferences = ReferenceMarker.defaultReferencePreferences[
			ExpectedEntityCount.PossiblyMany
		],
	): EntityListAccessor {
		if (errors && errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.KeyIndexed) {
			throw new BindingError(
				`The error tree structure does not correspond to the marker tree. This should never happen.`,
			)
		}
		const entityListState = this.createEmptyEntityListState()

		const updateAccessorInstance = () => {
			const accessor = entityListState.accessor!
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
			if (entityListState.isFrozenWhileUpdating) {
				throw new BindingError(
					`Trying to perform an update while the whole accessor tree is already updating. If you wish to react to ` +
						`changes, use the 'beforeUpdate' event so that it is possible to avoid thrashing.`,
				)
			}
			ReactDOM.unstable_batchedUpdates(() => {
				entityListState.isFrozenWhileUpdating = true
				parentOnUpdate(updateAccessorInstance())
				if (entityListState.eventListeners.afterUpdate === undefined) {
					entityListState.isFrozenWhileUpdating = false
					return
				}
				for (const handler of entityListState.eventListeners.afterUpdate) {
					handler(entityListState.accessor)
				}
				entityListState.isFrozenWhileUpdating = false
			})
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

		const onUpdateProxy = (key: string, newValue: EntityAccessor.FieldDatum) => {
			batchUpdates(getAccessor => {
				const childState = this.entityStore.get(key)
				if (childState === undefined) {
					this.rejectInvalidAccessorTree()
				}

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
					this.entityStore.delete(key)
				} else {
					//childState.accessor = newValue
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
			const accessor = this.generateEntityAccessor(entityFields, datum, childErrors, onUpdate, id)
			entityListState.childIds.add(key)

			return accessor
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
			generateNewAccessor(sourceDatum, this.getEntityId(sourceDatum))
		}

		return entityListState.accessor
	}

	private withUpdatedField(
		original: EntityAccessor,
		fieldPlaceholder: string,
		newData: EntityAccessor.FieldDatum,
	): EntityAccessor {
		original.fieldData.set(fieldPlaceholder, newData)
		return new EntityAccessor(
			original.runtimeId,
			original.typename,
			original.fieldData,
			original.subTreeData,
			original.errors,
			original.addEventListener,
			original.batchUpdates,
			original.replaceBy,
			original.remove,
		)
	}

	private asDifferentEntity(
		original: EntityAccessor | EntityForRemovalAccessor,
		replacement: EntityAccessor,
		onRemove?: EntityAccessor['remove'],
	): EntityAccessor {
		// TODO: we also need to update the callbacks inside replacement.data
		const blueprint = original instanceof EntityAccessor ? original : original.entityAccessor
		return new EntityAccessor(
			replacement.runtimeId,
			blueprint.typename,
			replacement.fieldData,
			replacement.subTreeData,
			blueprint.errors,
			blueprint.addEventListener,
			blueprint.batchUpdates,
			blueprint.replaceBy,
			onRemove || blueprint.remove,
		)
	}

	private removeEntity(
		initialEntityData: AccessorTreeGenerator.InitialEntityData,
		currentEntity: EntityAccessor.FieldDatum,
		removalType: RemovalType,
	): EntityForRemovalAccessor | undefined {
		if (
			!initialEntityData ||
			initialEntityData instanceof EntityForRemovalAccessor ||
			!(currentEntity instanceof EntityAccessor)
		) {
			return undefined
		}

		return new EntityForRemovalAccessor(currentEntity, currentEntity.replaceBy, removalType)
	}

	private rejectInvalidAccessorTree(): never {
		throw new BindingError(
			`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`,
		)
	}

	private createEmptyEntityState(): InternalEntityState {
		return {
			isFrozenWhileUpdating: false,
			accessor: undefined,
			batchUpdateDepth: 0,
			eventListeners: {},
		}
	}

	private createEmptyEntityListState(): InternalEntityListState {
		return {
			isFrozenWhileUpdating: false,
			accessor: undefined,
			batchUpdateDepth: 0,
			eventListeners: {},
			childIds: new Set(),
		}
	}

	private getEntityId(data: AccessorTreeGenerator.InitialEntityData): string | EntityAccessor.UnpersistedEntityId {
		return data
			? data instanceof EntityAccessor || data instanceof EntityForRemovalAccessor
				? data.runtimeId
				: data[PRIMARY_KEY_NAME]
			: new EntityAccessor.UnpersistedEntityId()
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
