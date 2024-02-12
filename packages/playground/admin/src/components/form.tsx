import * as React from 'react'
import {
	ChangeEventHandler,
	ComponentProps,
	ComponentType,
	ReactNode,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
} from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Label } from './label'
import {
	Component,
	Field,
	FieldAccessor,
	OptionallyVariableFieldValue,
	SchemaColumn,
	SchemaKnownColumnType,
	SugaredRelativeSingleField,
	useEntityBeforePersist,
	useField,
} from '@contember/interface'
import { Input } from './ui/input'
import { uic } from '../utils/uic'
import { createRequiredContext } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { useErrorFormatter } from './errors'
import { cn } from '../utils/cn'

interface FormFieldContextValue {
	field: SugaredRelativeSingleField['field']
	id: string
}

const [FormFieldContext, useFormField] = createRequiredContext<FormFieldContextValue>('FormFieldContext')

interface FormFieldProps {
	field: SugaredRelativeSingleField['field']
	children: React.ReactNode
}

const FormField = ({ field, children }: FormFieldProps) => {
	const id = useId()
	return (
		<FormFieldContext.Provider value={{ field, id }}>
			{children}
		</FormFieldContext.Provider>
	)
}

const FormDescriptionUI = uic('p', {
	baseClass: 'text-[0.8rem] text-muted-foreground',
	displayName: 'FormDescription',
})

const FormErrorUI = uic('p', {
	baseClass: 'text-[0.8rem] font-medium text-destructive',
	displayName: 'FormError',
})
const FormLabelUI = uic(Label, {
	baseClass: 'data-[invalid]:text-destructive',
	displayName: 'FormLabel',
})

const FormError = (props: {
	children: React.ReactElement
}) => {
	const { field, id } = useFormField()
	const accessor = useField(field)
	const errorFormatter = useErrorFormatter()
	const errors = useMemo(() => errorFormatter(accessor.errors?.errors ?? []), [accessor.errors, errorFormatter])

	return errors.map((it, index) => {
		return React.cloneElement(props.children, {
			key: index,
			...{ id: `${id}-error-${index}` },
			children: it.message,
		})
	})
}

const FormLabel = (props: {
	children: React.ReactElement
}) => {
	const { field, id } = useFormField()
	const accessor = useField(field)

	return (
		<Slot
			data-invalid={dataAttribute(accessor.errors?.errors?.length ?? 0 > 0)}
			{...{ htmlFor: `${id}-input` }}
			{...props}
		/>
	)
}

type ColumnTypeHandlerFactory = (column: SchemaColumn) => {
	parseValue: (value: string) => any
	formatValue: (value: any) => string
	defaultInputProps?: React.InputHTMLAttributes<HTMLInputElement>
}
const ColumnTypeHandlerFactories: Record<SchemaKnownColumnType, ColumnTypeHandlerFactory> = {
	Integer: () => ({
		parseValue: (value: string) => {
			if (value === '') {
				return null
			}
			const parsed = parseInt(value, 10)
			return isNaN(parsed) ? null : parsed
		},
		formatValue: (value: number | null) => {
			return value === null ? '' : value.toString(10)
		},
		defaultInputProps: {
			type: 'number',
		},
	}),
	Double: () => ({
		parseValue: (value: string) => {
			if (value === '') {
				return null
			}
			const parsed = parseFloat(value)
			return isNaN(parsed) ? null : parsed
		},
		formatValue: (value: number | null) => {
			return value === null ? '' : value.toString(10)
		},
		defaultInputProps: {
			type: 'number',
		},
	}),
	String: () => ({
		parseValue: (value: string) => value,
		formatValue: (value: string | null) => value ?? '',
	}),
	Date: () => ({
		parseValue: (value: string) => {
			if (value === '') {
				return null
			}
			const parsed = Date.parse(value)
			return isNaN(parsed) ? null : new Date(parsed)
		},
		formatValue: (value: string | null) => {
			const parsed = value ? Date.parse(value) : null
			return !parsed || isNaN(parsed) ? '' : new Date(parsed).toISOString().split('T')[0]
		},
		defaultInputProps: {
			type: 'date',
		},
	}),
	DateTime: () => ({
		parseValue: (value: string) => {
			if (value === '') {
				return null
			}
			const parsed = Date.parse(value)
			return isNaN(parsed) ? null : new Date(parsed)
		},
		formatValue: (value: string | null) => {
			const parsed = value ? Date.parse(value) : null
			return !parsed || isNaN(parsed) ? '' : new Date(parsed).toISOString().substring(0, 16)
		},
		defaultInputProps: {
			type: 'datetime-local',
		},
	}),
	Bool: () => {
		throw new Error('Boolean column type is not supported yet')
	},
	Enum: () => {
		throw new Error('Enum column type is not supported yet')
	},
	Uuid: () => {
		throw new Error('UUID column type is not supported yet')
	},
}

