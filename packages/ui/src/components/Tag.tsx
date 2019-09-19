import * as React from 'react'

export interface TagProps {
	onRemove?: () => void
	children: React.ReactNode
}

export const Tag = React.memo<TagProps>(({ children, onRemove }) => (
	<span className="tag">
		<span className="tag-text">{children}</span>
		{onRemove && (
			<button type="button" className="tag-remove" onClick={onRemove}>
				×
			</button>
		)}
	</span>
))
Tag.displayName = 'Tag'
