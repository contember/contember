import { useClassNameFactory } from '@contember/utilities'
import { memo } from 'react'

export interface ProgressBarProps {
	progress: number
}

/**
 * @group UI
 */
export const ProgressBar = memo(({ progress }: ProgressBarProps) => {
	const clampedProgress = Math.max(0, Math.min(progress, 1))
	const componentClassName = useClassNameFactory('progressBar')

	return (
		<div className={componentClassName()}>
			<div className={componentClassName('bar')} style={{ transform: `scaleX(${clampedProgress})` }} />
		</div>
	)
})
ProgressBar.displayName = 'ProgressBar'
