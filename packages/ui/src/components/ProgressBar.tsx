import { memo } from 'react'
import { useClassNamePrefix } from '../auxiliary'

export interface ProgressBarProps {
	progress: number
}

/**
 * @group UI
 */
export const ProgressBar = memo(({ progress }: ProgressBarProps) => {
	const clampedProgress = Math.max(0, Math.min(progress, 1))
	const prefix = useClassNamePrefix()

	return (
		<div className={`${prefix}progressBar`}>
			<div className={`${prefix}progressBar-bar`} style={{ transform: `scaleX(${clampedProgress})` }} />
		</div>
	)
})
ProgressBar.displayName = 'ProgressBar'
