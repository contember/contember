import * as React from 'react'
import { ReactNode } from 'react'
import {
	DataViewNullFilterTrigger,
	DataViewNumberFilterInput,
	DataViewNumberFilterResetTrigger,
	NumberRangeFilterArtifacts,
	useDataViewFilter,
} from '@contember/react-dataview'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { DataViewActiveFilterUI, DataViewFilterSelectTriggerUI, DataViewSingleFilterUI } from '../ui'
import { DataViewNullFilter } from './common'
import { Input } from '../../ui/input'
import { formatNumber } from '../../../utils/formatting'

const DataViewNumberFilterRange = ({ name }: {
	name: string
}) => {
	const [artifact] = useDataViewFilter<NumberRangeFilterArtifacts>(name)
	if (!artifact) {
		return null
	}
	if (artifact.from !== undefined && artifact.to !== undefined) {
		return `${formatNumber(artifact.from)} – ${formatNumber(artifact.to)}`
	}
	if (artifact.from !== undefined) {
		return `≥ ${formatNumber(artifact.from)}`
	}
	if (artifact.to !== undefined) {
		return `≤ ${formatNumber(artifact.to)}`
	}
	return null
}


export const DataViewNumberFilterList = ({ name }: {
	name: string
}) => (
	<>
		<DataViewNumberFilterResetTrigger name={name}>
			<DataViewActiveFilterUI>
				<DataViewNumberFilterRange name={name} />
			</DataViewActiveFilterUI>
		</DataViewNumberFilterResetTrigger>

		<DataViewNullFilterTrigger name={name} action={'unset'}>
			<DataViewActiveFilterUI>
				<span className={'italic'}>N/A</span>
			</DataViewActiveFilterUI>
		</DataViewNullFilterTrigger>
	</>
)


export const DataViewNumberFilterSelect = ({ name, label }: {
	name: string
	label?: ReactNode
}) => (
	<Popover>
		<PopoverTrigger asChild>
			<DataViewFilterSelectTriggerUI>{label}</DataViewFilterSelectTriggerUI>
		</PopoverTrigger>
		<PopoverContent>
			<div className={'relative flex flex-col gap-4'}>
				<div className={'flex justify-center items-center'}>
					<DataViewNumberFilterInput name={name} type={'from'}>
						<Input className={''} inputSize={'sm'} placeholder={'From'} type={'number'} />
					</DataViewNumberFilterInput>
					<span className={'mx-4 font-bold '}>
						–
					</span>
					<DataViewNumberFilterInput name={name} type={'to'}>
						<Input className={''} inputSize={'sm'} placeholder={'To'} type={'number'} />
					</DataViewNumberFilterInput>
				</div>

				<DataViewNullFilter name={name} />
			</div>
		</PopoverContent>
	</Popover>
)


export const DefaultDataViewNumberFilter = ({ name, label }: {
	name: string
	label: ReactNode
}) => (
	<DataViewSingleFilterUI>
		<DataViewNumberFilterSelect name={name} label={label} />
		<DataViewNumberFilterList name={name} />
	</DataViewSingleFilterUI>
)
