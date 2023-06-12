import { useClassNameFactory } from '@contember/utilities'
import { memo, ReactNode } from 'react'

export interface TagProps {
	onRemove?: () => void
	children: ReactNode
}

/**
 * @group UI
 */
export const Tag = memo<TagProps>(({ children, onRemove }) => {
	const componentClassName = useClassNameFactory('tag')

	return (
		<span className={componentClassName()}>
			<span className={componentClassName('text')}>{children}</span>
			{onRemove && (
				<button type="button" className={componentClassName('remove')} onClick={onRemove}>
					×
				</button>
			)}
		</span>
	)
})
Tag.displayName = 'Tag'
