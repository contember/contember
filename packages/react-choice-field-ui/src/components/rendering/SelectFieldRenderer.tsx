import { EntityAccessor, useLabelMiddleware } from '@contember/react-binding'
import {
	FieldContainer,
	FieldContainerProps,
	PublicCommonReactSelectStylesProps,
	SelectCreateNewWrapper,
	usePortalProvider,
} from '@contember/ui'
import { ComponentType, memo, ReactElement } from 'react'
import type { Props as SelectProps } from 'react-select'
import Select from 'react-select'
import { useAccessorErrors } from '@contember/react-binding-ui'
import { ChoiceFieldSingleOption, SingleChoiceFieldRendererProps, ChoiceFieldProps, BaseDynamicChoiceField } from '@contember/react-choice-field'
import { useCommonReactSelectProps } from '../../hooks/useCommonReactSelectProps'
import { useOpenCreateNewDialog } from '../../hooks/useOpenCreateNewDialog'


export type SelectFieldRendererPublicProps =
	& Omit<FieldContainerProps, 'children' | 'errors'>
	& PublicCommonReactSelectStylesProps
	& {
		placeholder?: string
		allowNull?: boolean
		reactSelectProps?: Partial<SelectProps<any>>
		createNewForm?: ReactElement
	}

export type SelectFieldRendererProps<T = unknown> =
	& SelectFieldInnerProps<T>
	& ChoiceFieldProps


const typedMemo: <T>(component: T) => T = memo

/**
 * @internal
 */
export const SelectFieldRenderer = memo(<T = unknown>({
	createNewForm,
	...props
}: SelectFieldRendererProps<T>) => {
	let onAddNew: undefined | (() => void) = undefined
	if (!Array.isArray(props.options)) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		onAddNew = useOpenCreateNewDialog({
			...(props as BaseDynamicChoiceField),
			createNewForm,
			connect: props.onSelect as SingleChoiceFieldRendererProps<EntityAccessor>['onSelect'],
		})
	}
	return <SelectFieldInner<T> {...props} onAddNew={onAddNew} />
})
SelectFieldRenderer.displayName = 'SelectFieldRenderer'


export type SelectFieldInnerProps<T = unknown> =
	& SingleChoiceFieldRendererProps<T>
	& SelectFieldRendererPublicProps
	& {
		onAddNew?: () => void
	}

export const SelectFieldInner = typedMemo(<T = unknown>({
	placeholder,
	allowNull,
	currentValue,
	data,
	errors,
	// supressErrors,
	menuZIndex,
	onSelect,
	onClear,
	reactSelectProps,
	onSearch,
	isLoading,
	createNewForm,
	onAddNew,
	...props
}: SelectFieldInnerProps<T>) => {
	const errorsFormatted = useAccessorErrors(errors)
	const selectProps = useCommonReactSelectProps({
		reactSelectProps,
		placeholder,
		data,
		isInvalid: (errors?.length ?? 0) > 0,
		onSearch,
		menuZIndex,
	})

	const labelMiddleware = useLabelMiddleware()
	return (
		<FieldContainer
			{...props}
			errors={errorsFormatted}
			label={labelMiddleware(props.label)}
		>
			<SelectCreateNewWrapper onClick={onAddNew}>
				<Select
					{...selectProps}
					menuPlacement="auto"
					isClearable={allowNull === true}
					value={currentValue}
					isLoading={isLoading}
					onChange={(newValue, actionMeta) => {
						const value = newValue as ChoiceFieldSingleOption<T>
						if (actionMeta.action === 'select-option') {
							onSelect(value.value)
						} else if (actionMeta.action === 'clear') {
							onClear()
						}
					}}
				/>
			</SelectCreateNewWrapper>
		</FieldContainer>
	)
})

