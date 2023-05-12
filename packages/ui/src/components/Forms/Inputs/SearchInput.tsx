import { useClassName } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { SearchInputProps } from './Types'

/**
 * @group Forms UI
 */
export const SearchInput = memo(forwardRef<HTMLInputElement, SearchInputProps>(({
	className,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'search-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input
		autoCorrect="off"
		autoCapitalize="off"
		autoComplete="off"
		spellCheck="false"
		{...props}
		type="search"
	/>
}))
SearchInput.displayName = 'SearchInput'
