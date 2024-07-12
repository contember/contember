import { FormContextValue } from '@contember/react-identity'
import { FormErrorUI } from '../../form'
import { Input } from '../../ui/input'
import { HTMLInputTypeAttribute, useState } from 'react'
import { dataAttribute } from '@contember/utilities'
import { Label } from '../../ui/label'

export interface TenantFormErrorsProps<CtxValue extends FormContextValue<any, any, any>> {
	form: CtxValue
	field?: keyof CtxValue['values']
	messages: Record<CtxValue extends FormContextValue<any, infer E> ? E : never, string>
}

export const TenantFormError = <CtxValue extends FormContextValue<any, any, any>>({ form, field, messages }: TenantFormErrorsProps<CtxValue>) => {
	return (
		<div>
			{form.errors
				.filter(error => error.field === field)
				.filter(it => !(it.code in messages && ((messages as any)[it.code] === undefined)))
				.map(error => [error.code, { error: (messages as any)[error.code] || 'Unknown error', developerMessage: error.developerMessage }])
				.map(([code, error]) => {
					return (<TenantFormSingleError key={code} {...error} />)
				})}
		</div>
	)
}

const TenantFormSingleError = ({ error, developerMessage }: { error: string; developerMessage?: string }) => {
	const [showDeveloperMessage, setShowDeveloperMessage] = useState(false)
	return <>
		<FormErrorUI>{error}</FormErrorUI>
		{/*{developerMessage && <div>*/}
		{/*	{showDeveloperMessage*/}
		{/*		? <div className="mt-1 text-xs font-light font-mono bg-gray-50 shadow-inner p-2 rounded border">{developerMessage}</div>*/}
		{/*		: <button className="text-xs underline" onClick={() => setShowDeveloperMessage(!showDeveloperMessage)}>Show details</button>}*/}
		{/*</div>}*/}
	</>
}

export type TenantFormInputProps<CtxValue extends FormContextValue<any, any, any>> =
	& {
		form: CtxValue
		type: HTMLInputTypeAttribute
		field: keyof CtxValue['values'] & string
	}
	& Omit<Partial<React.InputHTMLAttributes<HTMLInputElement>>, 'form' | 'field'>

export const TenantFormInput = <CtxValue extends FormContextValue<any, any, any>>({ form, field, ...props }: TenantFormInputProps<CtxValue>) => {
	return (
		<Input
			id={field}
			onChange={e => form.setValue(field, e.target.value)}
			value={form.values[field]}
			data-invalid={dataAttribute(form.errors.some(it => it.field === field))}
			{...props}
		/>
	)
}

export type TenantFormLabelProps<CtxValue extends FormContextValue<any, any, any>> =
	& {
		form: CtxValue
		field: keyof CtxValue['values'] & string
	}
	& Omit<Partial<React.LabelHTMLAttributes<HTMLLabelElement>>, 'form' | 'htmlFor'>

export const TenantFormLabel = <CtxValue extends FormContextValue<any, any, any>>({ form, field, ...props }: TenantFormLabelProps<CtxValue>) => {
	return (
		<Label
			htmlFor={field}
			data-invalid={dataAttribute(form.errors.some(it => it.field === field))}
			{...props}
		/>
	)
}

export type TenantFormFieldProps<CtxValue extends FormContextValue<any, any, any>> =
	& {
		form: CtxValue
		field: keyof CtxValue['values'] & string
		type: HTMLInputTypeAttribute
		messages: Record<CtxValue extends FormContextValue<any, infer E> ? E : never, string>
	}
	& Omit<Partial<React.InputHTMLAttributes<HTMLInputElement>>, 'form' | 'field'>

export const TenantFormField = <CtxValue extends FormContextValue<any, any, any>>({ form, field, type, messages, children, ...props }: TenantFormFieldProps<CtxValue>) => {
	return (
		<div className="flex flex-col gap-2">
			<TenantFormLabel form={form} field={field}>{children}</TenantFormLabel>
			<TenantFormInput form={form} field={field} type={type} {...props} />
			<TenantFormError form={form} field={field} messages={messages} />
		</div>
	)
}
