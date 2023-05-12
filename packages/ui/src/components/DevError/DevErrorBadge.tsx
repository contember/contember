import { useClassNameFactory } from '@contember/utilities'

export interface DevErrorBadgeProps {
	onOpen: () => void
	errorCount: number
}

export function DevErrorBadge({ errorCount, onOpen }: DevErrorBadgeProps) {
	const componentClassName = useClassNameFactory('devErrorBadge')

	return (
		<div className={componentClassName()}>
			<a className={componentClassName('button')} onClick={onOpen}>
				{errorCount} {errorCount > 1 ? 'errors' : 'error'}
			</a>
		</div>
	)
}
