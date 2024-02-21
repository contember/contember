import { DataViewProps } from '../components'
import { useDataViewGlobalKey } from '../contexts'

export const useDataViewKey = (props: Pick<DataViewProps, 'entities' | 'dataViewKey'>): string => {
	const pageName = useDataViewGlobalKey()
	const entityName = typeof props.entities === 'string' ? props.entities : props.entities.entityName
	return props.dataViewKey ?? `${pageName}__${entityName}`
}
