import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { FileKind } from '../FileKind'
import type { StockImageFileKindProps } from '../factories/getStockImageFileKind'
import { getStockImageFileKind } from '../factories/getStockImageFileKind'
import { SelectFileInputSelectionComponentProps } from '../../internalComponents/selection/SelectFileInput'
import { SugaredDiscriminateBy } from '../../../discrimination'

export type ImageFilesProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& StockImageFileKindProps<AcceptArtifacts>
	& SelectFileInputSelectionComponentProps<SFExtraProps>
	& {
		discriminateBy: SugaredDiscriminateBy
	}

/**
 * @group Uploads
 */
export const ImageFiles = Component<ImageFilesProps>(
	({
		 discriminateBy,
		 fileSelectionComponent,
		 fileSelectionLabel,
		 fileSelectionProps,
		 ...props
	 }) => (
		<FileKind
			{...getStockImageFileKind(props)}
			fileSelection={{ fileSelectionComponent, fileSelectionLabel, fileSelectionProps }}
			discriminateBy={discriminateBy}
		/>
	),
	'ImageFiles',
) as <AcceptArtifacts = unknown, SFExtraProps extends {} = {}>(props: ImageFilesProps<AcceptArtifacts, SFExtraProps>) => ReactElement | null
