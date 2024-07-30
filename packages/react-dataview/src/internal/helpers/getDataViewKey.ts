import { Environment } from '@contember/binding'
import { DataViewProps } from '../../components'
import { dataViewKeyEnvironmentExtension } from '../../env/dataViewKeyEnvironmentExtension'

export const getDataViewKey = (env: Environment, props: Pick<DataViewProps, 'entities' | 'dataViewKey'>) => {
	const pageName = env.getExtension(dataViewKeyEnvironmentExtension)
	const entityName = typeof props.entities === 'string' ? props.entities : props.entities.entityName
	return props.dataViewKey ?? `${pageName}__${entityName}`
}
