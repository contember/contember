import { assertNever } from 'cms-common'
import { FieldName, ReceivedData, ReceivedEntityData, Scalar } from '../bindingTypes'
import AccessorTreeRoot from '../dao/AccessorTreeRoot'
import DataBindingError from '../dao/DataBindingError'
import EntityAccessor from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import EntityData from '../dao/EntityData'
import EntityFields from '../dao/EntityFields'
import EntityForRemovalAccessor from '../dao/EntityForRemovalAccessor'
import FieldAccessor from '../dao/FieldAccessor'
import FieldMarker from '../dao/FieldMarker'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import ReferenceMarker from '../dao/ReferenceMarker'

type OnUpdate = (updatedField: FieldName, updatedData: EntityData.FieldData) => void
type OnReplace = (replacement: EntityAccessor) => void
type OnUnlink = () => void

export default class AccessorTreeGenerator {
	private static readonly PRIMARY_KEY_NAME = 'id'

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
				return new AccessorTreeRoot(tree, new EntityCollectionAccessor(entityAccessors, () => {
					entityAccessors.push(createEntityAccessor(entityAccessors.length, undefined))
					updateData(createAccessorTreeRoot())
				}), tree.entityName)
			}
			const createEntityAccessor = (i: number, datum: ReceivedEntityData<undefined>): EntityAccessor =>
				this.updateFields(
					datum,
					tree.fields,
					(fieldName, newData) => {
						const entityAccessor = entityAccessors[i]
						if (entityAccessor) {
							entityAccessors[i] = this.withUpdatedField(entityAccessor, fieldName, newData)
							updateData(createAccessorTreeRoot())
						}
					},
					newEntityAccessor => {
						entityAccessors[i] = newEntityAccessor

						updateData(createAccessorTreeRoot())
					},
					() => {
						const entityAccessor = entityAccessors[i]

						if (entityAccessor) {
							const primaryKey = entityAccessor.primaryKey
							if (primaryKey) {
								entityAccessors[i] = new EntityForRemovalAccessor(
									primaryKey,
									entityAccessor.data,
									entityAccessor.replaceWith
								)
							} else {
								entityAccessors[i] = undefined
							}

							updateData(createAccessorTreeRoot())
						}
					}
				)
			const entityAccessors: Array<EntityAccessor | undefined> = (data && data.length ? data : [undefined]).map((datum, i) =>
				createEntityAccessor(i, datum)
			)
			return createAccessorTreeRoot()
		} else {
			const createAccessorTreeRoot = (): AccessorTreeRoot => new AccessorTreeRoot(tree, entityAccessor, tree.entityName)
			let entityAccessor: EntityAccessor | EntityForRemovalAccessor = this.updateFields(
				data,
				tree.fields,
				(fieldName, newData) => {
					entityAccessor = this.withUpdatedField(entityAccessor, fieldName, newData)

					updateData(createAccessorTreeRoot())
				},
				newEntityAccessor => {
					entityAccessor = newEntityAccessor

					updateData(createAccessorTreeRoot())
				},
				() => {
					if (entityAccessor.primaryKey) {
						entityAccessor = new EntityForRemovalAccessor(
							entityAccessor.primaryKey,
							entityAccessor.data,
							entityAccessor.replaceWith
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
		const id = data ? data[AccessorTreeGenerator.PRIMARY_KEY_NAME] : undefined

		for (const placeholderName in fields) {
			if (placeholderName === AccessorTreeGenerator.PRIMARY_KEY_NAME) {
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
						if (Array.isArray(fieldData) || fieldData === undefined) {
							entityData[referencePlaceholder] = this.generateManyReference(fieldData, reference, onUpdate)
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
					const onChange = (newValue: Scalar) => {
						onUpdate(placeholderName, new FieldAccessor(placeholderName, newValue, onChange))
					}
					// `fieldData` will be `undefined` when a repeater creates a clone based on no data.
					entityData[placeholderName] = new FieldAccessor(
						placeholderName,
						fieldData === undefined ? null : fieldData,
						onChange
					)
				}
			} else {
				assertNever(field)
			}
		}

		return new EntityAccessor(id, new EntityData(entityData), onReplace, onUnlink)
	}

	private generateOneReference(
		fieldData: ReceivedEntityData<undefined>,
		reference: ReferenceMarker.Reference,
		onUpdate: OnUpdate,
		entityData: EntityData.EntityData
	): EntityAccessor {
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
				if (entityAccessor instanceof EntityAccessor) {
					onUpdate(
						reference.placeholderName,
						(entityData[reference.placeholderName] = this.asDifferentEntity(entityAccessor, replacement))
					)
				}
			},
			() => onUpdate(reference.placeholderName, (entityData[reference.placeholderName] = undefined))
		)
	}

	private generateManyReference(
		fieldData: Array<ReceivedEntityData<undefined>> | undefined,
		reference: ReferenceMarker.Reference,
		onUpdate: OnUpdate
	): EntityCollectionAccessor {
		const generateNewAccessor = (i: number): EntityAccessor => {
			return this.updateFields(
				Array.isArray(fieldData) ? fieldData[i] : undefined,
				reference.fields,
				(updatedField: FieldName, updatedData: EntityData.FieldData) => {
					const entityAccessor = collectionAccessor.entities[i]
					if (entityAccessor) {
						collectionAccessor.entities[i] = this.withUpdatedField(entityAccessor, updatedField, updatedData)

						onUpdate(reference.placeholderName, collectionAccessor)
					}
				},
				replacement => {
					const entityAccessor = collectionAccessor.entities[i]
					if (entityAccessor) {
						collectionAccessor.entities[i] = this.asDifferentEntity(entityAccessor, replacement)

						onUpdate(reference.placeholderName, collectionAccessor)
					}
				},
				() => {
					const currentEntity = collectionAccessor.entities[i]
					if (currentEntity instanceof EntityAccessor) {
						const id = currentEntity.primaryKey

						if (id === undefined) {
							collectionAccessor.entities[i] = undefined
						} else {
							collectionAccessor.entities[i] = new EntityForRemovalAccessor(
								id,
								currentEntity.data,
								currentEntity.replaceWith
							)
						}
						onUpdate(reference.placeholderName, collectionAccessor)
					}
				}
			)
		}
		const collectionAccessor = new EntityCollectionAccessor([], () => {
			collectionAccessor.entities.push(generateNewAccessor(collectionAccessor.entities.length))
			onUpdate(reference.placeholderName, collectionAccessor)
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
		return new EntityAccessor(
			original.primaryKey,
			new EntityData({ ...original.data.allFieldData, [fieldPlaceholder]: newData }),
			original.replaceWith,
			original.unlink
		)
	}

	private asDifferentEntity(original: EntityAccessor, replacement: EntityAccessor): EntityAccessor {
		// TODO: we also need to update the callbacks inside replacement.data
		return new EntityAccessor(replacement.primaryKey, replacement.data, original.replaceWith, original.unlink)
	}
}
