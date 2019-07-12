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
		const data = initialData === undefined ? undefined : initialData
		const errorNode = errors === undefined ? undefined : errors[tree.id]

		if (Array.isArray(data) || data === undefined || data instanceof EntityCollectionAccessor) {
			const createAccessorTreeRoot = (): AccessorTreeRoot => {
				// TODO, proper addNew callback
				return new AccessorTreeRoot(
					tree,
					new EntityCollectionAccessor(entityAccessors, errorNode ? errorNode.errors : [], () => {
						entityAccessors.push(createEntityAccessor(undefined, entityAccessors.length))
						updateData(createAccessorTreeRoot())
					}),
					tree.entityName
				)
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
							entityAccessors[i] = this.withUpdatedField(entityAccessor, fieldName, newData)
							updateData(createAccessorTreeRoot())
						}
					},
					newEntityAccessor => {
						entityAccessors[i] = newEntityAccessor

						updateData(createAccessorTreeRoot())
					},
					(removalType: EntityAccessor.RemovalType) => {
						const entityAccessor = entityAccessors[i]

						if (entityAccessor) {
							const primaryKey = entityAccessor.primaryKey
							if (typeof primaryKey === 'string') {
								entityAccessors[i] = new EntityForRemovalAccessor(
									primaryKey,
									entityAccessor.typename,
									entityAccessor.data,
									entityAccessor.errors,
									entityAccessor.replaceWith,
									removalType
								)
							} else {
								entityAccessors[i] = undefined
							}

							updateData(createAccessorTreeRoot())
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
			const createAccessorTreeRoot = (): AccessorTreeRoot => new AccessorTreeRoot(tree, entityAccessor, tree.entityName)
			let entityAccessor: EntityAccessor | EntityForRemovalAccessor = this.updateFields(
				data,
				tree.fields,
				errorNode,
				(fieldName, newData) => {
					if (entityAccessor instanceof EntityAccessor) {
						entityAccessor = this.withUpdatedField(entityAccessor, fieldName, newData)

						updateData(createAccessorTreeRoot())
					}
				},
				newEntityAccessor => {
					entityAccessor = newEntityAccessor

					updateData(createAccessorTreeRoot())
				},
				(removalType: EntityAccessor.RemovalType) => {
					if (typeof entityAccessor.primaryKey === 'string') {
						entityAccessor = new EntityForRemovalAccessor(
							entityAccessor.primaryKey,
							entityAccessor.typename,
							entityAccessor.data,
							entityAccessor.errors,
							entityAccessor.replaceWith,
							removalType
						)
						updateData(createAccessorTreeRoot())
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
		const onRemove = (removalType: EntityAccessor.RemovalType) => {
			onUpdate(
				reference.placeholderName,
				(entityData[reference.placeholderName] = this.removeEntity(entityData[reference.placeholderName], removalType))
			)
		}
		return this.updateFields(
			fieldData,
			reference.fields,
			errors,
			(updatedField: FieldName, updatedData: EntityData.FieldData) => {
				const entityAccessor = entityData[reference.placeholderName]
				if (entityAccessor instanceof EntityAccessor) {
					onUpdate(
						reference.placeholderName,
						(entityData[reference.placeholderName] = this.withUpdatedField(entityAccessor, updatedField, updatedData))
					)
				}
			},
			replacement => {
				const entityAccessor = entityData[reference.placeholderName]
				if (entityAccessor instanceof EntityAccessor || entityAccessor instanceof EntityForRemovalAccessor) {
					onUpdate(
						reference.placeholderName,
						(entityData[reference.placeholderName] = this.asDifferentEntity(entityAccessor, replacement, onRemove))
					)
				}
			},
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

		const update = () => {
			onUpdate(
				reference.placeholderName,
				(collectionAccessor = new EntityCollectionAccessor(
					collectionAccessor.entities,
					collectionAccessor.errors,
					collectionAccessor.addNew
				))
			)
		}
		const getOnRemove = (i: number) => (removalType: EntityAccessor.RemovalType) => {
			collectionAccessor.entities[i] = this.removeEntity(collectionAccessor.entities[i], removalType)
			update()
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
						collectionAccessor.entities[i] = this.withUpdatedField(entityAccessor, updatedField, updatedData)
						update()
					}
				},
				replacement => {
					const entityAccessor = collectionAccessor.entities[i]
					if (entityAccessor instanceof EntityAccessor || entityAccessor instanceof EntityForRemovalAccessor) {
						collectionAccessor.entities[i] = this.asDifferentEntity(entityAccessor, replacement, onRemove)
						update()
					}
				},
				onRemove
			)
		}
		let collectionAccessor = new EntityCollectionAccessor([], errors ? errors.errors : [], () => {
			collectionAccessor.entities.push(generateNewAccessor(undefined, collectionAccessor.entities.length))
			update()
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
