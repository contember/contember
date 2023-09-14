import { FilterRendererProps } from '@contember/react-datagrid'
import { Checkbox, FieldContainer } from '@contember/ui'

export const HasManyAbsentCellFilter = ({ filter, setFilter }: FilterRendererProps<boolean>) => {
	return (
		<FieldContainer label="Has any" labelPosition="right" display="inline">
			<Checkbox notNull value={filter} onChange={checked => setFilter(!!checked)} />
		</FieldContainer>
	)
}