const useFormInputHandler = (field: FieldAccessor) => {
	return useMemo(() => {
		const schema = field.schema
		const columnType = schema.type
		const handlerFactory = ColumnTypeHandlerFactories[columnType as SchemaKnownColumnType]
		if (!handlerFactory) {
			throw new Error(`Column type ${columnType} is not supported yet`)
		}
		return handlerFactory(schema)
	}, [field.schema])

}

type InputProps = React.JSX.IntrinsicElements['input']
const SlotInput = Slot as ComponentType<InputProps>

const useFormInputValidationHandler = (field: FieldAccessor) => {
	const accessorGetter = field.getAccessor
	const validationMessage = useRef<string>()
	const [focus, setFocus] = React.useState(false)
	const inputRef = React.useRef<HTMLInputElement>(null)
	useEntityBeforePersist(useCallback(() => {
		if (validationMessage.current) {
			accessorGetter().addError(validationMessage.current)
		}
	}, [accessorGetter]))

	useEffect(() => {
		if (!inputRef.current) {
			return
		}
		const input = inputRef.current
		const valid = input.validity?.valid
		const message = valid ? undefined : input?.validationMessage
		if (message !== validationMessage.current) {
			validationMessage.current = message
			if (!message || !focus) {
				accessorGetter().clearErrors()
			}
			if (!focus && message) {
				accessorGetter().addError(message)
			}
		}
	})

	return {
		ref: inputRef,
		onFocus: useCallback(() => {
			setFocus(true)
		}, []),
		onBlur: useCallback(() => {
			setFocus(false)
			accessorGetter().clearErrors()
			if (validationMessage.current) {
				accessorGetter().addError(validationMessage.current)
			}
		}, [accessorGetter]),
	}
}

const FormInput = (props: {
	children: React.ReactElement
}) => {
	const { field, id } = useFormField()
	const accessor = useField(field)
	const { parseValue, formatValue, defaultInputProps } = useFormInputHandler(accessor)
	const accessorGetter = accessor.getAccessor
	const { ref, onFocus, onBlur } = useFormInputValidationHandler(accessor)

	return (
		<SlotInput
			ref={ref}
			value={formatValue(accessor.value)}
			data-invalid={dataAttribute(accessor.errors?.errors?.length ?? 0 > 0)}
			onFocus={onFocus}
			onBlur={onBlur}
			onChange={useCallback<ChangeEventHandler<HTMLInputElement>>(e => {
				accessorGetter().updateValue(parseValue(e.target.value))
			}, [accessorGetter, parseValue])}
			{...defaultInputProps}
			id={`${id}-input`}
			{...props}
		/>
	)
}

export const InputField = Component(({ field, label, description, isNonbearing, defaultValue, inputProps }: {
	field: SugaredRelativeSingleField['field']
	isNonbearing?: boolean
	defaultValue?: OptionallyVariableFieldValue
	label: ReactNode | undefined
	description?: ReactNode
	inputProps?: ComponentProps<typeof Input>
}) => (
	<FormField field={field}>
		<div className="grid grid-cols-1 md:grid-cols-[12rem,1fr] gap-x-4 gap-y-2">
			<div className={'flex md:justify-end md:items-center'}>
				{label && <FormLabel>
					<FormLabelUI>
						{label}
					</FormLabelUI>
				</FormLabel>}
			</div>
			<div>
				<FormInput>
					<Input {...inputProps} className={cn('max-w-md', inputProps?.className)}/>
				</FormInput>
			</div>
			<div></div>
			<div>
				{description && <FormDescriptionUI>
					{description}
				</FormDescriptionUI>}

				<FormError>
					<FormErrorUI/>
				</FormError>
			</div>
		</div>
	</FormField>
), ({ field, isNonbearing, defaultValue }) => {
	return <Field field={field} isNonbearing={isNonbearing} defaultValue={defaultValue}/>
})
