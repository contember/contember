import type { FileDataPopulator } from './FileDataPopulator'

export interface CustomDataPopulatorProps {
	fileDataPopulators: Iterable<FileDataPopulator>
}
