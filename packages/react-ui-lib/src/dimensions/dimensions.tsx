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
import { Loader } from '@contember/react-ui-lib-base'
import { Popover, PopoverContent, PopoverTrigger } from '@contember/react-ui-lib-base'
import { Button } from '@contember/react-ui-lib-base'
import { DimensionLabelUI, DimensionLabelWrapperUI } from '@contember/react-ui-lib-base'

/**
 * Props for the {@link DimensionsSwitcher} component.
 */
export type DimensionsSwitcherProps = {
	/**
	 * Entity list for dimension options.
	 */
	options: SugaredQualifiedEntityList['entities']
	/**
	 * Specifies initial sorting of the options (e.g., `{ label: 'desc' }`).
	 */
	orderBy?: DataViewSortingDirections
	/**
	 * The name of the dimension to switch.
	 */
	dimension: string
	/**
	 * Child components or fields to render within the dimension selector.
	 */
	children: ReactNode
	/**
	 * Field containing unique dimension identifiers.
	 */
	slugField: SugaredRelativeSingleField['field']
	/**
	 * Enables multi-selection mode.
	 */
	isMulti?: boolean
}

/**
 * `DimensionsSwitcher` is a UI component for switching between different dimensions of data.
 *
 * ## Example: Basic usage
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
 * ## Example: With initial sorting and multi-selection
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

const DimensionSwitcherCurrentValues = (
	{ children, dimension, slugField }: { children: ReactNode; dimension: string; slugField: SugaredRelativeSingleField['field'] },
) => {
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

const DimensionSwitcherItem = (
	{ children, dimension, slugField, isMulti }: {
		children: ReactNode
		dimension: string
		slugField: SugaredRelativeSingleField['field']
		isMulti?: boolean
	},
) => {
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
		{label}
		<DimensionLabelUI>{dimensionValue}</DimensionLabelUI>
	</DimensionLabelWrapperUI>
)

export type RenderLabelProps = {
	label: ReactNode
	dimensionValue: string | null
}

/**
 * Props for the {@link SideDimensions} component.
 */
export type SideDimensionsProps = {
	/**
	 * The name of the dimension to render.
	 */
	dimension: string
	/**
	 * The name of the dimension variable to expose in the context.
	 */
	as: string
	/**
	 * The field to traverse via `HasOne` relationship.
	 */
	field: SugaredRelativeSingleEntity['field']
	/**
	 * Child components or fields to render within the dimension selector.
	 */
	children: ReactNode
	/**
	 * Optional custom label renderer. Receives the label and the current dimension value.
	 */
	renderLabel?: ({ label, dimensionValue }: RenderLabelProps) => ReactNode
}

/**
 * `SideDimensions` is a layout component that renders content for a specific dimension
 * within a flexible side panel. It wraps its content inside a `DimensionRenderer` and `HasOne` field relationship.
 *
 * ## Example: Basic Usage
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
export const SideDimensions = Component<SideDimensionsProps>(({ dimension, children, as, field, renderLabel }) => (
	<div className="flex mt-4 gap-4">
		<DimensionRenderer dimension={dimension} as={as}>
			<LabelMiddlewareProvider
				value={(label, environment) => {
					const dimensionValue = environment.getVariableOrElse(as, null) as string | null
					const Component = renderLabel || DimensionLabel

					return <Component label={label} dimensionValue={dimensionValue} />
				}}
			>
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
