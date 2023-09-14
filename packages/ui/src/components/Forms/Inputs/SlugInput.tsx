import { useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { colorSchemeClassName, dataAttribute, deprecate, isDefined, themeClassName } from '@contember/utilities'
import { ReactNode, forwardRef, memo } from 'react'
import { TextInput, TextInputProps } from '../Inputs'
export type SlugInputProps =
	& TextInputProps
	& {
		link?: string
		prefix?: string
		overlay?: ReactNode
		onOverlayClick?: () => void
	}

/**
 * @group Forms UI
 */
export const SlugInput = memo(forwardRef<HTMLInputElement, SlugInputProps>(({
	prefix,
	link,
	overlay,
	focusRing = true,
	onOverlayClick,
	withTopToolbar,
	...textInputProps
}, ref) => {
	deprecate('1.4.0', isDefined(withTopToolbar), '`withTopToolbar` prop', null)

	const componentClassName = useClassNameFactory('slug-input')
	const intent = textInputProps.validationState === 'invalid' ? 'danger' : undefined

	return (
		<div data-focus-ring={dataAttribute(focusRing)} className={componentClassName(null, [...themeClassName(intent), colorSchemeClassName(useColorScheme())])}>
			{prefix && (
				<div className={componentClassName('prefix')}>
					{link ?
						<a href={link} className={componentClassName('prefix-link')} target="_blank" rel="noopener noreferrer">{prefix}</a> : prefix}
				</div>
			)}
			<div className={componentClassName('input')}>
				<TextInput focusRing={false} {...textInputProps} distinction={prefix ? 'seamless' : textInputProps.distinction} ref={ref} />
				{(overlay || onOverlayClick) ? (
					<div className={componentClassName('overlay')} onClick={onOverlayClick}>
						{overlay}
					</div>
				) : null}
			</div>
		</div>
	)
}))
SlugInput.displayName = 'Interface.SlugInput'
