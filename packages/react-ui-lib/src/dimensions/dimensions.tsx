import {
	Component,
	DimensionLink,
	DimensionRenderer,
	Entity,
	EntityAccessor,
	Field,
	HasOne,
	StaticRender,
	SugaredQualifiedEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	useDimensionState,
	useEntity,
} from '@contember/interface'
import {
	DataView,
	DataViewEachRow,
	DataViewLoaderState,
	DataViewSortingDirections,
	useDataViewEntityListAccessor,
} from '@contember/react-dataview'
import { CheckIcon } from 'lucide-react'
import { ReactNode, useMemo } from 'react'
import { Button } from '../ui/button'
import { Loader } from '../ui/loader'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

/**
 * Props for the {@link DimensionsSwitcher} component.
 */
export interface DimensionsSwitcherProps {
	/**
	 * Entity list for dimension options
	 * */
	options: SugaredQualifiedEntityList['entities']
	/**
	 * Specifies initial sorting of the options (e.g., `{ label: 'desc' }`).
	 * */
	orderBy?: DataViewSortingDirections
	/**
	 * The name of the dimension to switch.
	 * */
	dimension: string
	/**
	 * Child components or fields to render within the dimension selector.
	 * */
	children: ReactNode
	/**
	 * Field containing unique dimension identifiers
	 * */
	slugField: SugaredRelativeSingleField['field']
	/**
	 * Enables multi-selection mode.
	 * */
	isMulti?: boolean
}

/**
 * Props {@link DimensionsSwitcherProps}.
 *
 * `DimensionsSwitcher` is a UI component for switching between different dimensions of data.
 *
 * #### Example: Basic usage
 * ```tsx
 * <DimensionsSwitcher
 *   dimension="locale"
 *   slugField="code"
 *   options="DimensionsLocale"
 * >
 *   <Field field="label" />
 * </DimensionsSwitcher>
 * ```
 *
 * #### Example: With initial sorting and multi-selection
 * ```tsx
 * <DimensionsSwitcher
 *   dimension="locale"
 *   slugField="code"
 *   options="DimensionsLocale"
 *   orderBy={{ label: 'desc' }}
 *   isMulti
 * >
 *   <Field field="label" />
 * </DimensionsSwitcher>
 * ```
 */
export const DimensionsSwitcher = Component<DimensionsSwitcherProps>(props => (
	<DataView entities={props.options} initialSorting={props.orderBy}>
		<DataViewLoaderState initial refreshing>
			<Loader position="static" />
		</DataViewLoaderState>

		<DataViewLoaderState loaded>
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline" size="sm">
						<DimensionSwitcherCurrentValues dimension={props.dimension} slugField={props.slugField}>
							{props.children}
						</DimensionSwitcherCurrentValues>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="p-2" align="start">
					<div className="flex flex-col gap-1">
						<DataViewEachRow>
							<DimensionSwitcherItem dimension={props.dimension} slugField={props.slugField} isMulti={props.isMulti}>
								{props.children}
								<StaticRender>
									<Field field={props.slugField} />
								</StaticRender>
							</DimensionSwitcherItem>
						</DataViewEachRow>
					</div>
				</PopoverContent>
			</Popover>
		</DataViewLoaderState>
	</DataView>
))

interface DimensionSwitcherCurrentValuesProps {
	children: ReactNode
	dimension: string
	slugField: SugaredRelativeSingleField['field']
}

const DimensionSwitcherCurrentValues = ({ children, dimension, slugField }: DimensionSwitcherCurrentValuesProps) => {
	const entitiesBySlug = useDimensionEntitiesBySlug(slugField)
	const [defaultValue] = Object.keys(entitiesBySlug)
	const currentDimensionValue = useDimensionState({
		dimension,
		defaultValue,
		storage: 'local',
	})

	const values = useMemo(() => currentDimensionValue.map(it => entitiesBySlug[it]).filter(Boolean), [currentDimensionValue, entitiesBySlug])

	return (
		<div className="flex gap-1">
			{values.map(it => (
				<Entity key={it.key} accessor={it}>
					<div className={'gap-1 group text-black text-left inline-flex items-center px-1 text-sm border-b border-gray-200'}>
						<span>{children}</span>
					</div>
				</Entity>
			))}
		</div>
	)
}

interface DimensionSwitcherItemProps {
	children: ReactNode
	dimension: string
	slugField: SugaredRelativeSingleField['field']
	isMulti?: boolean
}

const DimensionSwitcherItem = ({ children, dimension, slugField, isMulti }: DimensionSwitcherItemProps) => {
	const entity = useEntity()
	const slugValue = entity.getField<string>(slugField).value

	if (!slugValue) {
		return null
	}

	return (
		<DimensionLink dimension={dimension} value={slugValue} action={isMulti ? 'toggle' : 'set'}>
			<a className={'gap-1 group text-gray-800 text-left inline-flex items-center px-1 py-1 text-sm rounded-sm transition-all hover:bg-accent hover:text-accent-foreground group data-[active]:text-black'}>
				<CheckIcon className={'w-3 h-3 hidden group-data-[active]:block'} />
				<span className={'w-3 h-3 group-data-[active]:hidden'} />
				<span>{children}</span>
			</a>
		</DimensionLink>
	)
}


/**
 * Props for the {@link SideDimensions} component.
 */
export interface SideDimensionsProps {
	/**
	 * The name of the dimension to render.
	 */
	dimension: string
	/**
	 * The name of the dimension to use in the context.
	 */
	as: string
	/**
	 * The field to filter by.
	 */
	field: SugaredRelativeSingleEntity['field']
	/**
	 * Child components or fields to render within the dimension selector.
	 */
	children: ReactNode
}

/**
 * Props {@link SideDimensionsProps}.
 *
 * `SideDimensions` is a layout component that renders a dimension within a flexible side panel.
 * It wraps its content inside a `DimensionRenderer` and `HasOne` field relationship.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <SideDimensions
 *   dimension="locale"
 *   as="currentLocale"
 *   field="locales(locale.code = $currentLocale)"
 * >
 *   <InputField field="title" />
 * </SideDimensions>
 * ```
 */
export const SideDimensions = Component<SideDimensionsProps>(({ dimension, children, as, field }) => {
	return (
		<div className="flex mt-4 gap-4">
			<DimensionRenderer dimension={dimension} as={as}>
				<HasOne field={field}>
					<div className="flex-1">
						{children}
					</div>
				</HasOne>
			</DimensionRenderer>
		</div>
	)
})


const useDimensionEntitiesBySlug = (slugField: SugaredRelativeSingleField['field']): Record<string, EntityAccessor> => {
	const accessor = useDataViewEntityListAccessor()
	return useMemo(() => Object.fromEntries(Array.from(accessor ?? []).map(it => [it.getField<string>(slugField).value, it])), [accessor, slugField])
}
