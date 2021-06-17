import type { SugaredDiscriminateBy } from '../../discrimination'
import type { FullFileKind } from './FullFileKind'

export interface DiscriminatedFileKind<FileData = unknown, UploadResult = unknown, AcceptArtifacts = unknown>
	extends FullFileKind<FileData, UploadResult, AcceptArtifacts> {
	discriminateBy: SugaredDiscriminateBy
}
