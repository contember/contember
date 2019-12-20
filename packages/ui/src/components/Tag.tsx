import * as React from 'react'
import { useClassNamePrefix } from '../auxiliary'

export interface TagProps {
	onRemove?: () => void
	children: React.ReactNode
}

export const Tag = React.memo<TagProps>(({ children, onRemove }) => {
	const prefix = useClassNamePrefix()
	return (
		<span className={`${prefix}tag`}>
			<span className={`${prefix}tag-text`}>{children}</span>
			{onRemove && (
				<button type="button" className={`${prefix}tag-remove`} onClick={onRemove}>
					×
				</button>
			)}
		</span>
	)
})
Tag.displayName = 'Tag'
