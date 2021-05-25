import type { EntityAccessor, Environment } from '@contember/binding'
import { FileUploadReadyState, SingleFileUploadState } from '@contember/react-client'
import { FilePreview, UploadProgress } from '@contember/ui'
import { memo, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FileDataPopulator } from '../fileDataPopulators'
import { getRelevantPopulators } from './getRelevantPopulators'

export interface UploadingFilePreviewProps {
	getFileAccessor: EntityAccessor['getAccessor']
	environment: Environment
	uploadState: SingleFileUploadState
	populators: Iterable<FileDataPopulator>
	renderFilePreview?: (file: File, previewUrl: string) => ReactNode
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

export const UploadingFilePreview = memo(
	({ uploadState, getFileAccessor, environment, populators, renderFilePreview }: UploadingFilePreviewProps) => {
		const uploadStateRef = useRef(uploadState)
		const [preparedPopulatorData, setPreparedPopulatorData] = useState<PopulatorDataState>({
			name: 'uninitialized',
		})
		const uploadedFile = uploadState.file
		const readyState = uploadState.readyState
		const isMountedRef = useRef(true)

		const relevantPopulators = useMemo(() => getRelevantPopulators(populators, uploadedFile), [
			populators,
			uploadedFile,
		])

		useLayoutEffect(() => {
			uploadStateRef.current = uploadState
		}, [uploadState])

		useEffect(() => {
			const currentUploadState = uploadStateRef.current
			const preparePopulators = async () => {
				if (readyState === FileUploadReadyState.Uploading && currentUploadState) {
					const dataPromises = relevantPopulators.map(populator =>
						populator.prepareFileData
							? populator.prepareFileData(currentUploadState.file, currentUploadState.previewUrl)
							: Promise.resolve(),
					)
					setPreparedPopulatorData({ name: 'uninitialized' })
					try {
						const data = await Promise.all(dataPromises)
						if (!isMountedRef.current) {
							return
						}
						setPreparedPopulatorData({
							name: 'ready',
							data,
						})
					} catch (e) {
						setPreparedPopulatorData({
							name: 'error',
						})
					}
				}
			}
			preparePopulators()
		}, [readyState, relevantPopulators])

		useEffect(() => {
			if (uploadState.readyState !== FileUploadReadyState.Success || preparedPopulatorData.name !== 'ready') {
				return
			}

			getFileAccessor().batchUpdates(() => {
				for (let i = 0; i < relevantPopulators.length; i++) {
					const populator = relevantPopulators[i]
					const preparedData = preparedPopulatorData.data[i]

					populator.populateFileData(
						{
							uploadResult: uploadState.result,
							file: uploadState.file,
							previewUrl: uploadState.previewUrl,
							environment,
							getFileAccessor,
						},
						preparedData,
					)
				}
			})
		}, [
			getFileAccessor,
			environment,
			preparedPopulatorData.data,
			preparedPopulatorData.name,
			relevantPopulators,
			uploadState,
		])

		useEffect(
			() => () => {
				isMountedRef.current = false
			},
			[],
		)

		const getOverlay = (): ReactNode => {
			if (uploadState.readyState === FileUploadReadyState.Error && uploadState.error?.endUserMessage) {
				return uploadState.error.endUserMessage
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
		if (!renderFilePreview) {
			return null
		}
		return (
			<FilePreview overlay={getOverlay()}>{renderFilePreview?.(uploadState.file, uploadState.previewUrl)}</FilePreview>
		)
	},
)
UploadingFilePreview.displayName = 'UploadingFilePreview'
