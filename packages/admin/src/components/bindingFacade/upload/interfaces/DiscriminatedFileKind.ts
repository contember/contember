import type { SugaredDiscriminateBy } from '../../discrimination'
import type { FullFileKind } from './FullFileKind'

export type DiscriminatedFileKind<UploadResult = unknown, AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& FullFileKind<UploadResult, AcceptArtifacts, SFExtraProps>
	& {
		discriminateBy: SugaredDiscriminateBy
	}
