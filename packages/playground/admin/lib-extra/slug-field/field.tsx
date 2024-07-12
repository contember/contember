import { FormContainer, FormContainerProps } from '@app/lib/form'
import * as React from 'react'
import { ComponentProps, forwardRef, ReactNode } from 'react'
import { Input, InputBare, InputLike } from '@app/lib/ui/input'
import { cn } from '@app/lib/utils'
import { FormFieldScope, FormInputProps } from '@contember/react-form'
import { Component } from '@contember/interface'
import { ExternalLinkIcon } from 'lucide-react'
import { FormSlugInput, SlugInputOwnProps } from '@app/lib-extra/slug-field/FormSlugInput'

export type SlugFieldProps =
	& Omit<FormInputProps, 'children'>
	& Omit<FormContainerProps, 'children'>
	& SlugInputOwnProps
	& {
		required?: boolean
		inputProps?: ComponentProps<typeof Input>
	}

export const SlugField = Component(({
	field,
	label,
	description,
	inputProps,
	required,
	...props
}: SlugFieldProps) => {
	return (
		<FormFieldScope field={field}>
			<FormContainer description={description} label={label}>
				<FormSlugInput field={field} {...props}>
					<SlugInput
						required={required} {...(inputProps ?? {})}
						className={cn('max-w-md', inputProps?.className)}
					/>
				</FormSlugInput>
			</FormContainer>
		</FormFieldScope>
	)
})


export type SlugInputProps =
	& Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>
	& {
		prefix?: ReactNode
		href?: string
	}

export const SlugInput = forwardRef<HTMLInputElement, SlugInputProps>(({ prefix, href, className, ...props }, ref) => {
	return (
		<InputLike className="relative">
			{prefix &&
				<span className="-my-2 -ml-2 text-gray-400 self-stretch py-1 pl-2 flex items-center">{prefix}</span>
			}
			<InputBare className={cn('pr-1', className)} {...props} ref={ref} />

			{href && <a className="ml-auto self-stretch flex items-center px-2 text-gray-600 bg-gray-50 rounded-r-md border-l hover:bg-gray-100 -my-2 -mr-2" href={href} target="_blank" rel="noreferrer">
					<ExternalLinkIcon className="h-4 w-4" />
				</a>}
		</InputLike>
	)
})
