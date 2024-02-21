import { EnumCellRendererProps, FilterRendererProps } from '@contember/react-datagrid'
import { Checkbox, FieldContainer, Stack } from '@contember/ui'
import { NullConditionFilter, NullConditionFilterPublicProps } from './NullConditionFilter'
import { EnumFilterArtifacts } from '@contember/react-dataview'

export type EnumCellFilterExtraProps =
	& NullConditionFilterPublicProps
	& EnumCellRendererProps
	& {
		options: Record<string, string>
	}

export const EnumCellFilter = ({ filter, setFilter, environment, field, options, showNullConditionFilter }: FilterRendererProps<EnumFilterArtifacts, EnumCellFilterExtraProps>) => {
	const values = filter.values ?? []

	const checkboxList = Object.entries(options).map(([value, label]) => (
		<FieldContainer
			key={value}
			label={label}
			display="inline"
			labelPosition="right"
		>
			<Checkbox
				notNull
				value={values.includes(value)}
				onChange={checked => {
					setFilter({
						...filter,
						values: checked ? [...values, value] : values.filter(it => it !== value),
					})
				}}
			/>
		</FieldContainer>
	))

	return <>
		<Stack gap="gap">
			{checkboxList}
			<NullConditionFilter filter={filter} setFilter={setFilter} environment={environment} field={field} showNullConditionFilter={showNullConditionFilter} />
		</Stack>
	</>
}
