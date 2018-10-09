import { assertNever } from 'cms-common'
import { FieldName, ReceivedEntityData, Scalar } from '../bindingTypes'
import AccessorTreeRoot from '../dao/AccessorTreeRoot'
import DataBindingError from '../dao/DataBindingError'
import EntityAccessor, { EntityData, FieldData } from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import EntityFields from '../dao/EntityFields'
import EntityForRemovalAccessor from '../dao/EntityForRemovalAccessor'
import FieldAccessor from '../dao/FieldAccessor'
import FieldMarker from '../dao/FieldMarker'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import ReferenceMarker from '../dao/ReferenceMarker'

type OnUpdate = (updatedField: FieldName, updatedData: FieldData) => void
type OnReplace = (replacement: EntityAccessor) => void
type OnUnlink = () => void

export default class AccessorTreeGenerator {
	private static readonly PRIMARY_KEY_NAME = 'id'

	public constructor(private tree: MarkerTreeRoot, private allInitialData: any) {}

	public generateLiveTree(updateData: (newData?: AccessorTreeRoot) => void): void {
		updateData(this.generateSubTree(this.tree, updateData))
	}

	private generateSubTree(tree: MarkerTreeRoot, updateData: (newData?: AccessorTreeRoot) => void): AccessorTreeRoot {
		const data: ReceivedEntityData<undefined> = this.allInitialData[tree.id]

		if (Array.isArray(data)) {
			const createAccessorTreeRoot = (): AccessorTreeRoot => {
				// TODO, proper addNew callback
				return new AccessorTreeRoot(tree, new EntityCollectionAccessor(entityAccessors, () => {}), tree.entityName)
			}
			const entityAccessors: Array<EntityAccessor> = data.map((datum, i) =>
				this.updateFields(
					datum,
					tree.fields,
					(fieldName, newData) => {
						entityAccessors[i] = this.withUpdatedField(entityAccessors[i], fieldName, newData)

						updateData(createAccessorTreeRoot())
					},
					newEntityAccessor => {
						entityAccessors[i] = newEntityAccessor

						updateData(createAccessorTreeRoot())
					},
				),
			)
			return createAccessorTreeRoot()
		} else {
			const createAccessorTreeRoot = (): AccessorTreeRoot => new AccessorTreeRoot(tree, entityAccessor, tree.entityName)
			let entityAccessor: EntityAccessor = this.updateFields(
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
			)
			return createAccessorTreeRoot()
		}
	}

