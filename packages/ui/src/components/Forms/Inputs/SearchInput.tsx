import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { SearchInputProps } from './Types'

/**
 * @group Forms UI
 */
export const SearchInput = memo(forwardRef<HTMLInputElement, SearchInputProps>(({
	className,
	focusRing = true,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	deprecate('1.4.0', withTopToolbar !== undefined, '`withTopToolbar` prop', null)

	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'search-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input
		data-focus-ring={dataAttribute(focusRing)}
		autoCorrect="off"
		autoCapitalize="off"
		autoComplete="off"
		spellCheck="false"
		{...props}
		type="search"
	/>
}))
SearchInput.displayName = 'SearchInput'
