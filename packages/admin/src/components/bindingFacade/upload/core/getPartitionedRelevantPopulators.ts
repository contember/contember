import { FileDataPopulator } from '../fileDataPopulators'

export interface PartitionedRelevantPopulators {
	synchronousUrgentPopulators: FileDataPopulator[]
	asynchronousUrgentPopulators: FileDataPopulator[]
	deferrablePopulators: FileDataPopulator[]
}

export const getPartitionedRelevantPopulators = (
	populators: Iterable<FileDataPopulator>,
	uploadedFile: File,
): PartitionedRelevantPopulators => {
	const synchronousUrgentPopulators: FileDataPopulator[] = []
	const asynchronousUrgentPopulators: FileDataPopulator[] = []
	const deferrablePopulators: FileDataPopulator[] = []

	for (const populator of populators) {
		if (populator.canHandleFile && !populator.canHandleFile(uploadedFile)) {
			continue
		}
		if (populator.isUrgent?.(uploadedFile)) {
			if (populator.prepareFileData) {
				asynchronousUrgentPopulators.push(populator)
			} else {
				synchronousUrgentPopulators.push(populator)
			}
		} else {
			deferrablePopulators.push(populator)
		}
	}

	return { synchronousUrgentPopulators, asynchronousUrgentPopulators, deferrablePopulators }
}
