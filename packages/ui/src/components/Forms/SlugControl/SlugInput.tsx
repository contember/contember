import { memo, ReactNode, Ref } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import { SingleLineTextInputProps, TextInput } from '../TextInput'

export type SlugInputProps =
	& SingleLineTextInputProps
	& {
		link?: string
		prefix?: string
		overlay?: ReactNode
		onOverlayClick?: () => void
		inputRef?: Ref<HTMLInputElement | undefined>
	}

export const SlugInput = memo<SlugInputProps>(({ prefix, link, overlay, onOverlayClick, inputRef, ...textInputProps }) => {
		const componentClassName = `${useClassNamePrefix()}slug-input`

		return (
			<div className={`${componentClassName}`}>
				{prefix && (
					<div className={`${componentClassName}-prefix`}>
						{link ?
							<a href={link} className={`${componentClassName}-prefix-link`} target={'_blank'}>{prefix}</a> : prefix}
					</div>
				)}
				<div className={`${componentClassName}-input`}>
					<TextInput {...textInputProps} ref={inputRef} />
					{(overlay || onOverlayClick) ? (
						<div className={`${componentClassName}-overlay`} onClick={onOverlayClick}>
							{overlay}
						</div>
					) : null}
				</div>
			</div>
		)
	},
)
