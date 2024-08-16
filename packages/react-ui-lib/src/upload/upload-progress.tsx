import { CheckIcon, FileIcon, Loader2Icon, StopCircleIcon, XIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import * as React from 'react'
import { ReactNode, useEffect } from 'react'
import { Toast } from '../toast'
import { dict } from '../dict'
import { UploaderEachFile, UploaderError, UploaderFileStateError, UploaderFileStateFinalizing, UploaderFileStateSuccess, UploaderFileStateSwitch, UploaderFileStateUploading } from '@contember/react-uploader'
import { formatBytes } from '../formatting/formatting'
import { Loader } from '../ui/loader'


const formatError = (error: unknown) => {
	if (error instanceof UploaderError) {
		return dict.uploader.uploadErrors[error.options.type]
	}
	return dict.uploader.uploaderUnknownError
}

const AbortButton = ({ state: { file: { abortController } } }: { state: UploaderFileStateFinalizing | UploaderFileStateUploading }) => {
	return <Button className="p-1 h-5 text-red-500" variant="ghost" size={'sm'} onClick={() => abortController.abort()}><StopCircleIcon className="h-3 w-3" /></Button>
}

const DismissButton = ({ state }: { state: UploaderFileStateSuccess | UploaderFileStateError }) => {
	useEffect(() => {
		const timeout = setTimeout(() => {
			state.dismiss()
		}, 5000)
		return () => clearTimeout(timeout)
	}, [state])

	return <Button className="p-1 h-5" variant="ghost" size={'sm'} onClick={() => state.dismiss()}><XIcon className="h-3 w-3" /></Button>
}

const UploadError = ({ state: { error } }: { state: UploaderFileStateError }) => {
	const formattedError = error ? formatError(error) : undefined
	if (!formattedError) {
		return null
	}
	return <div className="text-red-700 text-xs font-semibold">{formattedError}</div>
}

export const UploaderFileProgressUI = ({ file, progress, info, actions }: { file: File; progress?: number; actions?: ReactNode; info?: ReactNode }) => {
	const fileName = file.name
	const extension = file.name.split('.').pop()?.toUpperCase()

	return (
		<div className="border-t p-2 flex-1">
			<div className="flex items-center gap-2">
				<div className="relative">
					<FileIcon className="w-10 h-10 text-gray-400" />
					<div className="absolute bottom-2 right-0 left-0 text-[0.5rem] text-gray-600 font-semibold inline-flex justify-center">{extension}</div>
				</div>
				<div className="flex-1 gap-1 flex flex-col">
					<div className="flex justify-between">
						<div>{fileName}</div>
						<div>
							{actions}
						</div>
					</div>
					<Progress value={progress ?? 0} />
					{info}
				</div>
			</div>
		</div>
	)
}


export const UploaderProgress = () => {
	const [open, setOpen] = React.useState(true)

	return (
		<Toast open={open} onOpenChange={setOpen}>
			<div className="flex flex-col flex-1 max-h-80 overflow-y-auto">
				<UploaderEachFile>
					<UploaderFileStateSwitch
						uploading={it => (
							<UploaderFileProgressUI
								file={it.file.file}
								progress={(it.progress.progress ?? 0) * 100}
								actions={<AbortButton state={it} />}
								info={<div className="text-gray-400 text-xs">{formatBytes(it.progress.uploadedBytes)} / {formatBytes(it.progress.totalBytes)}</div>}
							/>
						)}
						initial={it => (
							<UploaderFileProgressUI
								file={it.file.file}
								progress={0}
							/>
						)}
						finalizing={it => (
							<UploaderFileProgressUI
								file={it.file.file}
								progress={100}
								actions={<AbortButton state={it} />}
								info={(
									<div className="text-gray-400 text-xs inline-flex gap-1 items-center">
										<Loader2Icon className="animate-spin h-3 w-3 inline-block" />
										{formatBytes(it.file.file.size)}
									</div>
								)}
							/>
						)}
						error={it => (
							<UploaderFileProgressUI
								file={it.file.file}
								actions={<DismissButton state={it} />}
								info={<UploadError state={it} />}
							/>
						)}
						success={it => (
							<UploaderFileProgressUI
								file={it.file.file}
								progress={100}
								actions={<DismissButton state={it} />}
								info={(
									<div className="flex gap-1 items-center text-green-600 ">
										<CheckIcon className="w-3 h-3" />
										<div className="text-green-600 text-xs "> Done ({formatBytes(it.file.file.size)})</div>
									</div>
								)}
							/>
						)}
					/>
				</UploaderEachFile>
			</div>
		</Toast>
	)
}
