import {
	Component,
	DimensionLink,
	DimensionRenderer,
	Entity,
	EntityAccessor,
	Field,
	HasOne,
	LabelMiddlewareProvider,
	StaticRender,
	SugaredQualifiedEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	useDimensionState,
	useEntity,
} from '@contember/interface'
import { DataView, DataViewEachRow, DataViewLoaderState, DataViewSortingDirections, useDataViewEntityListAccessor } from '@contember/react-dataview'
import { ReactNode, useMemo } from 'react'
import { CheckIcon } from 'lucide-react'
import { Loader } from '../ui/loader'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { DimensionLabelUI, DimensionLabelWrapperUI } from '../ui/dimension'

export type DimensionsSwitcherProps = {
	options: SugaredQualifiedEntityList['entities']
	orderBy?: DataViewSortingDirections
	dimension: string
	children: ReactNode
	slugField: SugaredRelativeSingleField['field']
	isMulti?: boolean
}

export const DimensionsSwitcher = Component(({ options, dimension, children, slugField, orderBy, isMulti }: DimensionsSwitcherProps) => (
	<DataView entities={options} initialSorting={orderBy}>
		<DataViewLoaderState initial refreshing>
			<Loader position="static" />
		</DataViewLoaderState>
		<DataViewLoaderState loaded>
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline" size="sm">
						<DimensionSwitcherCurrentValues dimension={dimension} slugField={slugField}>
							{children}
						</DimensionSwitcherCurrentValues>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="p-2" align="start">
					<div className="flex flex-col gap-1">
						<DataViewEachRow>
							<DimensionSwitcherItem dimension={dimension} slugField={slugField} isMulti={isMulti}>
								{children}
								<StaticRender>
									<Field field={slugField} />
								</StaticRender>
							</DimensionSwitcherItem>
						</DataViewEachRow>
					</div>
				</PopoverContent>
			</Popover>
		</DataViewLoaderState>
	</DataView>
))

const DimensionSwitcherCurrentValues = ({ children, dimension, slugField }: { children: ReactNode; dimension: string; slugField: SugaredRelativeSingleField['field'] }) => {
	const entitiesBySlug = useDimensionEntitiesBySlug(slugField)
	const currentDimensionValue = useDimensionState({
		dimension,
		defaultValue: Object.keys(entitiesBySlug)[0],
		storage: 'local',
	})
	const values = useMemo(() => currentDimensionValue.map(it => entitiesBySlug[it]).filter(Boolean), [currentDimensionValue, entitiesBySlug])

	return (
		<div className="flex gap-1">
			{values.map(it => (
				<Entity key={it.key} accessor={it}>
					<div className="gap-1 group text-black text-left inline-flex items-center px-1 text-sm border-b border-gray-200">
						<span>{children}</span>
					</div>
				</Entity>
			))}
		</div>
	)
}

const DimensionSwitcherItem = ({ children, dimension, slugField, isMulti }: { children: ReactNode; dimension: string; slugField: SugaredRelativeSingleField['field']; isMulti?: boolean }) => {
	const entity = useEntity()
	const slugValue = entity.getField<string>(slugField).value

	if (!slugValue) return null

	return (
		<DimensionLink dimension={dimension} value={slugValue} action={isMulti ? 'toggle' : 'set'}>
			<a className="gap-1 group text-gray-800 text-left inline-flex items-center px-1 py-1 text-sm rounded transition-all hover:bg-accent hover:text-accent-foreground group data-[active]:text-black">
				<CheckIcon className="w-3 h-3 hidden group-data-[active]:block" />
				<span className="w-3 h-3 group-data-[active]:hidden" />
				<span>{children}</span>
			</a>
		</DimensionLink>
	)
}

export const DimensionLabel = ({ label, dimensionValue }: { label: ReactNode; dimensionValue: ReactNode }) => (
	<DimensionLabelWrapperUI>
		{label}<DimensionLabelUI>{dimensionValue}</DimensionLabelUI>
	</DimensionLabelWrapperUI>
)

export type RenderLabelProps = {
	label: ReactNode
	dimensionValue: string | null
}

export type SideDimensionsProps = {
	dimension: string
	as: string
	field: SugaredRelativeSingleEntity['field']
	children: ReactNode
	renderLabel?: ({ label, dimensionValue }: RenderLabelProps) => ReactNode
}

export const SideDimensions = Component<SideDimensionsProps>(({ dimension, children, as, field, renderLabel }) => (
	<div className="flex mt-4 gap-4">
		<DimensionRenderer dimension={dimension} as={as}>
			<LabelMiddlewareProvider value={(label, environment) => {
				const dimensionValue = environment.getVariableOrElse(as, null) as string | null
				const Component = renderLabel || DimensionLabel

				return <Component label={label} dimensionValue={dimensionValue} />
			}}>
				<HasOne field={field}>
					<div className="flex-1">{children}</div>
				</HasOne>
			</LabelMiddlewareProvider>
		</DimensionRenderer>
	</div>
))

const useDimensionEntitiesBySlug = (slugField: SugaredRelativeSingleField['field']): Record<string, EntityAccessor> => {
	const accessor = useDataViewEntityListAccessor()

	return useMemo(
		() => Object.fromEntries(Array.from(accessor ?? []).map(it => [it.getField<string>(slugField).value, it])),
		[accessor, slugField],
	)
}
