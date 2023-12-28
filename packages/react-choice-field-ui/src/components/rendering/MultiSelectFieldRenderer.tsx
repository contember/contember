import { EntityAccessor, useLabelMiddleware } from '@contember/react-binding'
import { useAccessorErrors } from '@contember/react-binding-ui'
import { BaseDynamicChoiceField, ChoiceFieldSingleOption, DynamicMultiChoiceFieldRendererProps } from '@contember/react-choice-field'
import {
	FieldContainer,
	FieldContainerProps,
	PublicCommonReactSelectStylesProps,
	SelectCreateNewWrapper,
	usePortalProvider,
} from '@contember/ui'
import { shouldCancelStart } from '@contember/utilities'
import { MouseEventHandler, ReactElement, memo, useCallback } from 'react'
import type { MultiValueGenericProps, MultiValueProps, Props as SelectProps } from 'react-select'
import Select, { ActionMeta, components } from 'react-select'
import { SortEndHandler, SortableContainer, SortableContainerProps, SortableElement, SortableHandle } from 'react-sortable-hoc'
import { useCommonReactSelectProps } from '../../hooks/useCommonReactSelectProps'
import { useOpenCreateNewDialog } from '../../hooks/useOpenCreateNewDialog'


export type MultiSelectFieldRendererPublicProps =
	& Pick<
		FieldContainerProps,
		| 'description'
		| 'gap'
		| 'label'
		| 'labelDescription'
		| 'labelPosition'
		| 'required'
		| 'size'
		| 'useLabelElement'
		| 'style'
		| 'className'
	>
	& PublicCommonReactSelectStylesProps
	& {
		placeholder?: string
		reactSelectProps?: Partial<SelectProps<any, boolean, never>>
		createNewForm?: ReactElement
	}

export type MultiSelectFieldRendererProps =
	& MultiSelectFieldInnerProps
	& BaseDynamicChoiceField

/**
 * @internal
 */
export const MultiSelectFieldRenderer = memo((props: MultiSelectFieldRendererProps) => {
	const onAddNew = useOpenCreateNewDialog({ ...props, createNewForm: props.createNewForm, connect: props.onAdd })

	return <MultiSelectFieldInner {...props} onAddNew={onAddNew} />
})
export type MultiSelectFieldInnerProps =
	& DynamicMultiChoiceFieldRendererProps
	& MultiSelectFieldRendererPublicProps
	& {
		onAddNew?: () => void
	}

/**
 * @internal
 */
export const MultiSelectFieldInner = memo(({
	currentValues,
	data,
	errors,
	onAdd,
	onClear,
	onRemove,
	reactSelectProps,
	placeholder,
	menuZIndex,
	onMove,
	onSearch,
	isLoading,
	createNewForm: _INTENTIONALLY_OMITTED_createNewForm,
	onAddNew,
	...props
}: MultiSelectFieldInnerProps) => {
	const errorsFormatted = useAccessorErrors(errors)
	const labelMiddleware = useLabelMiddleware()
	const selectProps = useCommonReactSelectProps<EntityAccessor>({
		reactSelectProps,
		placeholder,
		data,
		isInvalid: (errors?.length ?? 0) > 0,
		menuZIndex,
		onSearch,
	})

	const selectOnChange = useCallback((newValue: unknown, actionMeta: ActionMeta<ChoiceFieldSingleOption<EntityAccessor>>) => {
		if (actionMeta.action === 'select-option') {
			onAdd(actionMeta.option!.value)
		} else if (actionMeta.action === 'remove-value') {
			onRemove(actionMeta.removedValue!.value)
		} else if (actionMeta.action === 'pop-value' && currentValues.length > 0) {
			onRemove(currentValues[currentValues.length - 1].value)
		} else if (actionMeta.action === 'clear') {
			onClear()
		}
	}, [currentValues, onAdd, onClear, onRemove])

	const allSelectProps: SelectProps<ChoiceFieldSingleOption<EntityAccessor>, boolean, never> = {
		...selectProps,
		isMulti: true,
		isClearable: true,
		closeMenuOnSelect: false,
		value: currentValues,
		onChange: selectOnChange,
		isLoading,
	}
	const onSortEnd = useCallback<SortEndHandler>(({ oldIndex, newIndex }) => {
		onMove?.(oldIndex, newIndex)
	}, [onMove])

	const portalProvider = usePortalProvider()
	return (
		<FieldContainer
			{...props}
			errors={errorsFormatted}
			label={labelMiddleware(props.label)}
		>
			<SelectCreateNewWrapper onClick={onAddNew}>
				{onMove
					? <SortableSelect
						{...allSelectProps}
						useDragHandle
						axis="xy"
						onSortEnd={onSortEnd}
						distance={4}
						helperContainer={portalProvider}
						helperClass={'sortable-dragged'}
						shouldCancelStart={shouldCancelStart}
						components={{
							...selectProps.components,
							MultiValue: SortableMultiValue,
							MultiValueLabel: SortableMultiValueLabel,
						} as any}
					/>
					: <Select {...allSelectProps} />
				}
			</SelectCreateNewWrapper>
		</FieldContainer>
	)
})

const SortableSelect = SortableContainer(Select) as React.ComponentClass<SelectProps<ChoiceFieldSingleOption<any>, boolean, never> & SortableContainerProps>
const SortableMultiValue = SortableElement(
	(props: MultiValueProps<any, boolean, never>) => {
		// this prevents the menu from being opened/closed when the user clicks
		// on a value to begin dragging it. ideally, detecting a click (instead of
		// a drag) would still focus the control and toggle the menu, but that
		// requires some magic with refs that are out of scope for this example
		const onMouseDown: MouseEventHandler<HTMLDivElement> = e => {
			e.preventDefault()
			e.stopPropagation()
		}
		const innerProps = { ...props.innerProps, onMouseDown }
		return <components.MultiValue {...props} innerProps={innerProps} />
	},
)

const SortableMultiValueLabel = SortableHandle(
	(props: MultiValueGenericProps<any, boolean, never>) => <components.MultiValueLabel {...props} />,
)
