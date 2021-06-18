import type { SugaredDiscriminateBy } from '../../discrimination'
import type { FullFileKind } from './FullFileKind'

export interface DiscriminatedFileKind<UploadResult = unknown, AcceptArtifacts = unknown>
	extends FullFileKind<UploadResult, AcceptArtifacts> {
	discriminateBy: SugaredDiscriminateBy
}
