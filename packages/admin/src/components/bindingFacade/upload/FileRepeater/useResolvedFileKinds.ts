import * as React from 'react'
import { FileUrlDataPopulatorProps } from '../fileDataPopulators'
import { getAudioFileDefaults, getImageFileDefaults, getVideoFileDefaults } from '../stockFileKindDefaults'
import { CustomFileKindProps } from './CustomFileKindProps'
import { DiscriminatedFileUploadProps } from './DiscriminatedFileUploadProps'
import { StockFileKindProps } from './StockFileKindProps'

export type ResolvableFileKindProps = CustomFileKindProps | StockFileKindProps

// See useResolvedPopulators.ts for explanation of this madness.
export const useResolvedFileKinds = (
	props: ResolvableFileKindProps,
	fileUrlProps: Partial<FileUrlDataPopulatorProps>,
): Iterable<DiscriminatedFileUploadProps> => {
	const p = props as CustomFileKindProps & StockFileKindProps // Note the &
	const p2 = props as any
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return React.useMemo(() => resolveFileKinds(p, fileUrlProps), [
		p.fileKinds,
		fileUrlProps.fileUrlField,
		fileUrlProps.audioFileUrlField,
		fileUrlProps.imageFileUrlField,
		fileUrlProps.videoFileUrlField,

		p.accept,
		p.acceptAudio,
		p.acceptImage,
		p.acceptVideo,
		p.renderAudioFile,
		p.renderImageFile,
		p.renderVideoFile,
		p.renderAudioFilePreview,
		p.renderImageFilePreview,
		p.renderVideoFilePreview,
		p2.discriminateAudioBy,
		p2.discriminateGenericBy,
		p2.discriminateImageBy,
		p2.discriminateVideoBy,
		p2.discriminateAudioByScalar,
		p2.discriminateGenericByScalar,
		p2.discriminateImageByScalar,
		p2.discriminateVideoByScalar,
	])
}

// !!!!!!!! WARNING !!!!!!!!
// If you change *ANY* props access from now on, you *MUST* also update the dependency array above
// See also useResolvedPopulators.ts for further explanation.
// !!!!!!!! WARNING !!!!!!!!
export const resolveFileKinds = (
	props: ResolvableFileKindProps,
	fileUrlProps: Partial<FileUrlDataPopulatorProps>,
): Iterable<DiscriminatedFileUploadProps> => {
	if ('fileKinds' in props) {
		return props.fileKinds
	}
	return getResolvedStockFileKinds(props, fileUrlProps)
}

const getResolvedStockFileKinds = (
	props: StockFileKindProps,
	fileUrlProps: Partial<FileUrlDataPopulatorProps>,
): DiscriminatedFileUploadProps[] => {
	const discriminatedProps: DiscriminatedFileUploadProps[] = props.additionalFileKinds
		? Array.from(props.additionalFileKinds)
		: []

	if (
		('discriminateAudioBy' in props && props.discriminateAudioBy !== undefined) ||
		('discriminateAudioByScalar' in props && props.discriminateAudioByScalar !== undefined)
	) {
		const defaults = getAudioFileDefaults(fileUrlProps.audioFileUrlField || fileUrlProps.fileUrlField)
		discriminatedProps.push({
			renderFile: props.renderAudioFile || defaults.renderFile,
			renderFilePreview: props.renderAudioFilePreview || defaults.renderFilePreview,
			accept: props.acceptAudio || defaults.accept,
			discriminateBy: 'discriminateAudioBy' in props ? props.discriminateAudioBy : undefined,
			discriminateByScalar: 'discriminateAudioByScalar' in props ? props.discriminateAudioByScalar : undefined,
		})
	}

	if (
		('discriminateImageBy' in props && props.discriminateImageBy !== undefined) ||
		('discriminateImageByScalar' in props && props.discriminateImageByScalar !== undefined)
	) {
		const defaults = getImageFileDefaults(fileUrlProps.imageFileUrlField || fileUrlProps.fileUrlField)
		discriminatedProps.push({
			renderFile: props.renderImageFile || defaults.renderFile,
			renderFilePreview: props.renderImageFilePreview || defaults.renderFilePreview,
			accept: props.acceptImage || defaults.accept,
			discriminateBy: 'discriminateImageBy' in props ? props.discriminateImageBy : undefined,
			discriminateByScalar: 'discriminateImageByScalar' in props ? props.discriminateImageByScalar : undefined,
		})
	}

	if (
		('discriminateVideoBy' in props && props.discriminateVideoBy !== undefined) ||
		('discriminateVideoByScalar' in props && props.discriminateVideoByScalar !== undefined)
	) {
		const defaults = getVideoFileDefaults(fileUrlProps.videoFileUrlField || fileUrlProps.fileUrlField)
		discriminatedProps.push({
			renderFile: props.renderVideoFile || defaults.renderFile,
			renderFilePreview: props.renderVideoFilePreview || defaults.renderFilePreview,
			accept: props.acceptVideo || defaults.accept,
			discriminateBy: 'discriminateVideoBy' in props ? props.discriminateVideoBy : undefined,
			discriminateByScalar: 'discriminateVideoByScalar' in props ? props.discriminateVideoByScalar : undefined,
		})
	}

	if (
		discriminatedProps.length === 0 ||
		('discriminateGenericBy' in props && props.discriminateGenericBy !== undefined) ||
		('discriminateGenericByScalar' in props && props.discriminateGenericByScalar !== undefined)
	) {
		discriminatedProps.push({
			accept: props.accept ?? undefined,
			discriminateBy: 'discriminateGenericBy' in props ? props.discriminateGenericBy : undefined,
			discriminateByScalar: 'discriminateGenericByScalar' in props ? props.discriminateGenericByScalar : undefined,
		})
	}

	return discriminatedProps
}
