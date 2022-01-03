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
		const classPrefix = useClassNamePrefix()
		return (
			<div className={`${classPrefix}slugInput`}>
				{prefix && (
					<div className={`${classPrefix}slugInput-prefix`}>
						{link ?
							<a href={link} className={`${classPrefix}slugInput-prefixLink`} target={'_blank'}>{prefix}</a> : prefix}
					</div>
				)}
				<div className={`${classPrefix}slugInput-input`}>
					<TextInput {...textInputProps} ref={inputRef} />
					{(overlay || onOverlayClick) ? (
						<div className={`${classPrefix}slugInput-overlay`} onClick={onOverlayClick}>
							{overlay}
						</div>
					) : null}
				</div>
			</div>
		)
	},
)
