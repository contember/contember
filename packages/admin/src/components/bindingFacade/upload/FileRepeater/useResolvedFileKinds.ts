import { useMemo } from 'react'
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
	return useMemo(() => resolveFileKinds(p, fileUrlProps), [
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

	if ('discriminateAudioBy' in props && props.discriminateAudioBy !== undefined) {
		const defaults = getAudioFileDefaults(fileUrlProps.audioFileUrlField || fileUrlProps.fileUrlField)
		discriminatedProps.push({
			renderFile: props.renderAudioFile || defaults.renderFile,
			renderFilePreview: props.renderAudioFilePreview || defaults.renderFilePreview,
			accept: props.acceptAudio || defaults.accept,
			discriminateBy: props.discriminateAudioBy,
		})
	}

	if ('discriminateImageBy' in props && props.discriminateImageBy !== undefined) {
		const defaults = getImageFileDefaults(fileUrlProps.imageFileUrlField || fileUrlProps.fileUrlField)
		discriminatedProps.push({
			renderFile: props.renderImageFile || defaults.renderFile,
			renderFilePreview: props.renderImageFilePreview || defaults.renderFilePreview,
			accept: props.acceptImage || defaults.accept,
			discriminateBy: props.discriminateImageBy,
		})
	}

	if ('discriminateVideoBy' in props && props.discriminateVideoBy !== undefined) {
		const defaults = getVideoFileDefaults(fileUrlProps.videoFileUrlField || fileUrlProps.fileUrlField)
		discriminatedProps.push({
			renderFile: props.renderVideoFile || defaults.renderFile,
			renderFilePreview: props.renderVideoFilePreview || defaults.renderFilePreview,
			accept: props.acceptVideo || defaults.accept,
			discriminateBy: props.discriminateVideoBy,
		})
	}

	if (
		discriminatedProps.length === 0 ||
		('discriminateGenericBy' in props && props.discriminateGenericBy !== undefined)
	) {
		discriminatedProps.push({
			accept: props.accept ?? undefined,
			discriminateBy: props.discriminateGenericBy,
		})
	}

	return discriminatedProps
}
