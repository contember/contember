import type { FileDataPopulator } from '../fileDataPopulators'

export const getRelevantPopulators = (
	populators: Iterable<FileDataPopulator>,
	uploadedFile: File,
): FileDataPopulator[] => {
	const relevantPopulators: FileDataPopulator[] = []

	for (const populator of populators) {
		if (populator.canHandleFile && !populator.canHandleFile(uploadedFile)) {
			continue
		}
		relevantPopulators.push(populator)
	}

	return relevantPopulators
}
