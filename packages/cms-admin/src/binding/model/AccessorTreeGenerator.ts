import { GraphQlBuilder } from 'cms-client'
import { assertNever } from 'cms-common'
import {
	FieldName,
	MutationRequestResult,
	PRIMARY_KEY_NAME,
	ReceivedData,
	ReceivedDataTree,
	ReceivedEntityData,
	Scalar,
	TYPENAME_KEY_NAME
} from '../bindingTypes'
import {
	Accessor,
	AccessorTreeRoot,
	ConnectionMarker,
	DataBindingError,
	EntityAccessor,
	EntityCollectionAccessor,
	EntityData,
	EntityFields,
	EntityForRemovalAccessor,
	FieldAccessor,
	FieldMarker,
	MarkerTreeRoot,
	ReferenceMarker,
	RootAccessor
} from '../dao'
import { ErrorsPreprocessor } from './ErrorsPreprocessor'

type OnUpdate = (updatedField: FieldName, updatedData: EntityData.FieldData) => void
type OnReplace = EntityAccessor['replaceWith']
type OnUnlink = EntityAccessor['remove']
type BatchEntityUpdates = EntityAccessor['batchUpdates']
type BatchEntityCollectionUpdates = EntityCollectionAccessor['batchUpdates']

class AccessorTreeGenerator {
	private persistedData: ReceivedDataTree<undefined> | undefined
	private initialData: AccessorTreeRoot | ReceivedDataTree<undefined> | undefined
	private errorTreeRoot?: ErrorsPreprocessor.ErrorTreeRoot

	public constructor(private tree: MarkerTreeRoot) {}

	public generateLiveTree(
		persistedData: ReceivedDataTree<undefined> | undefined,
		initialData: AccessorTreeRoot | ReceivedDataTree<undefined> | undefined,
		updateData: AccessorTreeGenerator.UpdateData,
		errors?: MutationRequestResult
	): void {
		const preprocessor = new ErrorsPreprocessor(errors)

		this.errorTreeRoot = preprocessor.preprocess()
		console.log(this.errorTreeRoot, errors)

		this.persistedData = persistedData
		this.initialData = initialData

		updateData(
			this.generateSubTree(
				this.tree,
				initialData instanceof AccessorTreeRoot
					? initialData.root
					: initialData === undefined
					? undefined
					: initialData[this.tree.id],
				updateData,
				this.errorTreeRoot
			)
		)
	}

	private generateSubTree(
		tree: MarkerTreeRoot,
		initialData: ReceivedData<undefined> | RootAccessor,
		updateData: AccessorTreeGenerator.UpdateData,
		errors?: ErrorsPreprocessor.ErrorTreeRoot
	): AccessorTreeRoot {
		let inBatchUpdateMode = false
		let createAccessorTreeRoot: () => AccessorTreeRoot
		const data = initialData === undefined ? undefined : initialData
		const errorNode = errors === undefined ? undefined : errors[tree.id]
		const performUpdate = () => {
			updateData(createAccessorTreeRoot())
		}

		if (Array.isArray(data) || data === undefined || data instanceof EntityCollectionAccessor) {
			createAccessorTreeRoot = (): AccessorTreeRoot => {
				return new AccessorTreeRoot(
					tree,
					new EntityCollectionAccessor(
						entityAccessors,
						errorNode ? errorNode.errors : [],
						() => {}, // TODO proper batching
						newEntity => {
							entityAccessors.push(createEntityAccessor(newEntity, entityAccessors.length))
							updateData(createAccessorTreeRoot())
						}
					),
					tree.entityName
				)
			}
			const onUpdateProxy = (i: number, newValue: EntityAccessor | EntityForRemovalAccessor | undefined) => {
				entityAccessors[i] = newValue

				if (!inBatchUpdateMode) {
					performUpdate()
				}
			}
			const createEntityAccessor = (datum: AccessorTreeGenerator.InitialEntityData, i: number): EntityAccessor =>
				this.updateFields(
					datum,
					tree.fields,
					errorNode && errorNode.nodeType === ErrorsPreprocessor.ErrorNodeType.NumberIndexed && i in errorNode.children
						? errorNode.children[i]
						: undefined,
					(fieldName, newData) => {
						const entityAccessor = entityAccessors[i]
						if (entityAccessor instanceof EntityAccessor) {
							onUpdateProxy(i, this.withUpdatedField(entityAccessor, fieldName, newData))
						}
					},
					newEntityAccessor => {
						onUpdateProxy(i, newEntityAccessor)
					},
					() => {}, // TODO proper batching
					(removalType: EntityAccessor.RemovalType) => {
						const entityAccessor = entityAccessors[i]

						if (entityAccessor) {
							const primaryKey = entityAccessor.primaryKey
							onUpdateProxy(
								i,
								typeof primaryKey === 'string'
									? new EntityForRemovalAccessor(
											primaryKey,
											entityAccessor.typename,
											entityAccessor.data,
											entityAccessor.errors,
											entityAccessor.replaceWith,
											removalType
									  )
									: undefined
							)
						}
					}
				)
			let entityAccessors: Array<EntityAccessor | EntityForRemovalAccessor | undefined>

			if (data instanceof EntityCollectionAccessor) {
				entityAccessors = data.entities.map(createEntityAccessor)
			} else {
				entityAccessors = (data || [undefined]).map(createEntityAccessor)
			}

			return createAccessorTreeRoot()
		} else {
			createAccessorTreeRoot = (): AccessorTreeRoot => new AccessorTreeRoot(tree, entityAccessor, tree.entityName)
			const onUpdateProxy = (newValue: EntityAccessor | EntityForRemovalAccessor) => {
				entityAccessor = newValue

				if (!inBatchUpdateMode) {
					performUpdate()
				}
			}
			const batchUpdates = (): BatchEntityUpdates => performUpdates => {
				inBatchUpdateMode = true
				performUpdates(() => entityAccessor)
				inBatchUpdateMode = false
				performUpdate()
			}
			let entityAccessor: EntityAccessor | EntityForRemovalAccessor = this.updateFields(
				data,
				tree.fields,
				errorNode,
				(fieldName, newData) => {
					if (entityAccessor instanceof EntityAccessor) {
						onUpdateProxy(this.withUpdatedField(entityAccessor, fieldName, newData))
					}
				},
				newEntityAccessor => {
					onUpdateProxy(newEntityAccessor)
				},
				batchUpdates,
				(removalType: EntityAccessor.RemovalType) => {
					if (typeof entityAccessor.primaryKey === 'string') {
						onUpdateProxy(
							new EntityForRemovalAccessor(
								entityAccessor.primaryKey,
								entityAccessor.typename,
								entityAccessor.data,
								entityAccessor.errors,
								entityAccessor.replaceWith,
								removalType
							)
						)
					}
				}
			)
			return createAccessorTreeRoot()
		}
	}

