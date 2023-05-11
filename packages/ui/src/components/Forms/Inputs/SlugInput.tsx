import { ForwardedRef, forwardRef, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
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
	onOverlayClick,
	...textInputProps
}, ref) => {
	const componentClassName = `${useClassNamePrefix()}slug-input`

	return (
		<div className={`${componentClassName}`}>
			{prefix && (
				<div className={`${componentClassName}-prefix`}>
					{link ?
						<a href={link} className={`${componentClassName}-prefix-link`} target="_blank" rel="noopener noreferrer">{prefix}</a> : prefix}
				</div>
			)}
			<div className={`${componentClassName}-input`}>
				<TextInput {...textInputProps} distinction={prefix ? 'seamless' : textInputProps.distinction} ref={ref} />
				{(overlay || onOverlayClick) ? (
					<div className={`${componentClassName}-overlay`} onClick={onOverlayClick}>
						{overlay}
					</div>
				) : null}
			</div>
		</div>
	)
}))
