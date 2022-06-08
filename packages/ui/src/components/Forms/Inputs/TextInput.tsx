import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import { ColorInput } from './ColorInput'
import { DateInput } from './DateInput'
import { DateTimeInput } from './DateTimeInput'
import { EmailInput } from './EmailInput'
import { MonthInput } from './MonthInput'
import { PasswordInput } from './PasswordInput'
import { RangeInput } from './RangeInput'
import { SearchInput } from './SearchInput'
import { TelInput } from './TelInput'
import { TimeInput } from './TimeInput'
import type { TextInputProps } from './Types'
import { UrlInput } from './UrlInput'
import { WeekInput } from './WeekInput'
import { useTextBasedInput } from '../hooks/useTextBasedInput'

export const InternalTextInput = memo(
	forwardRef<HTMLInputElement, TextInputProps>(({
		className,
		type,
		withTopToolbar,
		...outerProps
	}, forwardedRed) => {
		const props = useTextBasedInput<HTMLInputElement>({
			...outerProps,
			className: classNames(
				useComponentClassName('text-input'),
				toViewClass('withTopToolbar', withTopToolbar),
				className,
			),
		}, forwardedRed)

		return <input {...props} type="text" />
	}),
)
InternalTextInput.displayName = 'InternalTextInput'

export const TextInput = memo(
	forwardRef<HTMLInputElement, Omit<TextInputProps, 'type'> & {
		/**
		 * @deprecated Use specific component to address type
		 */
		type?: 'color' | 'date' | 'datetime' | 'datetime-local' | 'email' | 'month' | 'password' | 'range' | 'search' | 'tel' | 'time' | 'url' | 'week'
}>(({ type, ...props }, forwardedRed) => {
		switch (type) {
			case 'color': return <ColorInput ref={forwardedRed} {...props} />
			case 'date': return <DateInput ref={forwardedRed} {...props} />
			case 'datetime':
			case 'datetime-local':
				return <DateTimeInput ref={forwardedRed} {...props} />
			case 'email': return <EmailInput ref={forwardedRed} {...props} />
			case 'month': return <MonthInput ref={forwardedRed} {...props} />
			case 'password': return <PasswordInput ref={forwardedRed} {...props} />
			case 'range': return <RangeInput ref={forwardedRed} {...props} />
			case 'search': return <SearchInput ref={forwardedRed} {...props} />
			case 'tel': return <TelInput ref={forwardedRed} {...props} />
			case 'time': return <TimeInput ref={forwardedRed} {...props} />
			case 'url': return <UrlInput ref={forwardedRed} {...props} />
			case 'week': return <WeekInput ref={forwardedRed} {...props} />
			default:
				import.meta.env.DEV && type && console.warn(`Type '${type}' is not supported and fallbacks to <TextInput />.`)
		}

		if (import.meta.env.DEV && typeof type === 'string') {
			console.warn('`type` prop is deprecated, please use specific component to address type.')
		}

		return <InternalTextInput ref={forwardedRed} {...props} />
	}),
)
TextInput.displayName = 'TextInput'
