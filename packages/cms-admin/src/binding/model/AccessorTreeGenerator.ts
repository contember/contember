import { DataContextValue } from '../coreComponents/DataContext'
import EntityAccessor, { EntityData } from '../dao/EntityAccessor'
import EntityMarker, { EntityFields } from '../dao/EntityMarker'
import FieldAccessor from '../dao/FieldAccessor'
import RootEntityMarker from '../dao/RootEntityMarker'

export default class AccessorTreeGenerator {

	public constructor(private structure: RootEntityMarker, private initialData: any, private updateData: (newData: DataContextValue) => void) {
		this.update()
	}

	private update() {
		if (!(this.structure.content instanceof EntityMarker)) {
			return
		}

		const marker: EntityMarker = this.structure.content
		const data = this.initialData[marker.entityName]

		this.updateData(this.updateFields(data, marker.fields))
	}

	private updateFields(data: any, fields: EntityFields): EntityAccessor {

		const entityData: EntityData = {}
		const id = data.id

		for (const fieldName in fields) {
			if (fieldName === 'id') {
				continue
			}

			const fieldData: any = data[fieldName]
			const field = fields[fieldName]

			if (Array.isArray(fieldData)) {
				if (field instanceof EntityMarker) {
					const oneToManyData: EntityAccessor[] = []

					for (let i = 0, len = fieldData.length; i < len; i++) {
						oneToManyData.push(this.updateFields(fieldData[i], field.fields))
					}

					entityData[fieldName] = oneToManyData
				}
			} else if (typeof fieldData === 'object') {
				if (field instanceof EntityMarker) {
					entityData[fieldName] = this.updateFields(fieldData, field.fields)
				}
			} else {
				console.log('field', fieldData)
				entityData[fieldName] = new FieldAccessor(fieldData)
			}
		}

		return new EntityAccessor(id, entityData)
	}
}
