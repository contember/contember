import { useEnvironment } from '@contember/react-binding'
import { useDataViewEntityListProps } from '../../contexts'
import { useMemo } from 'react'

export const useDataViewTargetFieldSchemaInternal = (fields: string[]) => {
	const environment = useEnvironment()
	const entityName = useDataViewEntityListProps().entityName

	return useMemo(() => {
		const schema = environment.getSchema()
		let entity = schema.getEntity(entityName)
		for (let i = 0; i < fields.length - 1; i++) {
			const targetField = schema.getEntityRelation(entity.name, fields[i])
			entity = schema.getEntity(targetField.targetEntity)
		}
		const schemaField = schema.getEntityField(entity.name, fields[fields.length - 1])
		return {
			entity,
			field: schemaField,
		}
	}, [environment, entityName, fields])
}
