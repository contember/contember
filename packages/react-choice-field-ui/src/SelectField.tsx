import { Component, useLabelMiddleware } from '@contember/react-binding'
import { FieldContainer, FieldContainerProps, FieldErrors, PublicCommonReactSelectStylesProps, SelectCreateNewWrapper, usePortalProvider } from '@contember/ui'
import { FunctionComponent, memo } from 'react'
import type { Props as SelectProps } from 'react-select'
import Select from 'react-select'
import { useAccessorErrors } from '@contember/react-binding-ui'
import { StaticSingleChoiceFieldProps, DynamicSingleChoiceFieldProps, ChoiceField, ChoiceFieldData } from '@contember/react-choice-field'

import { useCommonReactSelectProps } from './useCommonReactSelectProps'

export type SelectFieldProps =
	& SelectFieldInnerPublicProps
	& (
		| StaticSingleChoiceFieldProps
		| DynamicSingleChoiceFieldProps
	)

/**
 * @group Form Fields
 */
export const SelectField: FunctionComponent<SelectFieldProps> = Component(
	props => (
		<ChoiceField {...props} >
			{(choiceProps: ChoiceFieldData.SingleChoiceFieldMetadata<any>) => (
				<SelectFieldInner {...props} {...choiceProps} />
			)}
		</ChoiceField>
	),
	'SelectField',
)

export interface SelectFieldInnerPublicProps extends Omit<FieldContainerProps, 'children' | 'errors'> {
	placeholder?: string
	allowNull?: boolean
	reactSelectProps?: Partial<SelectProps<any>>
}

export type SelectFieldInnerProps =
	& ChoiceFieldData.SingleChoiceFieldMetadata
	& SelectFieldInnerPublicProps
	& PublicCommonReactSelectStylesProps

/**
 * @internal
 */
export const SelectFieldInner = memo(
	({
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
		onAddNew,
		onSearch,
		isLoading,
		...fieldContainerProps
	}: SelectFieldInnerProps) => {
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
				{...fieldContainerProps}
				errors={errorsFormatted}
				label={labelMiddleware(fieldContainerProps.label)}
			>
				<SelectCreateNewWrapper onClick={onAddNew}>
					<Select
						{...selectProps}
						menuPlacement="auto"
						menuPortalTarget={usePortalProvider()}
						isClearable={allowNull === true}
						value={currentValue}
						isLoading={isLoading}
						onChange={(newValue, actionMeta) => {
							const value = newValue as ChoiceFieldData.SingleOption
							if (actionMeta.action === 'select-option') {
								onSelect(value)
							} else if (actionMeta.action === 'clear') {
								onClear()
							}
						}}
					/>
				</SelectCreateNewWrapper>
			</FieldContainer>
		)
	},
)
SelectFieldInner.displayName = 'SelectFieldInner'
