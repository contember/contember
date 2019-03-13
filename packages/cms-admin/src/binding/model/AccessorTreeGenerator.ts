import { GraphQlBuilder } from 'cms-client'
import { assertNever } from 'cms-common'
import { FieldName, PRIMARY_KEY_NAME, ReceivedData, ReceivedEntityData, Scalar } from '../bindingTypes'
import {
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
	ReferenceMarker
} from '../dao'

type OnUpdate = (updatedField: FieldName, updatedData: EntityData.FieldData) => void
type OnReplace = EntityAccessor['replaceWith']
type OnUnlink = EntityAccessor['remove']

export class AccessorTreeGenerator {
	public constructor(private tree: MarkerTreeRoot, private allInitialData: any) {}

	public generateLiveTree(updateData: (newData?: AccessorTreeRoot) => void): void {
		updateData(this.generateSubTree(this.tree, updateData))
	}

	private generateSubTree(tree: MarkerTreeRoot, updateData: (newData?: AccessorTreeRoot) => void): AccessorTreeRoot {
		const data: ReceivedData<undefined> | undefined =
			this.allInitialData === undefined ? undefined : this.allInitialData[tree.id]

		if (Array.isArray(data) || data === undefined) {
			const createAccessorTreeRoot = (): AccessorTreeRoot => {
				// TODO, proper addNew callback
				return new AccessorTreeRoot(
					tree,
					new EntityCollectionAccessor(entityAccessors, () => {
						entityAccessors.push(createEntityAccessor(entityAccessors.length, undefined))
						updateData(createAccessorTreeRoot())
					}),
					tree.entityName
				)
			}
			const createEntityAccessor = (i: number, datum: ReceivedEntityData<undefined>): EntityAccessor =>
				this.updateFields(
					datum,
					tree.fields,
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
			const entityAccessors: Array<EntityAccessor | EntityForRemovalAccessor | undefined> = (data && data.length
				? data
				: [undefined]
			).map((datum, i) => createEntityAccessor(i, datum))
			return createAccessorTreeRoot()
		} else {
			const createAccessorTreeRoot = (): AccessorTreeRoot => new AccessorTreeRoot(tree, entityAccessor, tree.entityName)
			let entityAccessor: EntityAccessor | EntityForRemovalAccessor = this.updateFields(
				data,
				tree.fields,
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
		data: ReceivedEntityData<undefined>,
		fields: EntityFields,
		onUpdate: OnUpdate,
		onReplace: OnReplace,
		onUnlink?: OnUnlink
	): EntityAccessor {
		const entityData: EntityData.EntityData = {}
		const id = data ? data[PRIMARY_KEY_NAME] : undefined
		const typename = data ? data['__typename'] : undefined

		for (const placeholderName in fields) {
			if (placeholderName === PRIMARY_KEY_NAME) {
				continue
			}

			const field = fields[placeholderName]

			if (field instanceof MarkerTreeRoot) {
				entityData[placeholderName] = this.generateSubTree(field, () => undefined)
			} else if (field instanceof ReferenceMarker) {
				for (const referencePlaceholder in field.references) {
					const reference = field.references[referencePlaceholder]
					const fieldData = data ? data[referencePlaceholder] : undefined

					if (reference.expectedCount === ReferenceMarker.ExpectedCount.UpToOne) {
						if (Array.isArray(fieldData)) {
							throw new DataBindingError(
								`Received a collection of entities for field '${
									field.fieldName
								}' where a single entity was expected. ` + `Perhaps you wanted to use a <Repeater />?`
							)
						} else if (fieldData === null || typeof fieldData === 'object' || fieldData === undefined) {
							entityData[referencePlaceholder] = this.generateOneReference(
								fieldData || undefined,
								reference,
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
							entityData[referencePlaceholder] = this.generateManyReference(undefined, reference, onUpdate)
						} else if (Array.isArray(fieldData)) {
							entityData[referencePlaceholder] = this.generateManyReference(
								fieldData.length === 0 ? undefined : fieldData,
								reference,
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
				const fieldData = data ? data[placeholderName] : undefined
				if (Array.isArray(fieldData)) {
					throw new DataBindingError(
						`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use a <Repeater />?`
					)
				} else if (typeof fieldData === 'object' && fieldData !== null) {
					throw new DataBindingError(
						`Received a referenced entity where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use a <SingleReference />?`
					)
				} else {
					const onChange = (newValue: Scalar | GraphQlBuilder.Literal) => {
						onUpdate(
							placeholderName,
							new FieldAccessor<Scalar | GraphQlBuilder.Literal>(placeholderName, newValue, onChange)
						)
					}
					// `fieldData` will be `undefined` when a repeater creates a clone based on no data or when we're creating
					// a new entity
					entityData[placeholderName] = new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
						placeholderName,
						fieldData === undefined ? field.defaultValue || null : fieldData,
						onChange
					)
				}
			} else {
				assertNever(field)
			}
		}

		return new EntityAccessor(id, typename, new EntityData(entityData), onReplace, onUnlink)
	}

	private generateOneReference(
		fieldData: ReceivedEntityData<undefined>,
		reference: ReferenceMarker.Reference,
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
		fieldData: Array<ReceivedEntityData<undefined>> | undefined,
		reference: ReferenceMarker.Reference,
		onUpdate: OnUpdate
	): EntityCollectionAccessor {
		const update = () => {
			onUpdate(
				reference.placeholderName,
				(collectionAccessor = new EntityCollectionAccessor(collectionAccessor.entities, collectionAccessor.addNew))
			)
		}
		const getOnRemove = (i: number) => (removalType: EntityAccessor.RemovalType) => {
			collectionAccessor.entities[i] = this.removeEntity(collectionAccessor.entities[i], removalType)
			update()
		}
		const generateNewAccessor = (i: number): EntityAccessor => {
			const onRemove = getOnRemove(i)
			return this.updateFields(
				Array.isArray(fieldData) ? fieldData[i] : undefined,
				reference.fields,
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
		let collectionAccessor = new EntityCollectionAccessor([], () => {
			collectionAccessor.entities.push(generateNewAccessor(collectionAccessor.entities.length))
			update()
		})

		if (!Array.isArray(fieldData)) {
			fieldData = [fieldData]
		}
		for (let i = 0, len = fieldData.length; i < len; i++) {
			collectionAccessor.entities.push(generateNewAccessor(i))
		}

		return collectionAccessor
	}

	private withUpdatedField(
		original: EntityAccessor,
		fieldPlaceholder: string,
		newData: EntityData.FieldData
	): EntityAccessor {
		return new EntityAccessor(original.primaryKey, original.typename, new EntityData({
			...original.data.allFieldData,
			[fieldPlaceholder]: newData
		}), original.replaceWith, original.remove)
	}

	private asDifferentEntity(
		original: EntityAccessor,
		replacement: EntityAccessor,
		onRemove?: EntityAccessor['remove']
	): EntityAccessor {
		// TODO: we also need to update the callbacks inside replacement.data
		return new EntityAccessor(replacement.primaryKey, original.typename, replacement.data, original.replaceWith, onRemove || original.remove)
	}

	private removeEntity(
		currentEntity: EntityData.FieldData,
		removalType: EntityAccessor.RemovalType
	): EntityForRemovalAccessor | undefined {
		if (currentEntity instanceof EntityAccessor) {
			const id = currentEntity.primaryKey

			if (typeof id === 'string') {
				return new EntityForRemovalAccessor(id, currentEntity.typename, currentEntity.data, currentEntity.replaceWith, removalType)
			}
		}
		return undefined
	}
}
