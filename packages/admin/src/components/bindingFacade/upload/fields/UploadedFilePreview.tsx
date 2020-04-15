import { EntityAccessor, Environment } from '@contember/binding'
import { FileUploadReadyState, SingleFileUploadState } from '@contember/react-client'
import { FilePreview, UploadProgress } from '@contember/ui'
import * as React from 'react'
import { FileDataPopulator } from '../fileDataPopulators'

export interface UploadedFilePreviewProps {
	batchUpdates: EntityAccessor['batchUpdates']
	environment: Environment
	uploadState: SingleFileUploadState | undefined
	emptyText?: React.ReactNode
	populators: FileDataPopulator[]
	renderFile?: () => React.ReactNode
	renderFilePreview?: (file: File, previewUrl: string) => React.ReactNode
}

type PopulatorDataState =
	| {
			name: 'uninitialized'
			data?: never
	  }
	| {
			name: 'ready'
			data: any[]
	  }
	| {
			name: 'error'
			data?: never
	  }

export const UploadedFilePreview = React.memo(
	({
		uploadState,
		//emptyText,
		batchUpdates,
		environment,
		populators,
		renderFile,
		renderFilePreview,
	}: UploadedFilePreviewProps) => {
		const uploadStateRef = React.useRef(uploadState)
		const [preparedPopulatorData, setPreparedPopulatorData] = React.useState<PopulatorDataState>({
			name: 'uninitialized',
		})
		const uploadedFile = uploadState?.file
		const readyState = uploadState?.readyState

		const relevantPopulators = React.useMemo(
			() => (uploadedFile ? populators.filter(populator => populator.canHandleFile?.(uploadedFile) ?? true) : []),
			[populators, uploadedFile],
		)

		React.useEffect(() => {
			uploadStateRef.current = uploadState
		}, [uploadState])

		React.useEffect(() => {
			let isMounted = true

			const currentUploadState = uploadStateRef.current
			if (readyState === FileUploadReadyState.Uploading && currentUploadState) {
				const dataPromises = relevantPopulators.map(populator =>
					populator.prepareFileData
						? populator.prepareFileData(currentUploadState.file, currentUploadState.previewUrl)
						: Promise.resolve(undefined),
				)
				setPreparedPopulatorData({ name: 'uninitialized' })
				Promise.all(dataPromises).then(data => {
					if (!isMounted) {
						return
					}
					setPreparedPopulatorData({
						name: 'ready',
						data,
					})
				})
			}

			return () => {
				isMounted = false
			}
		}, [readyState, relevantPopulators])

		React.useEffect(() => {
			if (
				uploadState?.readyState !== FileUploadReadyState.Success ||
				preparedPopulatorData.name !== 'ready' ||
				!batchUpdates
			) {
				return
			}

			for (let i = 0; i < relevantPopulators.length; i++) {
				const populator = relevantPopulators[i]
				const preparedData = preparedPopulatorData.data[i]

				populator.populateFileData(
					{
						uploadResult: uploadState.result,
						file: uploadState.file,
						previewUrl: uploadState.previewUrl,
						environment,
						batchUpdates,
					},
					preparedData,
				)
			}
		}, [
			batchUpdates,
			environment,
			preparedPopulatorData.data,
			preparedPopulatorData.name,
			relevantPopulators,
			uploadState,
		])

		const getOverlay = (): React.ReactNode => {
			if (!uploadState) {
				return undefined
			}
			if (
				uploadState.readyState === FileUploadReadyState.Error ||
				preparedPopulatorData.name === 'error' ||
				uploadState.readyState === FileUploadReadyState.Aborted
			) {
				return `Upload failed`
			}
			if (uploadState.readyState === FileUploadReadyState.Success && preparedPopulatorData.name === 'ready') {
				return undefined
			}
			if (uploadState.readyState === FileUploadReadyState.Uploading) {
				return <UploadProgress progress={uploadState.progress} />
			}
			return <UploadProgress />
		}
		if ((uploadState && !renderFilePreview) || (!uploadState && !renderFile)) {
			return null
		}
		return (
			<FilePreview overlay={getOverlay()}>
				{uploadState ? renderFilePreview?.(uploadState.file, uploadState.previewUrl) : renderFile?.()}
			</FilePreview>
		)
	},
)
UploadedFilePreview.displayName = 'UploadedFilePreview'
