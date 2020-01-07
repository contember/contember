import { GraphQlBuilder } from '@contember/client'
import { assertNever } from '../utils'
import { MutationDataResponse, ReceivedData, ReceivedDataTree, ReceivedEntityData } from '../accessorTree'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { DataBindingError } from '../dao'
import {
	Accessor,
	EntityAccessor,
	EntityForRemovalAccessor,
	EntityListAccessor,
	FieldAccessor,
	RootAccessor,
} from '../accessors'
import { ConnectionMarker, EntityFields, FieldMarker, MarkerTreeRoot, ReferenceMarker } from '../markers'
import { ExpectedEntityCount, FieldName, RemovalType, Scalar } from '../treeParameters'
import { ErrorsPreprocessor } from './ErrorsPreprocessor'

type OnUpdate = (updatedField: FieldName, updatedData: EntityAccessor.FieldData) => void
type OnReplace = EntityAccessor['replaceWith']
type OnUnlink = EntityAccessor['remove']
type BatchEntityUpdates = Exclude<EntityAccessor['batchUpdates'], undefined>
type BatchEntityListUpdates = Exclude<EntityListAccessor['batchUpdates'], undefined>

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
				: this.generateEntityAccessor(rootName, tree.fields, data, errorNode, onUpdate, entityData))
	}

	private updateFields(
		data: AccessorTreeGenerator.InitialEntityData,
		fields: EntityFields,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		onUpdate: OnUpdate,
		onReplace: OnReplace,
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
						throw new DataBindingError(
							`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`,
						)
					}

					const referenceError =
						errors && errors.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed
							? errors.children[field.fieldName] || errors.children[referencePlaceholder] || undefined
							: undefined

					if (reference.expectedCount === ExpectedEntityCount.UpToOne) {
						if (Array.isArray(fieldData) || fieldData instanceof EntityListAccessor) {
							throw new DataBindingError(
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
								entityData,
							)
						} else {
							throw new DataBindingError(
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
							throw new DataBindingError(
								`Received a referenced entity for field '${field.fieldName}' where a collection of entities was expected.` +
									`Perhaps you wanted to use a <SingleReference />?`,
							)
						} else {
							throw new DataBindingError(
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
					throw new DataBindingError(
						`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use a <Repeater />?`,
					)
				} else if (!(fieldData instanceof FieldAccessor) && typeof fieldData === 'object' && fieldData !== null) {
					throw new DataBindingError(
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
					const onChange = (newValue: Scalar | GraphQlBuilder.Literal) => {
						onUpdate(
							placeholderName,
							new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
								placeholderName,
								newValue,
								persistedValue,
								fieldErrors,
								onChange,
							),
						)
					}
					// `fieldData` will be `undefined` when a repeater creates a clone based on no data or when we're creating
					// a new entity
					entityData[placeholderName] = new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
						placeholderName,
						fieldData === undefined
							? field.defaultValue || null
							: fieldData instanceof FieldAccessor
							? fieldData.currentValue
							: fieldData,
						persistedValue,
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

		return new EntityAccessor(id, typename, entityData, errors ? errors.errors : [], onReplace, batchUpdates, onUnlink)
	}

	private generateEntityAccessor(
		placeholderName: string,
		entityFields: EntityFields,
		persistedData: AccessorTreeGenerator.InitialEntityData,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		parentOnUpdate: OnUpdate,
		entityData: EntityAccessor.EntityData,
	): EntityAccessor {
		let inBatchUpdateMode = false
		const performUpdate = () => {
			parentOnUpdate(placeholderName, entityData[placeholderName])
		}
		const onUpdateProxy = (newValue: EntityAccessor.FieldData) => {
			entityData[placeholderName] = newValue

			if (!inBatchUpdateMode) {
				performUpdate()
			}
		}
		const onUpdate: OnUpdate = (updatedField: FieldName, updatedData: EntityAccessor.FieldData) => {
			const entityAccessor = entityData[placeholderName]
			if (entityAccessor instanceof EntityAccessor) {
				return onUpdateProxy(this.withUpdatedField(entityAccessor, updatedField, updatedData))
			}
			return this.rejectInvalidAccessorTree()
		}
		const onReplace: OnReplace = replacement => {
			const entityAccessor = entityData[placeholderName]
			if (entityAccessor instanceof EntityAccessor || entityAccessor instanceof EntityForRemovalAccessor) {
				return onUpdateProxy(this.asDifferentEntity(entityAccessor, replacement, onRemove))
			}
			return this.rejectInvalidAccessorTree()
		}
		const onRemove = (removalType: RemovalType) => {
			onUpdateProxy(this.removeEntity(entityData[placeholderName], removalType))
		}
		const batchUpdates = (): BatchEntityUpdates => performUpdates => {
			inBatchUpdateMode = true
			const accessorBeforeUpdates = entityData[placeholderName]
			performUpdates(() => {
				const accessor = entityData[placeholderName]
				if (accessor instanceof EntityAccessor) {
					return accessor
				}
				throw new DataBindingError(`The entity that was being batch-updated somehow got deleted which was a no-op.`)
			})
			inBatchUpdateMode = false
			if (accessorBeforeUpdates !== entityData[placeholderName]) {
				performUpdate()
			}
		}
		return this.updateFields(persistedData, entityFields, errors, onUpdate, onReplace, batchUpdates, onRemove)
	}

	private generateEntityListAccessor(
		placeholderName: string,
		entityFields: EntityFields,
		fieldData: Array<ReceivedEntityData<undefined>> | EntityListAccessor | undefined,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		parentOnUpdate: OnUpdate,
		preferences: ReferenceMarker.ReferencePreferences = ReferenceMarker.defaultReferencePreferences[
			ExpectedEntityCount.PossiblyMany
		],
	): EntityListAccessor {
		if (errors && errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.NumberIndexed) {
			throw new DataBindingError(
				`The error tree structure does not correspond to the marker tree. This should never happen.`,
			)
		}

		let inBatchUpdateMode = false
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
			inBatchUpdateMode = true
			const accessorBeforeUpdates = listAccessor
			performUpdates(() => listAccessor)
			inBatchUpdateMode = false
			if (accessorBeforeUpdates !== listAccessor) {
				performUpdate()
			}
		}
		const onUpdateProxy = (i: number, newValue: EntityAccessor | EntityForRemovalAccessor | undefined) => {
			if (childInBatchUpdateMode[i] && !(newValue instanceof EntityAccessor)) {
				throw new DataBindingError(`Removing entities while they are being batch updated is a no-op.`)
			}
			listAccessor.entities[i] = newValue

			if (childInBatchUpdateMode[i] || inBatchUpdateMode) {
				updateAccessorInstance()
			} else {
				performUpdate()
			}
		}
		const generateNewAccessor = (datum: AccessorTreeGenerator.InitialEntityData, i: number): EntityAccessor => {
			const childErrors = errors && i in errors.children ? errors.children[i] : undefined
			const onUpdate = (updatedField: FieldName, updatedData: EntityAccessor.FieldData) => {
				const entityAccessor = listAccessor.entities[i]
				if (entityAccessor instanceof EntityAccessor) {
					onUpdateProxy(i, this.withUpdatedField(entityAccessor, updatedField, updatedData))
				} else if (entityAccessor instanceof EntityForRemovalAccessor) {
					throw new DataBindingError(`Updating entities for removal is currently not supported.`)
				}
			}
			const batchUpdates: BatchEntityUpdates = performUpdates => {
				const accessorBeforeUpdates = listAccessor.entities[i]
				childInBatchUpdateMode[i] = true
				performUpdates(() => {
					const accessor = listAccessor.entities[i]
					if (accessor instanceof EntityAccessor) {
						return accessor
					}
					throw new DataBindingError(`The entity that was being batch-updated somehow got deleted which was a no-op.`)
				})
				childInBatchUpdateMode[i] = false

				if (accessorBeforeUpdates !== listAccessor.entities[i]) {
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
				onUpdateProxy(i, this.removeEntity(listAccessor.entities[i], removalType))
			}

			childInBatchUpdateMode[i] = false
			return this.updateFields(datum, entityFields, childErrors, onUpdate, onReplace, batchUpdates, onRemove)
		}
		let listAccessor = new EntityListAccessor([], errors ? errors.errors : [], batchUpdates, newEntity => {
			const newEntityIndex = listAccessor.entities.length
			const newAccessor = generateNewAccessor(typeof newEntity === 'function' ? undefined : newEntity, newEntityIndex)

			if (typeof newEntity === 'function') {
				if (!listAccessor.batchUpdates) {
					throw new DataBindingError(`Internally inconsistent Accessor tree detected. This should never happen.`)
				}
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
		const childInBatchUpdateMode: boolean[] = []

		for (let i = 0, len = sourceData.length; i < len; i++) {
			listAccessor.entities.push(generateNewAccessor(sourceData[i], i))
			childInBatchUpdateMode.push(false)
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
			original.replaceWith,
			original.batchUpdates,
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
			blueprint.replaceWith,
			blueprint.batchUpdates,
			onRemove || blueprint.remove,
		)
	}

	private removeEntity(
		currentEntity: EntityAccessor.FieldData,
		removalType: RemovalType,
	): EntityForRemovalAccessor | undefined {
		if (currentEntity instanceof EntityAccessor) {
			const id = currentEntity.primaryKey

			if (typeof id === 'string') {
				return new EntityForRemovalAccessor(currentEntity, currentEntity.replaceWith, removalType)
			}
		}
		return undefined
	}

	private rejectInvalidAccessorTree(): never {
		throw new DataBindingError(
			`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`,
		)
	}
}

namespace AccessorTreeGenerator {
	export type UpdateData = (newData: RootAccessor) => void

	export type InitialEntityData = ReceivedEntityData<undefined> | EntityAccessor | EntityForRemovalAccessor
}

export { AccessorTreeGenerator }
