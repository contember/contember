import { EntityAccessor, Environment } from '@contember/binding'
import { FileUploadReadyState, SingleFileUploadState } from '@contember/react-client'
import { FilePreview, UploadProgress } from '@contember/ui'
import * as React from 'react'
import { FileDataPopulator } from '../fileDataPopulators'
import { getPartitionedRelevantPopulators } from './getPartitionedRelevantPopulators'

export interface UploadingFilePreviewProps {
	batchUpdates: EntityAccessor['batchUpdates']
	environment: Environment
	uploadState: SingleFileUploadState
	populators: FileDataPopulator[]
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

export const UploadingFilePreview = React.memo(
	({ uploadState, batchUpdates, environment, populators, renderFilePreview }: UploadingFilePreviewProps) => {
		const uploadStateRef = React.useRef(uploadState)
		const [preparedPopulatorData, setPreparedPopulatorData] = React.useState<PopulatorDataState>({
			name: 'uninitialized',
		})
		const uploadedFile = uploadState.file
		const readyState = uploadState.readyState

		const { deferrablePopulators } = React.useMemo(() => getPartitionedRelevantPopulators(populators, uploadedFile), [
			populators,
			uploadedFile,
		])

		React.useEffect(() => {
			uploadStateRef.current = uploadState
		}, [uploadState])

		React.useEffect(() => {
			let isMounted = true

			const currentUploadState = uploadStateRef.current
			if (readyState === FileUploadReadyState.Uploading && currentUploadState) {
				const dataPromises = deferrablePopulators.map(populator =>
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
		}, [readyState, deferrablePopulators])

		React.useEffect(() => {
			if (
				uploadState.readyState !== FileUploadReadyState.Success ||
				preparedPopulatorData.name !== 'ready' ||
				!batchUpdates
			) {
				return
			}

			batchUpdates(() => {
				for (let i = 0; i < deferrablePopulators.length; i++) {
					const populator = deferrablePopulators[i]
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
			})
		}, [
			batchUpdates,
			environment,
			preparedPopulatorData.data,
			preparedPopulatorData.name,
			deferrablePopulators,
			uploadState,
		])

		const getOverlay = (): React.ReactNode => {
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
		if (!renderFilePreview) {
			return null
		}
		return (
			<FilePreview overlay={getOverlay()}>{renderFilePreview?.(uploadState.file, uploadState.previewUrl)}</FilePreview>
		)
	},
)
UploadingFilePreview.displayName = 'UploadingFilePreview'
