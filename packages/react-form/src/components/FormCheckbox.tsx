import * as React from 'react'
import { ChangeEventHandler, ReactElement, useCallback, useEffect } from 'react'
import {
	Component,
	Field,
	OptionallyVariableFieldValue,
	SugaredRelativeSingleField,
	TreeNodeEnvironmentFactory,
	useField,
} from '@contember/react-binding'
import { useFormFieldState } from '../contexts'
import { dataAttribute } from '@contember/utilities'
import { useFormInputValidationHandler } from '../hooks'
import { Slot } from '@radix-ui/react-slot'

const SlotInput = Slot as React.ForwardRefExoticComponent<React.RefAttributes<HTMLInputElement> & React.InputHTMLAttributes<HTMLInputElement>>

export interface FormCheckboxProps {
	field: SugaredRelativeSingleField['field']
	isNonbearing?: boolean
	defaultValue?: OptionallyVariableFieldValue
	children: ReactElement<HTMLInputElement, 'input'>
}

export const FormCheckbox = Component<FormCheckboxProps>(({ field, isNonbearing, defaultValue, ...props }) => {
	const accessor = useField<boolean>(field)

	const formState = useFormFieldState()
	const id = formState?.htmlId
	const hasErrors = (formState?.errors.length ?? accessor.errors?.errors?.length ?? 0) > 0
	const dirty = formState?.dirty ?? accessor.hasUnpersistedChanges
	const value = accessor.value
	const accessorGetter = accessor.getAccessor
	const { ref, onFocus, onBlur } = useFormInputValidationHandler(accessor)
	const [checkboxRef, setCheckboxRef] = React.useState<HTMLInputElement | null>(null)

	useEffect(() => {
		if (!checkboxRef) {
			return
		}
		checkboxRef.indeterminate = value === null
	}, [checkboxRef, ref, value])

	return (
		<SlotInput
			ref={it => {
				(ref as any).current = checkboxRef
				setCheckboxRef(it)
			}}
			type="checkbox"
			checked={accessor.value === true}
			data-state={value === null ? 'indeterminate' : (value ? 'checked' : 'unchecked')}
			data-invalid={dataAttribute(hasErrors)}
			data-dirty={dataAttribute(dirty)}
			id={id ? `${id}-input` : undefined}
			onFocus={onFocus}
			onBlur={onBlur}
			onChange={useCallback<ChangeEventHandler<HTMLInputElement>>(e => {
				accessorGetter().updateValue(e.target.checked)
			}, [accessorGetter])}
			{...props}
		/>
	)
}, ({ field, isNonbearing, defaultValue }, env) => {
	const node = TreeNodeEnvironmentFactory.createEnvironmentForField(env, { field }).getSubTreeNode()
	const resolvedDefaultValue = defaultValue !== undefined ? defaultValue : (node.field.defaultValue ?? (node.field.nullable ? null : false))

	return <Field field={field} isNonbearing={isNonbearing} defaultValue={resolvedDefaultValue} />
})
