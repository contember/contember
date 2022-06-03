import { Checkbox, FieldContainer } from '@contember/ui'
import { useMemo } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { ChoiceFieldData, MultiSelectFieldInner } from '../../../fields'
import { BaseDynamicChoiceField } from '../../../fields/ChoiceField/BaseDynamicChoiceField'
import { useSelectOptions } from '../../../fields/ChoiceField/hooks/useSelectOptions'
import { FilterRendererProps } from '../base'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'
import { EntityAccessor, EntityId } from '@contember/binding'


// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SelectCellArtifacts = {
	id: EntityId[]
	nullCondition: boolean
}
type SelectCellFilterProps =
	& FilterRendererProps<SelectCellArtifacts>
	& {
		optionProps: BaseDynamicChoiceField
	}

export const SelectCellFilter = ({ filter, setFilter, optionProps }: SelectCellFilterProps) => {
	const { options, onSearch, isLoading } = useSelectOptions(optionProps)
	const currentValues = useMemo<ChoiceFieldData.Data<EntityAccessor>>(() => {
		return options.filter(it => filter.id.includes(it.actualValue.id))
	}, [filter.id, options])
	const formatMessage = useMessageFormatter(dataGridCellsDictionary)

	return <>
		<MultiSelectFieldInner
			label={undefined}
			data={options}
			onAdd={(val: ChoiceFieldData.SingleDatum<EntityAccessor>) => setFilter({ ...filter, id: [...filter.id, val.actualValue.id] })}
			onRemove={val => setFilter({ ...filter, id: filter.id.filter(it => it !== val.actualValue.id) })}
			errors={undefined}
			currentValues={currentValues}
			onClear={() => {
				setFilter({ ...filter, id: [] })
			}}
			onSearch={onSearch}
			isLoading={isLoading}
		/>

		<FieldContainer
			label={<span style={{ whiteSpace: 'nowrap' }}>
				{formatMessage('dataGridCells.textCell.includeNull', {
					strong: chunks => <strong>{chunks}</strong>,
				})}
			</span>}
			labelPosition="labelInlineRight"
		>
			<Checkbox
				notNull
				value={filter.nullCondition}
				onChange={checked => {
					setFilter({
						...filter,
						nullCondition: !!checked,
					})
				}}
			/>
		</FieldContainer>
	</>
}
