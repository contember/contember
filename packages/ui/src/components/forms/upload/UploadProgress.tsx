import { FunctionComponent, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import { ProgressBar } from '../../ProgressBar'
import { Spinner } from '../../Spinner'

export interface UploadProgressProps {
	progress?: number // 0 to 1
	//fileSize?: number // In bytes
	formatProgressMessage?: (progress?: number) => ReactNode
}

const defaultFormatProgressMessage = (progress?: number): ReactNode =>
	`Uploading${progress === undefined ? '' : ` (${(progress * 100).toFixed()}%)`}`

// Deliberately no memo
export const UploadProgress: FunctionComponent<UploadProgressProps> = ({
	progress,
	formatProgressMessage = defaultFormatProgressMessage,
}: UploadProgressProps) => {
	const clampedProgress = Math.max(0, Math.min(progress ?? 0, 1))
	const prefix = useClassNamePrefix()

	return (
		<div className={`${prefix}uploadProgress`}>
			{progress === undefined && (
				<div className={`${prefix}uploadProgress-indeterminate`}>
					<Spinner />
				</div>
			)}
			{progress !== undefined && (
				<>
					<div className={`${prefix}uploadProgress-progress`}>
						<ProgressBar progress={clampedProgress} />
					</div>
					<div className={`${prefix}uploadProgress-message`}>
						<div className={`${prefix}uploadProgress-message-stabilizer`}>{formatProgressMessage(1)}</div>
						<div className={`${prefix}uploadProgress-message-real`}>{formatProgressMessage(clampedProgress)}</div>
					</div>
				</>
			)}
		</div>
	)
}
UploadProgress.displayName = 'UploadProgress'
