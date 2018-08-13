import { FieldName } from '../bindingTypes'
import { DataContextValue } from '../coreComponents/DataContext'
import EntityAccessor, { EntityData, FieldData } from '../dao/EntityAccessor'
import EntityMarker, { EntityFields } from '../dao/EntityMarker'
import FieldAccessor from '../dao/FieldAccessor'
import RootEntityMarker from '../dao/RootEntityMarker'

export default class AccessorTreeGenerator {
	private static PRIMARY_KEY_NAME = 'id'

	public constructor(private structure: RootEntityMarker, private initialData: any) {}

	public generateLiveTree(updateData: (newData: DataContextValue) => void) {
		if (!(this.structure.content instanceof EntityMarker)) {
			return
		}

		const marker: EntityMarker = this.structure.content
		const data = this.initialData[marker.entityName]

		let entityAccessor: EntityAccessor = this.updateFields(data, marker, (fieldName, newData) => {
			entityAccessor = entityAccessor.withUpdatedField(fieldName, newData)

			updateData(entityAccessor)
		})

		updateData(entityAccessor)
	}

	private updateFields(
		data: any,
		marker: EntityMarker,
		onUpdate: (updatedField: FieldName, updatedData: FieldData) => void,
		onUnlink?: () => void
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

			if (Array.isArray(fieldData)) {
				if (field instanceof EntityMarker) {
					const oneToManyData: DataContextValue[] = []

					for (let i = 0, len = fieldData.length; i < len; i++) {
						oneToManyData.push(
							this.updateFields(
								fieldData[i],
								field,
								(updatedField: FieldName, updatedData: FieldData) => {
									const entityAccessor = oneToManyData[i]
									if (entityAccessor instanceof EntityAccessor) {
										oneToManyData[i] = entityAccessor.withUpdatedField(updatedField, updatedData)

										onUpdate(fieldName, oneToManyData)
									}
								},
								() => {
									oneToManyData[i] = undefined
									onUpdate(fieldName, oneToManyData)
								}
							)
						)
					}

					entityData[fieldName] = oneToManyData
				}
			} else if (typeof fieldData === 'object') {
				if (field instanceof EntityMarker) {
					entityData[fieldName] = this.updateFields(
						fieldData,
						field,
						(updatedField: FieldName, updatedData: FieldData) => {
							const accessor = entityData[fieldName]
							if (accessor instanceof EntityAccessor) {
								onUpdate(fieldName, accessor.withUpdatedField(updatedField, updatedData))
							}
						},
						() => onUpdate(fieldName, undefined)
					)
				}
			} else {
				const onChange = (newValue: any) => {
					onUpdate(fieldName, new FieldAccessor(fieldName, newValue, onChange))
				}
				entityData[fieldName] = new FieldAccessor(fieldName, fieldData, onChange)
			}
		}

		return new EntityAccessor(marker.entityName, id, entityData, onUnlink)
	}
}
