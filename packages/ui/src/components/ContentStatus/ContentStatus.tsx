import { useClassNameFactory } from '@contember/react-utils'
import { Clock9Icon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface ContentStatusProps {
	label?: ReactNode
}

export function ContentStatus({ label }: ContentStatusProps) {
	const componentClassName = useClassNameFactory('contentStatus')

	return (
		<div className={componentClassName()}>
			<span className={componentClassName('label')}>{label}</span>
			<span className={componentClassName('icon')}>
				<Clock9Icon />
			</span>
		</div>
	)
}
ContentStatus.displayName = 'ContentStatus'