	private updateFields(
		data: ReceivedEntityData<undefined> | undefined,
		fields: EntityFields,
		onUpdate: OnUpdate,
		onReplace: OnReplace,
		onUnlink?: OnUnlink,
	): EntityAccessor {
		const entityData: EntityData = {}
		const id = data ? data[AccessorTreeGenerator.PRIMARY_KEY_NAME] : undefined

		for (const fieldName in fields) {
			if (fieldName === AccessorTreeGenerator.PRIMARY_KEY_NAME) {
				continue
			}

			const fieldData = data ? data[fieldName] : undefined
			const field = fields[fieldName]

			if (field instanceof MarkerTreeRoot) {
				entityData[fieldName] = this.generateSubTree(field, () => undefined)
			} else if (field instanceof ReferenceMarker) {
				if (field.expectedCount === ReferenceMarker.ExpectedCount.One) {
					if (Array.isArray(fieldData)) {
						throw new DataBindingError(
							`Received a collection of entities for field '${field.fieldName}' where a single entity was expected. ` +
							`Perhaps you wanted to use a <Repeater />?`,
						)
					} else if (fieldData === null) {
						entityData[fieldName] = undefined
					} else if (typeof fieldData === 'object' || fieldData === undefined) {
						entityData[fieldName] = this.generateOneReference(fieldData, field, onUpdate, entityData)
					} else {
						throw new DataBindingError(
							`Received a scalar value for field '${field.fieldName}' where a single entity was expected.` +
							`Perhaps you meant to use a variant of <Field />?`,
						)
					}
				} else if (field.expectedCount === ReferenceMarker.ExpectedCount.Many) {
					if (Array.isArray(fieldData) || fieldData === undefined) {
						entityData[fieldName] = this.generateManyReference(fieldData, field, onUpdate)
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
					return assertNever(field.expectedCount)
				}
			} else if (field instanceof FieldMarker) {
				if (Array.isArray(fieldData)) {
					throw new DataBindingError(
						`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use a <Repeater />?`,
					)
				} else if (typeof fieldData === 'object' && fieldData !== null) {
					throw new DataBindingError(
						`Received a referenced entity where a single '${field.fieldName}' field was expected. ` +
							`Perhaps you wanted to use a <SingleReference />?`,
					)
				} else {
					const onChange = (newValue: Scalar) => {
						onUpdate(fieldName, new FieldAccessor(fieldName, newValue, onChange))
					}
					// `fieldData` will be `undefined` when a repeater creates a clone based on no data.
					entityData[fieldName] = new FieldAccessor(fieldName, fieldData === undefined ? null : fieldData, onChange)
				}
			} else {
				assertNever(field)
			}
		}

		return new EntityAccessor(id, entityData, onReplace, onUnlink)
	}

	private generateOneReference(
		fieldData: ReceivedEntityData<undefined> | undefined,
		field: ReferenceMarker,
		onUpdate: OnUpdate,
		entityData: EntityData,
	): EntityAccessor {
		return this.updateFields(
			fieldData,
			field.fields,
			(updatedField: FieldName, updatedData: FieldData) => {
				const entityAccessor = entityData[field.fieldName]
				if (entityAccessor instanceof EntityAccessor) {
					onUpdate(field.fieldName, this.withUpdatedField(entityAccessor, updatedField, updatedData))
				}
			},
			replacement => {
				const entityAccessor = entityData[field.fieldName]
				if (entityAccessor instanceof EntityAccessor) {
					onUpdate(field.fieldName, this.asDifferentEntity(entityAccessor, replacement))
				}
			},
			() => onUpdate(field.fieldName, undefined),
		)
	}

	private generateManyReference(
		fieldData: Array<ReceivedEntityData<undefined> | undefined> | undefined,
		field: ReferenceMarker,
		onUpdate: OnUpdate,
	): EntityCollectionAccessor {
		const generateNewAccessor = (i: number): EntityAccessor => {
			return this.updateFields(
				Array.isArray(fieldData) ? fieldData[i] : undefined,
				field.fields,
				(updatedField: FieldName, updatedData: FieldData) => {
					const entityAccessor = collectionAccessor.entities[i]
					if (entityAccessor) {
						collectionAccessor.entities[i] = this.withUpdatedField(entityAccessor, updatedField, updatedData)

						onUpdate(field.fieldName, collectionAccessor)
					}
				},
				replacement => {
					const entityAccessor = collectionAccessor.entities[i]
					if (entityAccessor) {
						collectionAccessor.entities[i] = this.asDifferentEntity(entityAccessor, replacement)

						onUpdate(field.fieldName, collectionAccessor)
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
								currentEntity.replaceWith,
							)
						}
						onUpdate(field.fieldName, collectionAccessor)
					}
				},
			)
		}
		const collectionAccessor = new EntityCollectionAccessor([], () => {
			collectionAccessor.entities.push(generateNewAccessor(collectionAccessor.entities.length))
			onUpdate(field.fieldName, collectionAccessor)
		})

		if (!Array.isArray(fieldData)) {
			fieldData = [fieldData]
		}
		for (let i = 0, len = fieldData.length; i < len; i++) {
			collectionAccessor.entities.push(generateNewAccessor(i))
		}

		return collectionAccessor
	}

	private withUpdatedField(original: EntityAccessor, field: FieldName, newData: FieldData): EntityAccessor {
		return new EntityAccessor(
			original.primaryKey,
			{ ...original.data, [field]: newData },
			original.replaceWith,
			original.unlink,
		)
	}

	private asDifferentEntity(original: EntityAccessor, replacement: EntityAccessor): EntityAccessor {
		// TODO: we also need to update the callbacks inside replacement.data
		return new EntityAccessor(
			replacement.primaryKey,
			replacement.data,
			original.replaceWith,
			original.unlink,
		)
	}
}
