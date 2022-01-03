import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'

export interface SlugControlProps {
	children: ReactNode
	link?: string
	prefix?: string
	overlay?: ReactNode
	onOverlayClick?: () => void
}

export const SlugControl = memo<SlugControlProps>(({ children, prefix, link, overlay, onOverlayClick }) => {
	const classPrefix = useClassNamePrefix()
	return (
		<div className={`${classPrefix}slugControl`}>
			{prefix && (
				<div className={`${classPrefix}slugControl-prefix`}>
					{link ? <a href={link} className={`${classPrefix}slugControl-prefixLink`} target={'_blank'}>{prefix}</a> : prefix}
				</div>
			)}
			<div className={`${classPrefix}slugControl-input`}>
				{children}
				{(overlay || onOverlayClick) ? (
					<div className={`${classPrefix}slugControl-overlay`} onClick={onOverlayClick}>
						{overlay}
					</div>
				) : null}
			</div>
		</div>
	)
})
