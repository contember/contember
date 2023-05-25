import { useClassName } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { UrlInputProps } from './Types'

/**
 * @group Forms UI
 */
export const UrlInput = memo(forwardRef<HTMLInputElement, UrlInputProps>(({
	className,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'url-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input {...props} type="url" />
}))
UrlInput.displayName = 'UrlInput'
