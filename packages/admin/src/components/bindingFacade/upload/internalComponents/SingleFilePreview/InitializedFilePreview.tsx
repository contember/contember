import { BindingError } from '@contember/react-binding'
import type { SingleFileUploadState } from '@contember/react-client'
import { ErrorList, FilePreview, Message, UploadProgress } from '@contember/ui'
import { ReactNode, useEffect, useRef, useState } from 'react'
import type { MessageFormatter } from '../../../../../i18n'
import type { UploadDictionary } from '../../uploadDictionary'
import { ResolvedFileEntity } from '../../fileHandler'
import { FullFileKind } from '../../fileKinds'

export interface InitializedFilePreviewProps {
	fileKind: FullFileKind
	resolvedEntity: ResolvedFileEntity
	formatMessage: MessageFormatter<UploadDictionary>
	uploadState: SingleFileUploadState & { readyState: 'uploading' | 'success' | 'error' | 'aborted' }
}

type ExtractionState =
	| { name: 'uninitialized' }
	| { name: 'working' }
	| { name: 'error' }
	| {
			name: 'success'
			data: any[]
	  }

export function InitializedFilePreview({
	fileKind,
	resolvedEntity,
	formatMessage,
	uploadState,
}: InitializedFilePreviewProps) {
	const [extractionState, setExtractionState] = useState<ExtractionState>({ name: 'uninitialized' })
	const isMountedRef = useRef(true)

	useEffect(() => {
		const extractData = async () => {
			if (extractionState.name !== 'uninitialized' || uploadState.readyState === 'error') {
				return
			}
			const dataPromises = fileKind.extractors.map(extractor =>
				extractor.extractFileData
					? extractor.extractFileData({
							file: uploadState.file,
							acceptArtifacts: uploadState.metadata,
							objectUrl: uploadState.previewUrl,
					  })
					: Promise.resolve(),
			)
			setExtractionState({ name: 'working' })
			try {
				const data = await Promise.all(dataPromises)
				if (!isMountedRef.current) {
					return
				}
				setExtractionState({
					name: 'success',
					data,
				})
			} catch (e) {
				setExtractionState({
					name: 'error',
				})
			}
		}
		extractData()
	}, [extractionState.name, fileKind.extractors, uploadState])

	useEffect(() => {
		if (uploadState.readyState !== 'success' || extractionState.name !== 'success') {
			return
		}
		if (!resolvedEntity.fileEntity) {
			throw new BindingError()
		}

		resolvedEntity.fileEntity.batchUpdates(getEntity => {
			for (let i = 0; i < fileKind.extractors.length; i++) {
				const extractor = fileKind.extractors[i]
				const extractedData = extractionState.data[i]

				extractor.populateFields({
					file: uploadState.file,
					objectUrl: uploadState.previewUrl,
					extractedData,
					uploadResult: uploadState.result,
					acceptArtifacts: uploadState.metadata,
					entity: getEntity(),
				})
			}
		})
	}, [extractionState, fileKind.baseEntity, fileKind.extractors, resolvedEntity.fileEntity, uploadState])

	useEffect(
		() => () => {
			isMountedRef.current = false
		},
		[],
	)

	const getOverlay = (): ReactNode => {
		if (uploadState.readyState === 'error') {
			const endUserMessages = uploadState.errors
				? uploadState.errors
						.filter(error => !!error.options.endUserMessage)
						.map(error => ({ message: formatMessage(error.options.endUserMessage!, 'upload.fileState.failedUpload') }))
				: []

			if (endUserMessages.length) {
				return <ErrorList errors={endUserMessages} />
			}
		}
		if (uploadState.readyState === 'error' || extractionState.name === 'error') {
			return <Message intent="danger">{formatMessage('upload.fileState.failedUpload')}</Message>
		}
		if (uploadState.readyState === 'success') {
			if (extractionState.name === 'success') {
				return undefined
			}
			return <UploadProgress progress={formatMessage('upload.fileState.finalizing')} />
		}
		if (uploadState.readyState === 'uploading') {
			return <UploadProgress progress={uploadState.progress} />
		}
		return <UploadProgress />
	}
	return (
		<FilePreview overlay={getOverlay()}>
			{fileKind.renderFilePreview({
				file: uploadState.file,
				objectUrl: uploadState.previewUrl,
				acceptArtifacts: uploadState.metadata,
			})}
		</FilePreview>
	)
}
