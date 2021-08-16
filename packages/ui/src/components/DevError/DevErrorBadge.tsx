import { useClassNamePrefix } from '../../auxiliary'

export interface DevErrorBadgeProps {
	onOpen: () => void
	errorCount: number
}

export function DevErrorBadge({ errorCount, onOpen }: DevErrorBadgeProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={`${prefix}devErrorBadge`}>
			<a className={`${prefix}devErrorBadge-button`} onClick={onOpen}>
				{errorCount} {errorCount > 1 ? 'errors' : 'error'}
			</a>
		</div>
	)
}
