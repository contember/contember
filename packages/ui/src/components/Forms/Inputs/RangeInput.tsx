import { useClassName } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { RangeInputProps } from './Types'

/**
 * @group Forms UI
 */
export const RangeInput = memo(forwardRef<HTMLInputElement, RangeInputProps>(({
	className,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'range-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input {...props} type="range" />
}))
RangeInput.displayName = 'RangeInput'
