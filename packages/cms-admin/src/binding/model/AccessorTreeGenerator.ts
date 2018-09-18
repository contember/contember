import { FieldName } from '../bindingTypes'
import { DataContextValue } from '../coreComponents/DataContext'
import AccessorTreeRoot from '../dao/AccessorTreeRoot'
import EntityAccessor, { EntityData, FieldData } from '../dao/EntityAccessor'
import EntityMarker from '../dao/EntityMarker'
import FieldAccessor from '../dao/FieldAccessor'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'

export default class AccessorTreeGenerator {
	private static PRIMARY_KEY_NAME = 'id'

	public constructor(private tree: MarkerTreeRoot, private allInitialData: any) {}

	public generateLiveTree(updateData: (newData?: AccessorTreeRoot) => void): void {
		let data: any = this.allInitialData[this.tree.id]

		if (!data) {
			return
		}

		if (!Array.isArray(data)) {
			data = [data]
		}

		const entityAccessors: Array<EntityAccessor> = (data as any[]).map((datum, i) => this.updateFields(
			datum, this.tree.root, (fieldName, newData) => {
				entityAccessors[i] = entityAccessors[i].withUpdatedField(fieldName, newData)

				updateData(AccessorTreeRoot.createInstance(this.tree, entityAccessors))
			}
		))
		updateData(AccessorTreeRoot.createInstance(this.tree, entityAccessors))
	}

	private updateFields(
		data: {
			[fieldName: string]: any
		},
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

			if (field instanceof MarkerTreeRoot) {
				entityData[fieldName] = this.updateFields(this.allInitialData[field.id], field.root, () => undefined)
				continue
			}


			if (Array.isArray(fieldData)) {
				if (field instanceof EntityMarker) {
					const oneToManyData: DataContextValue[] = []

					for (let i = 0, len = fieldData.length; i < len; i++) {
						const accessor = this.updateFields(
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
						if (accessor) oneToManyData.push(accessor)
					}

					entityData[fieldName] = oneToManyData
				}
			} else if (typeof fieldData === 'object') {
				if (field instanceof EntityMarker) {
					const accessor = this.updateFields(
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
					if (accessor) entityData[fieldName] = accessor
				}
			} else {
				const onChange = (newValue: any) => {
					onUpdate(fieldName, new FieldAccessor(fieldName, newValue, onChange))
				}
				entityData[fieldName] = new FieldAccessor(fieldName, fieldData, onChange)
			}
		}

		return new EntityAccessor(marker.entityName, marker.where, id, entityData, onUnlink)
	}
}