	private updateFields(
		data: AccessorTreeGenerator.InitialEntityData,
		fields: EntityFields,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		onUpdate: OnUpdate,
		onReplace: OnReplace,
		batchUpdates: BatchEntityUpdates,
		onUnlink?: OnUnlink
	): EntityAccessor {
		const entityData: EntityData.EntityData = {}
		const id = data ? (data instanceof Accessor ? data.primaryKey : data[PRIMARY_KEY_NAME]) : undefined
		const typename = data ? (data instanceof Accessor ? data.typename : data[TYPENAME_KEY_NAME]) : undefined

		for (const placeholderName in fields) {
			if (placeholderName === PRIMARY_KEY_NAME) {
				continue
			}

			const field = fields[placeholderName]

			if (field instanceof MarkerTreeRoot) {
				entityData[placeholderName] = this.generateSubTree(
					field,
					this.initialData instanceof AccessorTreeRoot
						? this.persistedData === undefined
							? undefined
							: this.persistedData[field.id]
						: this.initialData === undefined
						? undefined
						: this.initialData[field.id],
					() => undefined
				)
			} else if (field instanceof ReferenceMarker) {
				for (const referencePlaceholder in field.references) {
					const reference = field.references[referencePlaceholder]
					const fieldData = data
						? data instanceof Accessor
							? data.data.getField(referencePlaceholder)
							: data[referencePlaceholder]
						: undefined

					if (fieldData instanceof FieldAccessor || fieldData instanceof AccessorTreeRoot) {
						throw new DataBindingError(
							`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`
						)
					}

					const referenceError =
						errors &&
						errors.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed &&
						field.fieldName in errors.children
							? errors.children[field.fieldName]
							: undefined

					if (reference.expectedCount === ReferenceMarker.ExpectedCount.UpToOne) {
						if (Array.isArray(fieldData) || fieldData instanceof EntityCollectionAccessor) {
							throw new DataBindingError(
								`Received a collection of entities for field '${
									field.fieldName
								}' where a single entity was expected. ` + `Perhaps you wanted to use a <Repeater />?`
							)
						} else if (
							!(fieldData instanceof FieldAccessor) &&
							(fieldData === null || typeof fieldData === 'object' || fieldData === undefined)
						) {
							entityData[referencePlaceholder] = this.generateOneReference(
								fieldData || undefined,
								reference,
								referenceError,
								onUpdate,
								entityData
							)
						} else {
							throw new DataBindingError(
								`Received a scalar value for field '${field.fieldName}' where a single entity was expected.` +
									`Perhaps you meant to use a variant of <Field />?`
							)
						}
					} else if (reference.expectedCount === ReferenceMarker.ExpectedCount.PossiblyMany) {
						if (fieldData === undefined) {
							entityData[referencePlaceholder] = this.generateManyReference(
								undefined,
								reference,
								referenceError,
								onUpdate
							)
						} else if (Array.isArray(fieldData) || fieldData instanceof EntityCollectionAccessor) {
							entityData[referencePlaceholder] = this.generateManyReference(
								fieldData,
								reference,
								referenceError,
								onUpdate
							)
						} else if (typeof fieldData === 'object') {
							// Intentionally allowing `fieldData === null` here as well since this should only happen when a *hasOne
							// relation is unlinked, e.g. a Person does not have a linked Nationality.
							throw new DataBindingError(
								`Received a referenced entity for field '${
									field.fieldName
								}' where a collection of entities was expected.` + `Perhaps you wanted to use a <SingleReference />?`
							)
						} else {
							throw new DataBindingError(
								`Received a scalar value for field '${field.fieldName}' where a collection of entities was expected.` +
									`Perhaps you meant to use a variant of <Field />?`
							)
						}
					} else {
						return assertNever(reference.expectedCount)
					}
				}
			} else if (field instanceof FieldMarker) {
				const fieldData = data
					? data instanceof Accessor
						? data.data.getField(placeholderName)
						: data[placeholderName]
					: undefined
				if (
					fieldData instanceof AccessorTreeRoot ||
					fieldData instanceof EntityCollectionAccessor ||
					fieldData instanceof EntityAccessor ||
					fieldData instanceof EntityForRemovalAccessor
				) {
					throw new DataBindingError(
						`The accessor tree does not correspond to the MarkerTree. This should absolutely never happen.`
					)
				} else if (Array.isArray(fieldData)) {
					throw new DataBindingError(
						`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use a <Repeater />?`
					)
				} else if (!(fieldData instanceof FieldAccessor) && typeof fieldData === 'object' && fieldData !== null) {
					throw new DataBindingError(
						`Received a referenced entity where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use a <SingleReference />?`
					)
				} else {
					const fieldErrors =
						errors &&
						errors.nodeType === ErrorsPreprocessor.ErrorNodeType.FieldIndexed &&
						field.fieldName in errors.children
							? errors.children[field.fieldName].errors
							: []
					const onChange = (newValue: Scalar | GraphQlBuilder.Literal) => {
						onUpdate(
							placeholderName,
							new FieldAccessor<Scalar | GraphQlBuilder.Literal>(placeholderName, newValue, fieldErrors, onChange)
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
						fieldErrors,
						onChange
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
			new EntityData(entityData),
			errors ? errors.errors : [],
			onReplace,
			batchUpdates,
			onUnlink
		)
	}

	private generateOneReference(
		fieldData: AccessorTreeGenerator.InitialEntityData,
		reference: ReferenceMarker.Reference,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		onUpdate: OnUpdate,
		entityData: EntityData.EntityData
	): EntityAccessor {
		let inBatchUpdateMode = false
		const performUpdate = () => {
			onUpdate(reference.placeholderName, entityData[reference.placeholderName])
		}
		const onUpdateProxy = (newValue: EntityData.FieldData) => {
			entityData[reference.placeholderName] = newValue

			if (!inBatchUpdateMode) {
				performUpdate()
			}
		}
		const onRemove = (removalType: EntityAccessor.RemovalType) => {
			onUpdateProxy(this.removeEntity(entityData[reference.placeholderName], removalType))
		}
		const batchUpdates = (): BatchEntityUpdates => performUpdates => {
			inBatchUpdateMode = true
			performUpdates(() => entityData[reference.placeholderName] as EntityAccessor) // TODO add checks
			inBatchUpdateMode = false
			performUpdate()
		}
		return this.updateFields(
			fieldData,
			reference.fields,
			errors,
			(updatedField: FieldName, updatedData: EntityData.FieldData) => {
				const entityAccessor = entityData[reference.placeholderName]
				if (entityAccessor instanceof EntityAccessor) {
					onUpdateProxy(this.withUpdatedField(entityAccessor, updatedField, updatedData))
				}
			},
			replacement => {
				const entityAccessor = entityData[reference.placeholderName]
				if (entityAccessor instanceof EntityAccessor || entityAccessor instanceof EntityForRemovalAccessor) {
					onUpdateProxy(this.asDifferentEntity(entityAccessor, replacement, onRemove))
				}
			},
			batchUpdates,
			onRemove
		)
	}

	private generateManyReference(
		fieldData: Array<ReceivedEntityData<undefined>> | EntityCollectionAccessor | undefined,
		reference: ReferenceMarker.Reference,
		errors: ErrorsPreprocessor.ErrorNode | undefined,
		onUpdate: OnUpdate
	): EntityCollectionAccessor {
		if (errors && errors.nodeType !== ErrorsPreprocessor.ErrorNodeType.NumberIndexed) {
			throw new DataBindingError(
				`The error tree structure does not correspond to the marker tree. This should never happen.`
			)
		}

		let inBatchUpdateMode = false
		const performUpdate = () => {
			onUpdate(reference.placeholderName, collectionAccessor)
		}
		const batchUpdates = (): BatchEntityCollectionUpdates => performUpdates => {
			inBatchUpdateMode = true
			performUpdates(() => collectionAccessor)
			inBatchUpdateMode = false
			performUpdate()
		}
		const onUpdateProxy = (i: number, newValue: EntityAccessor | EntityForRemovalAccessor | undefined) => {
			collectionAccessor = new EntityCollectionAccessor(
				collectionAccessor.entities,
				collectionAccessor.errors,
				collectionAccessor.batchUpdates,
				collectionAccessor.addNew
			)
			collectionAccessor.entities[i] = newValue

			if (!inBatchUpdateMode) {
				performUpdate()
			}
		}
		const getSingleEntityBatchUpdates = (i: number) => (): BatchEntityUpdates => {
			if (inBatchUpdateMode) {
				return undefined
			}
			return performUpdates => {
				inBatchUpdateMode = true
				performUpdates(() => collectionAccessor.entities[i] as EntityAccessor) // TODO add checks
				inBatchUpdateMode = false
				performUpdate()
			}
		}
		const getOnRemove = (i: number) => (removalType: EntityAccessor.RemovalType) => {
			onUpdateProxy(i, this.removeEntity(collectionAccessor.entities[i], removalType))
		}
		const generateNewAccessor = (datum: AccessorTreeGenerator.InitialEntityData, i: number): EntityAccessor => {
			const onRemove = getOnRemove(i)
			return this.updateFields(
				datum,
				reference.fields,
				errors && i in errors.children ? errors.children[i] : undefined,
				(updatedField: FieldName, updatedData: EntityData.FieldData) => {
					const entityAccessor = collectionAccessor.entities[i]
					if (entityAccessor instanceof EntityAccessor) {
						onUpdateProxy(i, this.withUpdatedField(entityAccessor, updatedField, updatedData))
					}
				},
				replacement => {
					const entityAccessor = collectionAccessor.entities[i]
					if (entityAccessor instanceof EntityAccessor || entityAccessor instanceof EntityForRemovalAccessor) {
						onUpdateProxy(i, this.asDifferentEntity(entityAccessor, replacement, onRemove))
					}
				},
				getSingleEntityBatchUpdates(i),
				onRemove
			)
		}
		let collectionAccessor = new EntityCollectionAccessor([], errors ? errors.errors : [], batchUpdates, newEntity => {
			collectionAccessor.entities.push(generateNewAccessor(newEntity, collectionAccessor.entities.length))
			performUpdate()
		})

		let sourceData = fieldData instanceof EntityCollectionAccessor ? fieldData.entities : fieldData || [undefined]
		if (sourceData.length === 0) {
			sourceData = [undefined]
		}

		for (let i = 0, len = sourceData.length; i < len; i++) {
			collectionAccessor.entities.push(generateNewAccessor(sourceData[i], i))
		}

		return collectionAccessor
	}

	private withUpdatedField(
		original: EntityAccessor,
		fieldPlaceholder: string,
		newData: EntityData.FieldData
	): EntityAccessor {
		return new EntityAccessor(
			original.primaryKey,
			original.typename,
			new EntityData({
				...original.data.allFieldData,
				[fieldPlaceholder]: newData
			}),
			original.errors,
			original.replaceWith,
			original.batchUpdates,
			original.remove
		)
	}

	private asDifferentEntity(
		original: EntityAccessor,
		replacement: EntityAccessor,
		onRemove?: EntityAccessor['remove']
	): EntityAccessor {
		// TODO: we also need to update the callbacks inside replacement.data
		return new EntityAccessor(
			replacement.primaryKey,
			original.typename,
			replacement.data,
			original.errors,
			original.replaceWith,
			original.batchUpdates,
			onRemove || original.remove
		)
	}

	private removeEntity(
		currentEntity: EntityData.FieldData,
		removalType: EntityAccessor.RemovalType
	): EntityForRemovalAccessor | undefined {
		if (currentEntity instanceof EntityAccessor) {
			const id = currentEntity.primaryKey

			if (typeof id === 'string') {
				return new EntityForRemovalAccessor(
					id,
					currentEntity.typename,
					currentEntity.data,
					currentEntity.errors,
					currentEntity.replaceWith,
					removalType
				)
			}
		}
		return undefined
	}
}

namespace AccessorTreeGenerator {
	export type UpdateData = (newData?: AccessorTreeRoot) => void

	export type InitialEntityData = ReceivedEntityData<undefined> | EntityAccessor | EntityForRemovalAccessor
}

export { AccessorTreeGenerator }
