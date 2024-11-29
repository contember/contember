import { useEnvironment } from '@contember/react-binding'
import { useDataViewEntityListProps } from '../../contexts'
import { useMemo } from 'react'

export const useTargetFieldSchema = (fields: string[]) => {
	const environment = useEnvironment()
	const entityName = useDataViewEntityListProps().entityName

	return useMemo(() => {
		let entity = environment.getSchema().getEntity(entityName)
		for (let i = 0; i < fields.length - 2; i++) {
			const targetField = entity.fields.get(fields[i])
			if (!targetField || targetField.__typename !== '_Relation') {
				throw new Error('Invalid field')
			}
			entity = environment.getSchema().getEntity(targetField.targetEntity)
		}
		return entity.fields.get(fields[fields.length - 1])
	}, [environment, entityName, fields])
}
