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

type AddEventListener = EntityAccessor['addEventListener']
type OnUpdate = (updatedField: FieldName, updatedData: EntityAccessor.FieldData) => void
type OnReplace = EntityAccessor['replaceBy']
type OnUnlink = EntityAccessor['remove']
type BatchEntityUpdates = EntityAccessor['batchUpdates']
type BatchEntityListUpdates = EntityListAccessor['batchUpdates']

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
		const rootName = 'data'
		const errorNode = errors === undefined ? undefined : errors[tree.id]

		const onUpdate: OnUpdate = (updatedField, updatedData: EntityAccessor.FieldData) => {
			if (
				updatedData instanceof EntityAccessor ||
				updatedData instanceof EntityForRemovalAccessor ||
				updatedData instanceof EntityListAccessor
			) {
				return updateData(updatedData)
			}
			return this.rejectInvalidAccessorTree()
		}
		const entityData: EntityAccessor.EntityData = {}

		return (entityData[rootName] =
			Array.isArray(data) || data === undefined || data instanceof EntityListAccessor
				? this.generateEntityListAccessor(rootName, tree.fields, data, errorNode, onUpdate)
				: this.generateEntityAccessor(rootName, tree.fields, data, errorNode, onUpdate))
	}

	private updateFields(
		data: AccessorTreeGenerator.InitialEntityData,
		fields: EntityFields,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		onUpdate: OnUpdate,
		onReplace: OnReplace,
		addEventListener: AddEventListener,
		batchUpdates: BatchEntityUpdates,
		onUnlink?: OnUnlink,
	): EntityAccessor {
		const entityData: EntityAccessor.EntityData = {}
		const id = data ? (data instanceof Accessor ? data.primaryKey : data[PRIMARY_KEY_NAME]) : undefined
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
								referencePlaceholder,
								reference.fields,
								fieldData || undefined,
								referenceError,
								onUpdate,
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
								referencePlaceholder,
								reference.fields,
								fieldData,
								referenceError,
								onUpdate,
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
					const onChange = function(this: FieldAccessor, newValue: Scalar | GraphQlBuilder.Literal) {
						if (newValue === this.currentValue) {
							return
						}
						onUpdate(
							placeholderName,
							new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
								placeholderName,
								newValue,
								persistedValue,
								true,
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
						false,
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
		placeholderName: string,
		entityFields: EntityFields,
		persistedData: AccessorTreeGenerator.InitialEntityData,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		parentOnUpdate: OnUpdate,
		entityState: InternalEntityState = this.createEmptyEntityState(),
	): EntityAccessor {
		const performUpdate = () => {
			parentOnUpdate(placeholderName, entityState.accessor)
		}
		const onUpdateProxy = (newValue: EntityAccessor | EntityForRemovalAccessor | undefined) => {
			batchUpdates(getAccessor => {
				let latestData: EntityAccessor.FieldData = (entityState.accessor = newValue)

				if (
					entityState.eventListeners.beforeUpdate === undefined ||
					entityState.eventListeners.beforeUpdate.size === 0
				) {
					return
				}

				// If the listeners mutate the sub-tree, other listeners may want to respond to that, which in turn may trigger
				// further responses, etc. We don't want the order of addition of event listeners to matter and we don't have
				// the necessary information to perform some sort of a topological sort. We wouldn't want to do that anyway
				// though.

				// To get around all this, we just trigger all event listeners repeatedly until things settle and they stop
				// mutating the entity. If, however, that doesn't happen until some number of iterations (I think the limit
				// is actually fairly generous), we conclude that there is an infinite feedback loop and just shut things down.

				// Notice also that we effectively shift the responsibility to check whether an update concerns them to the
				// listeners.
				for (let i = 0; i < 100; i++) {
					for (const listener of entityState.eventListeners.beforeUpdate) {
						listener(getAccessor)
					}
					if (entityState.accessor === latestData) {
						return
					}
					latestData = entityState.accessor
				}
				throw new BindingError(
					`EntityAccessor beforeUpdate event: maximum stabilization limit exceeded. ` +
						`This likely means an infinite feedback loop in your code.`,
				)
			})
		}
		const onUpdate: OnUpdate = (updatedField: FieldName, updatedData: EntityAccessor.FieldData) => {
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
		placeholderName: string,
		entityFields: EntityFields,
		fieldData: ReceivedEntityData<undefined>[] | EntityListAccessor | undefined,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		parentOnUpdate: OnUpdate,
		preferences: ReferenceMarker.ReferencePreferences = ReferenceMarker.defaultReferencePreferences[
			ExpectedEntityCount.PossiblyMany
		],
	): EntityListAccessor {
		if (errors && errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.NumberIndexed) {
			throw new BindingError(
				`The error tree structure does not correspond to the marker tree. This should never happen.`,
			)
		}

		let batchUpdateDepth = 0
		const childBatchUpdateDepths: number[] = []
		const updateAccessorInstance = () => {
			return (listAccessor = new EntityListAccessor(
				listAccessor.entities.slice(),
				listAccessor.errors,
				listAccessor.batchUpdates,
				listAccessor.addNew,
			))
		}
		const performUpdate = () => {
			parentOnUpdate(placeholderName, updateAccessorInstance())
		}
		const batchUpdates: BatchEntityListUpdates = performUpdates => {
			batchUpdateDepth++
			const accessorBeforeUpdates = listAccessor
			performUpdates(() => listAccessor)
			batchUpdateDepth--
			if (batchUpdateDepth === 0 && accessorBeforeUpdates !== listAccessor) {
				performUpdate()
			}
		}
		const onUpdateProxy = (i: number, newValue: EntityAccessor | EntityForRemovalAccessor | undefined) => {
			if (childBatchUpdateDepths[i] !== 0 && !(newValue instanceof EntityAccessor)) {
				throw new BindingError(`Removing entities while they are being batch updated is a no-op.`)
			}
			listAccessor.entities[i] = newValue

			if (childBatchUpdateDepths[i] !== 0 || batchUpdateDepth !== 0) {
				updateAccessorInstance()
			} else {
				performUpdate()
			}
		}
		const addEventListener = () => {
			throw new BindingError(
				`TODO: Not implemented. Entity events currently only work for hasOne relations, ` +
					`and not directly within collections.`,
			)
		}
		const generateNewAccessor = (datum: AccessorTreeGenerator.InitialEntityData, i: number): EntityAccessor => {
			const childErrors = errors && i in errors.children ? errors.children[i] : undefined
			const onUpdate = (updatedField: FieldName, updatedData: EntityAccessor.FieldData) => {
				const entityAccessor = listAccessor.entities[i]
				if (entityAccessor instanceof EntityAccessor) {
					onUpdateProxy(i, this.withUpdatedField(entityAccessor, updatedField, updatedData))
				} else if (entityAccessor instanceof EntityForRemovalAccessor) {
					throw new BindingError(`Updating entities for removal is currently not supported.`)
				}
			}
			const batchUpdates: BatchEntityUpdates = performUpdates => {
				const accessorBeforeUpdates = listAccessor.entities[i]
				childBatchUpdateDepths[i]++
				performUpdates(() => {
					const accessor = listAccessor.entities[i]
					if (accessor instanceof EntityAccessor) {
						return accessor
					}
					throw new BindingError(`The entity that was being batch-updated somehow got deleted which was a no-op.`)
				})
				childBatchUpdateDepths[i]--

				if (childBatchUpdateDepths[i] === 0 && accessorBeforeUpdates !== listAccessor.entities[i]) {
					performUpdate()
				}
			}
			const onReplace: OnReplace = replacement => {
				const entityAccessor = listAccessor.entities[i]
				if (entityAccessor instanceof EntityAccessor || entityAccessor instanceof EntityForRemovalAccessor) {
					return onUpdateProxy(i, this.asDifferentEntity(entityAccessor, replacement, onRemove))
				}
				return this.rejectInvalidAccessorTree()
			}
			const onRemove = (removalType: RemovalType) => {
				onUpdateProxy(i, this.removeEntity(sourceData[i], listAccessor.entities[i], removalType))
			}

			childBatchUpdateDepths[i] = 0
			return this.updateFields(
				datum,
				entityFields,
				childErrors,
				onUpdate,
				onReplace,
				addEventListener,
				batchUpdates,
				onRemove,
			)
		}
		let listAccessor = new EntityListAccessor([], errors ? errors.errors : [], batchUpdates, newEntity => {
			const newEntityIndex = listAccessor.entities.length
			const newAccessor = generateNewAccessor(typeof newEntity === 'function' ? undefined : newEntity, newEntityIndex)

			if (typeof newEntity === 'function') {
				listAccessor.batchUpdates(getAccessor => {
					onUpdateProxy(newEntityIndex, newAccessor)
					newEntity(getAccessor, newEntityIndex)
				})
			} else {
				onUpdateProxy(newEntityIndex, newAccessor)
			}
		})

		let sourceData = fieldData instanceof EntityListAccessor ? fieldData.entities : fieldData || [undefined]
		if (
			sourceData.length === 0 ||
			sourceData.every(
				(datum: ReceivedEntityData<undefined> | EntityAccessor | EntityForRemovalAccessor | undefined) =>
					datum === undefined,
			)
		) {
			sourceData = Array(preferences.initialEntityCount).map(() => undefined)
		}

		for (let i = 0, len = sourceData.length; i < len; i++) {
			// If fieldData is an accessor, we've already submitted. In that case, an undefined in the entities array
			// signifies a "hole" after a previously removed entity. We don't want to create a new accessor for it.
			listAccessor.entities.push(
				fieldData instanceof EntityListAccessor && sourceData[i] === undefined
					? undefined
					: generateNewAccessor(sourceData[i], i),
			)
			childBatchUpdateDepths.push(0)
		}

		return listAccessor
	}

	private withUpdatedField(
		original: EntityAccessor,
		fieldPlaceholder: string,
		newData: EntityAccessor.FieldData,
	): EntityAccessor {
		return new EntityAccessor(
			original.primaryKey,
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
			replacement.primaryKey,
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
