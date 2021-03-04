import { useMemo } from 'react'
import { AggregateDataPopulatorProps } from './AggregateDataPopulatorProps'
import { CustomDataPopulatorProps } from './CustomDataPopulatorProps'
import { FileDataPopulator } from './FileDataPopulator'
import { getDefaultPopulators } from './getDefaultPopulators'

export type ResolvablePopulatorProps = CustomDataPopulatorProps | AggregateDataPopulatorProps

export const resolvePopulators = (props: ResolvablePopulatorProps): FileDataPopulator[] => {
	if ('fileDataPopulators' in props) {
		return Array.from(props.fileDataPopulators)
	}
	return getDefaultPopulators(props)
}

// This is an unfortunate situation. If we put the entire props into the dependency array, we get too many
// re-initializations, which would cause more problems down the line (it would recompute even for completely unrelated
// props changes). If, on the other hand, we name the individual props, as we do below, TypeScript somewhat rightfully
// complains that we're accessing random props (the dependency array gets evaluated before any type narrowing can take
// place). Hence the cast and the eslint disabling.
// We could avoid this at the expense of code duplication (we also need resolvePopulators as a separate function)
// but the current solution seems like a better trade-off ‒ I absolutely suck at keeping duplicate pieces of code in sync.
export const useResolvedPopulators = (props: ResolvablePopulatorProps): FileDataPopulator[] => {
	const p = props as CustomDataPopulatorProps & AggregateDataPopulatorProps // Note the &
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useMemo<FileDataPopulator[]>(() => resolvePopulators(p), [
		p.audioDurationField,
		p.fileNameField,
		p.fileSizeField,
		p.fileTypeField,
		p.fileUrlField,
		p.imageFileUrlField,
		p.videoFileUrlField,
		p.audioFileUrlField,
		p.imageHeightField,
		p.imageWidthField,
		p.lastModifiedField,
		p.videoDurationField,
		p.videoHeightField,
		p.videoWidthField,
		p.fileDataPopulators,
		p.additionalFileDataPopulators,
	])
}
