import { useEnvironment } from '@contember/react-binding'
import { useDataViewEntityListProps } from '../../contexts'
import { useMemo } from 'react'

export const useFieldEntityName = (fields: string[]) => {
	const environment = useEnvironment()
	const entityName = useDataViewEntityListProps().entityName

	return useMemo(() => {
		let entity = environment.getSchema().getEntity(entityName)
		for (const field of fields) {
			const targetField = entity.fields.get(field)
			if (!targetField || targetField.__typename !== '_Relation') {
				throw new Error('Invalid field')
			}
			entity = environment.getSchema().getEntity(targetField.targetEntity)
		}
		return entity.name
	}, [environment, entityName, fields])
}
