import { DataGridProps } from '../grid'
import { useContext } from 'react'
import { DataGridKeyContext } from '../context'

export const useDataGridKey = (props: Pick<DataGridProps<any>, 'entities' | 'dataGridKey'>): string => {
	const pageName = useContext(DataGridKeyContext)
	const entityName = typeof props.entities === 'string' ? props.entities : props.entities.entityName
	return props.dataGridKey ?? `${pageName}__${entityName}`
}
