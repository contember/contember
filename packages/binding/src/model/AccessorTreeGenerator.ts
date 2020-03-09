import { GraphQlBuilder } from '@contember/client'
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

type AddEntityEventListener = EntityAccessor['addEventListener']
type AddEntityListEventListener = EntityListAccessor['addEventListener']
type OnUpdate = (updatedData: EntityAccessor.FieldData) => void
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
	batchUpdateDepth: number
	eventListeners: {
		[Type in EntityAccessor.EntityEventType]?: Set<EntityAccessor.EntityEventListenerMap[Type]>
	}
	accessor: EntityAccessor | EntityForRemovalAccessor | undefined
}

class AccessorTreeGenerator {
	private persistedData: ReceivedDataTree<undefined> | undefined
	private initialData: RootAccessor | ReceivedDataTree<undefined> | undefined
	private errorTreeRoot?: ErrorsPreprocessor.ErrorTreeRoot

	public constructor(private tree: MarkerTreeRoot) {}

	public generateLiveTree(
		persistedData: ReceivedDataTree<undefined> | undefined,
		initialData: RootAccessor | ReceivedDataTree<undefined> | undefined,
		updateData: AccessorTreeGenerator.UpdateData,
		errors?: MutationDataResponse,
	): void {
		const preprocessor = new ErrorsPreprocessor(errors)

		this.errorTreeRoot = preprocessor.preprocess()
		console.debug(this.errorTreeRoot, errors)

		this.persistedData = persistedData
		this.initialData = initialData

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
		)
	}

	private generateSubTree(
		tree: MarkerTreeRoot,
		data: ReceivedData<undefined> | RootAccessor,
		updateData: AccessorTreeGenerator.UpdateData,
		errors?: ErrorsPreprocessor.ErrorTreeRoot,
	): RootAccessor {
		const errorNode = errors === undefined ? undefined : errors[tree.id]

		const onUpdate: OnUpdate = (updatedData: EntityAccessor.FieldData) => {
			if (
				updatedData instanceof EntityAccessor ||
				updatedData instanceof EntityForRemovalAccessor ||
				updatedData instanceof EntityListAccessor
			) {
				return updateData(updatedData)
			}
			return this.rejectInvalidAccessorTree()
		}

		return Array.isArray(data) || data === undefined || data instanceof EntityListAccessor
			? this.generateEntityListAccessor(tree.fields, data, errorNode, onUpdate)
			: this.generateEntityAccessor(tree.fields, data, errorNode, onUpdate)
	}

	private updateFields(
		data: AccessorTreeGenerator.InitialEntityData,
		fields: EntityFields,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		onUpdate: (identifier: string, updatedData: EntityAccessor.FieldData) => void,
		onReplace: OnReplace,
		addEventListener: AddEntityEventListener,
		batchUpdates: BatchEntityUpdates,
		onUnlink?: OnUnlink,
	): EntityAccessor {
		const entityData: EntityAccessor.EntityData = {}
		const id = data
			? data instanceof EntityAccessor || data instanceof EntityForRemovalAccessor
				? data.runtimeId
				: data[PRIMARY_KEY_NAME]
			: new EntityAccessor.UnpersistedEntityId()
		const typename = data ? (data instanceof Accessor ? data.typename : data[TYPENAME_KEY_NAME]) : undefined

		for (const placeholderName in fields) {
			if (placeholderName === PRIMARY_KEY_NAME) {
				continue
			}

			const field = fields[placeholderName]

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

				entityData[placeholderName] = this.generateSubTree(field, initialData, () => undefined, undefined)
			} else if (field instanceof ReferenceMarker) {
				for (const referencePlaceholder in field.references) {
					const reference = field.references[referencePlaceholder]
					const fieldData = data
						? data instanceof Accessor
							? data.getField(referencePlaceholder)
							: data[referencePlaceholder]
						: undefined

					if (fieldData instanceof FieldAccessor) {
						throw new BindingError(
							`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`,
						)
					}

					const referenceError =
						errors && errors.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed
							? errors.children[field.fieldName] || errors.children[referencePlaceholder] || undefined
							: undefined

					const getOnReferenceUpdate = (placeholderName: string) => (newValue: EntityAccessor.FieldData) => {
						onUpdate(placeholderName, newValue)
					}
					if (reference.expectedCount === ExpectedEntityCount.UpToOne) {
						if (Array.isArray(fieldData) || fieldData instanceof EntityListAccessor) {
							throw new BindingError(
								`Received a collection of entities for field '${field.fieldName}' where a single entity was expected. ` +
									`Perhaps you wanted to use a <Repeater />?`,
							)
						} else if (
							!(fieldData instanceof FieldAccessor) &&
							(fieldData === null || typeof fieldData === 'object' || fieldData === undefined)
						) {
							entityData[referencePlaceholder] = this.generateEntityAccessor(
								reference.fields,
								fieldData || undefined,
								referenceError,
								getOnReferenceUpdate(referencePlaceholder),
							)
						} else {
							throw new BindingError(
								`Received a scalar value for field '${field.fieldName}' where a single entity was expected.` +
									`Perhaps you meant to use a variant of <Field />?`,
							)
						}
					} else if (reference.expectedCount === ExpectedEntityCount.PossiblyMany) {
						if (fieldData === undefined || Array.isArray(fieldData) || fieldData instanceof EntityListAccessor) {
							entityData[referencePlaceholder] = this.generateEntityListAccessor(
								reference.fields,
								fieldData,
								referenceError,
								getOnReferenceUpdate(referencePlaceholder),
								reference.preferences,
							)
						} else if (typeof fieldData === 'object') {
							// Intentionally allowing `fieldData === null` here as well since this should only happen when a *hasOne
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
				const fieldData = data
					? data instanceof Accessor
						? data.getField(placeholderName)
						: data[placeholderName]
					: undefined
				if (
					fieldData instanceof EntityListAccessor ||
					fieldData instanceof EntityAccessor ||
					fieldData instanceof EntityForRemovalAccessor
				) {
					return this.rejectInvalidAccessorTree()
				} else if (Array.isArray(fieldData)) {
					throw new BindingError(
						`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use a <Repeater />?`,
					)
				} else if (!(fieldData instanceof FieldAccessor) && typeof fieldData === 'object' && fieldData !== null) {
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
							: []
					const persistedValue =
						fieldData instanceof FieldAccessor ? fieldData.persistedValue : fieldData === undefined ? null : fieldData
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
						onUpdate(
							placeholderName,
							new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
								placeholderName,
								newValue,
								persistedValue,
								isTouchedBy,
								fieldErrors,
								onChange,
							),
						)
					}
					let fieldValue: FieldValue
					if (fieldData === undefined) {
						// `fieldData` will be `undefined` when a repeater creates a clone based on no data or when we're creating
						// a new entity
						fieldValue = field.defaultValue === undefined ? null : field.defaultValue
					} else {
						fieldValue = fieldData instanceof FieldAccessor ? fieldData.currentValue : fieldData
					}
					entityData[placeholderName] = new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
						placeholderName,
						fieldValue,
						persistedValue,
						isTouchedBy,
						fieldErrors,
						onChange,
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
			entityData,
			errors ? errors.errors : [],
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
		entityState: InternalEntityState = this.createEmptyEntityState(),
	): EntityAccessor {
		const performUpdate = () => parentOnUpdate(entityState.accessor)
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
		const onUpdate = (updatedField: FieldName, updatedData: EntityAccessor.FieldData) => {
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
				entityState.eventListeners[type] = new Set()
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

		let batchUpdateDepth = 0
		const eventListeners: {
			[Type in EntityListAccessor.EntityEventType]?: Set<EntityListAccessor.EntityEventListenerMap[Type]>
		} = {}
		const childStates: Map<string, InternalEntityState> = new Map()
		let listAccessor: EntityListAccessor

		const updateAccessorInstance = () => {
			return (listAccessor = new EntityListAccessor(
				childStates as Map<string, EntityListAccessor.ChildWithMetadata>,
				listAccessor.errors,
				listAccessor.addEventListener,
				listAccessor.batchUpdates,
				listAccessor.addNew,
			))
		}
		const performUpdate = () => parentOnUpdate(updateAccessorInstance())
		const batchUpdates: BatchEntityListUpdates = performUpdates => {
			batchUpdateDepth++
			const accessorBeforeUpdates = listAccessor
			performUpdates(() => listAccessor)
			batchUpdateDepth--
			if (batchUpdateDepth === 0 && accessorBeforeUpdates !== listAccessor) {
				performUpdate()
			}
		}

		const onUpdateProxy = (key: string, newValue: EntityAccessor.FieldData) => {
			batchUpdates(getAccessor => {
				const childState = childStates.get(key)
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
				childState.accessor = newValue
				updateAccessorInstance()

				if (eventListeners.beforeUpdate === undefined || eventListeners.beforeUpdate.size === 0) {
					return
				}

				for (let i = 0; i < BEFORE_UPDATE_SETTLE_LIMIT; i++) {
					for (const listener of eventListeners.beforeUpdate) {
						listener(getAccessor)
					}
					if (listAccessor === getAccessor()) {
						return
					}
				}
				throw new BindingError(
					`EntityAccessor beforeUpdate event: maximum stabilization limit exceeded. ` +
						`This likely means an infinite feedback loop in your code.`,
				)
			})
		}
		const addEventListener: AddEntityListEventListener = (type, listener) => {
			if (eventListeners[type] === undefined) {
				eventListeners[type] = new Set()
			}
			eventListeners[type]!.add(listener as any)
			return () => {
				if (eventListeners[type] === undefined) {
					return // Throw an error? This REALLY should not happen.
				}
				eventListeners[type]!.delete(listener as any)
				if (eventListeners[type]!.size === 0) {
					eventListeners[type] = undefined
				}
			}
		}
		const generateNewAccessor = (datum: AccessorTreeGenerator.InitialEntityData): EntityAccessor => {
			let key: string
			let childErrors

			const entityState = this.createEmptyEntityState()

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
			const accessor = this.generateEntityAccessor(entityFields, datum, childErrors, onUpdate, entityState)
			key = accessor.key
			childStates.set(key, entityState)

			return accessor
		}
		listAccessor = new EntityListAccessor(
			childStates as Map<string, EntityListAccessor.ChildWithMetadata>,
			errors ? errors.errors : [],
			addEventListener,
			batchUpdates,
			newEntity => {
				const newAccessor = generateNewAccessor(typeof newEntity === 'function' ? undefined : newEntity)

				if (typeof newEntity === 'function') {
					listAccessor.batchUpdates(getAccessor => {
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
			generateNewAccessor(sourceDatum)
		}

		return listAccessor
	}

	private withUpdatedField(
		original: EntityAccessor,
		fieldPlaceholder: string,
		newData: EntityAccessor.FieldData,
	): EntityAccessor {
		return new EntityAccessor(
			original.runtimeId,
			original.typename,
			{
				...original.data,
				[fieldPlaceholder]: newData,
			},
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
			replacement.data,
			blueprint.errors,
			blueprint.addEventListener,
			blueprint.batchUpdates,
			blueprint.replaceBy,
			onRemove || blueprint.remove,
		)
	}

	private removeEntity(
		initialEntityData: AccessorTreeGenerator.InitialEntityData,
		currentEntity: EntityAccessor.FieldData,
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
			accessor: undefined,
			batchUpdateDepth: 0,
			eventListeners: {},
		}
	}
}

namespace AccessorTreeGenerator {
	export type UpdateData = (newData: RootAccessor) => void

	export type InitialEntityData = ReceivedEntityData<undefined> | EntityAccessor | EntityForRemovalAccessor
}

export { AccessorTreeGenerator }
