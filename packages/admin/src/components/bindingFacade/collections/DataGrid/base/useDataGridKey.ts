import { useCurrentRequest } from '../../../../../routing'
import { DataGridProps } from '../grid'

export const useDataGridKey = (props: Pick<DataGridProps<any>, 'entities' | 'dataGridKey'>): string => {
	const pageName = useCurrentRequest()?.pageName
	const entityName = typeof props.entities === 'string' ? props.entities : props.entities.entityName
	return props.dataGridKey ?? `${pageName}__${entityName}`
}
