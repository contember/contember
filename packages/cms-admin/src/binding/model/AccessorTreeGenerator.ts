import { FieldName } from '../bindingTypes'
import { DataContextValue } from '../coreComponents/DataContext'
import AccessorTreeRoot from '../dao/AccessorTreeRoot'
import EntityAccessor, { EntityData, FieldData } from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import EntityMarker from '../dao/EntityMarker'
import FieldAccessor from '../dao/FieldAccessor'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'

export default class AccessorTreeGenerator {
	private static PRIMARY_KEY_NAME = 'id'

	public constructor(private tree: MarkerTreeRoot, private allInitialData: any) {}

	public generateLiveTree(updateData: (newData?: AccessorTreeRoot) => void): void {
		updateData(this.generateSubTree(this.tree, updateData))
	}

	private generateSubTree(tree: MarkerTreeRoot, updateData: (newData?: AccessorTreeRoot) => void): AccessorTreeRoot {
		let data: any = this.allInitialData[tree.id]

		if (!Array.isArray(data)) {
			data = [data]
		}

		const entityAccessors: Array<EntityAccessor> = (data as any[]).map((datum, i) =>
			this.updateFields(datum, tree.root, (fieldName, newData) => {
				entityAccessors[i] = this.withUpdatedField(entityAccessors[i], fieldName, newData)

				updateData(AccessorTreeRoot.createInstance(tree, entityAccessors))
			}, (newEntityAccessor) => {
				entityAccessors[i] = newEntityAccessor

				updateData(AccessorTreeRoot.createInstance(tree, entityAccessors))
			}),
		)
		return AccessorTreeRoot.createInstance(tree, entityAccessors)
	}

	private updateFields(
		data: {
			[fieldName: string]: any
		},
		marker: EntityMarker,
		onUpdate: (updatedField: FieldName, updatedData: FieldData) => void,
		onReplace: (replacement: EntityAccessor) => void,
		onUnlink?: () => void,
	): EntityAccessor {
		const entityData: EntityData = {}
		const id = data[AccessorTreeGenerator.PRIMARY_KEY_NAME]
		const fields = marker.fields

		for (const fieldName in fields) {
			if (fieldName === AccessorTreeGenerator.PRIMARY_KEY_NAME) {
				continue
			}

			const fieldData: any = data[fieldName]
			const field = fields[fieldName]

			if (field instanceof MarkerTreeRoot) {
				entityData[fieldName] = this.generateSubTree(field, () => undefined)
				continue
			}

			if (Array.isArray(fieldData)) {
				if (field instanceof EntityMarker) {
					const collectionAccessor = new EntityCollectionAccessor([])

					for (let i = 0, len = fieldData.length; i < len; i++) {
						const accessor = this.updateFields(
							fieldData[i],
							field,
							(updatedField: FieldName, updatedData: FieldData) => {
								const entityAccessor = collectionAccessor.entities[i]
								if (entityAccessor) {
									collectionAccessor.entities[i] = this.withUpdatedField(entityAccessor, updatedField, updatedData)

									onUpdate(fieldName, collectionAccessor)
								}
							},
							(replacement) => {
								const entityAccessor = collectionAccessor.entities[i]
								if (entityAccessor) {
									collectionAccessor.entities[i] = this.asNewEntity(entityAccessor, replacement)

									onUpdate(fieldName, collectionAccessor)
								}
							},
							() => {
								collectionAccessor.entities[i] = undefined
								onUpdate(fieldName, collectionAccessor)
							},
						)
						collectionAccessor.entities.push(accessor)
					}

					entityData[fieldName] = collectionAccessor
				}
			} else if (typeof fieldData === 'object') {
				if (field instanceof EntityMarker) {
					entityData[fieldName] = this.updateFields(
						fieldData,
						field,
						(updatedField: FieldName, updatedData: FieldData) => {
							const entityAccessor = entityData[fieldName]
							if (entityAccessor instanceof EntityAccessor) {
								onUpdate(fieldName, this.withUpdatedField(entityAccessor, updatedField, updatedData))
							}
						},
						(replacement) => {
							const entityAccessor = entityData[fieldName]
							if (entityAccessor instanceof EntityAccessor) {
								onUpdate(fieldName, this.asNewEntity(entityAccessor, replacement))
							}
						},
						() => onUpdate(fieldName, undefined),
					)
				}
			} else {
				const onChange = (newValue: any) => {
					onUpdate(fieldName, new FieldAccessor(fieldName, newValue, onChange))
				}
				entityData[fieldName] = new FieldAccessor(fieldName, fieldData, onChange)
			}
		}

		return new EntityAccessor(marker.entityName, id, entityData, onReplace, onUnlink)
	}


	private withUpdatedField(original: EntityAccessor, field: FieldName, newData: FieldData): EntityAccessor {
		return new EntityAccessor(
			original.entityName,
			original.primaryKey,
			{ ...original.data, [field]: newData },
			original.replaceWith,
			original.unlink,
		)
	}

	private asNewEntity(original: EntityAccessor, replacement: EntityAccessor): EntityAccessor {
		// TODO: we also need to update the callbacks inside replacement.data
		return new EntityAccessor(
			replacement.entityName, replacement.primaryKey, replacement.data, original.replaceWith, original.unlink
		)
	}
}
