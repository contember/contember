import { SugaredFieldProps } from '@contember/binding'
import { emptyArray } from '@contember/react-utils'
import {
	getAudioFileDefaults,
	getGenericFileDefaults,
	getImageFileDefaults,
	getVideoFileDefaults,
} from '../stockFileKindDefaults'
import { CustomFileKindProps } from './CustomFileKindProps'
import { DiscriminatedFileUploadProps } from './DiscriminatedFileUploadProps'
import { StockFileKindProps } from './StockFileKindProps'
import * as React from 'react'

export type ResolvableFileKindProps = CustomFileKindProps | StockFileKindProps

// See useResolvedPopulators.ts for explanation of this madness.
export const useResolvedFileKinds = (
	props: ResolvableFileKindProps,
	fileUrlField: SugaredFieldProps['field'] | undefined,
): Iterable<DiscriminatedFileUploadProps> => {
	const p = props as CustomFileKindProps & StockFileKindProps // Note the &
	const p2 = props as any
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return React.useMemo(() => resolveFileKinds(p, fileUrlField), [
		p.fileKinds,
		fileUrlField,

		p.acceptAudio,
		p.acceptGeneric,
		p.acceptImage,
		p.acceptVideo,
		p.renderAudioFile,
		p.renderGenericFile,
		p.renderImageFile,
		p.renderVideoFile,
		p.renderAudioFilePreview,
		p.renderGenericFilePreview,
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
	fileUrlField: SugaredFieldProps['field'] | undefined,
): Iterable<DiscriminatedFileUploadProps> => {
	if ('fileKinds' in props) {
		return props.fileKinds
	}
	return getResolvedStockFileKinds(props, fileUrlField)
}

const getResolvedStockFileKinds = (
	props: StockFileKindProps,
	fileUrlField: SugaredFieldProps['field'] | undefined,
): DiscriminatedFileUploadProps[] => {
	const discriminatedProps: DiscriminatedFileUploadProps[] = props.additionalFileKinds
		? Array.from(props.additionalFileKinds)
		: emptyArray
	let overridePresent = false

	if (
		('discriminateAudioBy' in props && props.discriminateAudioBy) ||
		('discriminateAudioByScalar' in props && props.discriminateAudioByScalar)
	) {
		const defaults = getAudioFileDefaults(fileUrlField)
		discriminatedProps.push({
			renderFile: props.renderAudioFile || defaults.renderFile,
			renderFilePreview: props.renderAudioFilePreview || defaults.renderFilePreview,
			accept: props.acceptAudio || defaults.accept,
			discriminateBy: 'discriminateAudioBy' in props ? props.discriminateAudioBy : undefined,
			discriminateByScalar: 'discriminateAudioByScalar' in props ? props.discriminateAudioByScalar : undefined,
		})
		overridePresent = true
	}

	if (
		('discriminateGenericBy' in props && props.discriminateGenericBy) ||
		('discriminateGenericByScalar' in props && props.discriminateGenericByScalar)
	) {
		const defaults = getGenericFileDefaults(fileUrlField)
		discriminatedProps.push({
			renderFile: props.renderGenericFile || defaults.renderFile,
			renderFilePreview: props.renderGenericFilePreview || defaults.renderFilePreview,
			accept: props.acceptGeneric || defaults.accept,
			discriminateBy: 'discriminateGenericBy' in props ? props.discriminateGenericBy : undefined,
			discriminateByScalar: 'discriminateGenericByScalar' in props ? props.discriminateGenericByScalar : undefined,
		})
		overridePresent = true
	}

	if (
		('discriminateImageBy' in props && props.discriminateImageBy) ||
		('discriminateImageByScalar' in props && props.discriminateImageByScalar)
	) {
		const defaults = getImageFileDefaults(fileUrlField)
		discriminatedProps.push({
			renderFile: props.renderImageFile || defaults.renderFile,
			renderFilePreview: props.renderImageFilePreview || defaults.renderFilePreview,
			accept: props.acceptImage || defaults.accept,
			discriminateBy: 'discriminateImageBy' in props ? props.discriminateImageBy : undefined,
			discriminateByScalar: 'discriminateImageByScalar' in props ? props.discriminateImageByScalar : undefined,
		})
		overridePresent = true
	}

	if (
		('discriminateVideoBy' in props && props.discriminateVideoBy) ||
		('discriminateVideoByScalar' in props && props.discriminateVideoByScalar)
	) {
		const defaults = getVideoFileDefaults(fileUrlField)
		discriminatedProps.push({
			renderFile: props.renderVideoFile || defaults.renderFile,
			renderFilePreview: props.renderVideoFilePreview || defaults.renderFilePreview,
			accept: props.acceptVideo || defaults.accept,
			discriminateBy: 'discriminateVideoBy' in props ? props.discriminateVideoBy : undefined,
			discriminateByScalar: 'discriminateVideoByScalar' in props ? props.discriminateVideoByScalar : undefined,
		})
		overridePresent = true
	}

	if (!overridePresent) {
		discriminatedProps.push(getGenericFileDefaults(fileUrlField))
	}

	return discriminatedProps
}
