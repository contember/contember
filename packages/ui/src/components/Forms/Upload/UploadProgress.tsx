import { useClassNameFactory } from '@contember/utilities'
import type { FunctionComponent, ReactNode } from 'react'
import { ProgressBar } from '../../ProgressBar/ProgressBar'
import { Spinner } from '../../Spinner/Spinner'

export interface UploadProgressProps {
	progress?: string | number // 0 to 1
	//fileSize?: number // In bytes
	formatProgressMessage?: (progress?: number) => ReactNode
}

const defaultFormatProgressMessage = (progress?: number): ReactNode =>
	`Uploading${progress === undefined ? '' : ` (${(progress * 100).toFixed()}%)`}`

/**
 * @group Forms UI
 */
export const UploadProgress: FunctionComponent<UploadProgressProps> = ({
	progress,
	formatProgressMessage = defaultFormatProgressMessage,
}: UploadProgressProps) => {
	const componentClassName = useClassNameFactory('uploadProgress')

	const renderNumericProgress = (progress: number) => {
		const clampedProgress = Math.max(0, Math.min(progress ?? 0, 1))

		return (
			<>
				<div className={componentClassName('progress')}>
					<ProgressBar progress={clampedProgress} />
				</div>
				<div className={componentClassName('message')}>
					<div className={componentClassName('message-stabilizer')}>{formatProgressMessage(1)}</div>
					<div className={componentClassName('message-real')}>{formatProgressMessage(clampedProgress)}</div>
				</div>
			</>
		)
	}
	const renderStringProgress = (progress: string) => <div className={componentClassName('message')}>{progress}</div>

	return (
		<div className={componentClassName()}>
			{(progress === undefined || typeof progress === 'string') && (
				<div className={componentClassName('indeterminate')}>
					<Spinner />
				</div>
			)}
			{typeof progress === 'number' && renderNumericProgress(progress)}
			{typeof progress === 'string' && renderStringProgress(progress)}
		</div>
	)
}
UploadProgress.displayName = 'UploadProgress'
