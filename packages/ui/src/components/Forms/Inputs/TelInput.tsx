import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { TelInputProps } from './Types'

/**
 * @group Forms UI
 */
export const TelInput = memo(forwardRef<HTMLInputElement, TelInputProps>(({
	className,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: classNames(
			useComponentClassName('text-input'),
			useComponentClassName('tel-input'),
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		),
	}, forwardedRed)

	return <input {...props} type="tel" />
}))
TelInput.displayName = 'TelInput'
