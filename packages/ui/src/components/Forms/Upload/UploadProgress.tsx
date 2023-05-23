import type { FunctionComponent, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import { ProgressBar } from '../../ProgressBar'
import { Spinner } from '../../Spinner'

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
	const prefix = useClassNamePrefix()

	const renderNumericProgress = (progress: number) => {
		const clampedProgress = Math.max(0, Math.min(progress ?? 0, 1))

		return (
			<>
				<div className={`${prefix}uploadProgress-progress`}>
					<ProgressBar progress={clampedProgress} />
				</div>
				<div className={`${prefix}uploadProgress-message`}>
					<div className={`${prefix}uploadProgress-message-stabilizer`}>{formatProgressMessage(1)}</div>
					<div className={`${prefix}uploadProgress-message-real`}>{formatProgressMessage(clampedProgress)}</div>
				</div>
			</>
		)
	}
	const renderStringProgress = (progress: string) => <div className={`${prefix}uploadProgress-message`}>{progress}</div>

	return (
		<div className={`${prefix}uploadProgress`}>
			{(progress === undefined || typeof progress === 'string') && (
				<div className={`${prefix}uploadProgress-indeterminate`}>
					<Spinner />
				</div>
			)}
			{typeof progress === 'number' && renderNumericProgress(progress)}
			{typeof progress === 'string' && renderStringProgress(progress)}
		</div>
	)
}
UploadProgress.displayName = 'UploadProgress'
