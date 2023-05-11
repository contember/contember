import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { FileKind } from '../FileKind'
import { getStockAnyFileKind, StockAnyFileKindProps } from '../factories/getStockAnyFileKind'
import { SelectFileInputSelectionComponentProps } from '../../internalComponents/selection/SelectFileInput'
import { SugaredDiscriminateBy } from '../../../discrimination'

export type AnyFilesProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& StockAnyFileKindProps<AcceptArtifacts>
	& SelectFileInputSelectionComponentProps<SFExtraProps>
	& {
		discriminateBy: SugaredDiscriminateBy
	}
/**
 * @group Uploads
 */
export const AnyFiles = Component<AnyFilesProps>(
	({
		 discriminateBy,
		 fileSelectionComponent,
		 fileSelectionLabel,
		 fileSelectionProps,
		 ...props
	 }) => (
		<FileKind
			{...getStockAnyFileKind(props)}
			fileSelection={{ fileSelectionComponent, fileSelectionLabel, fileSelectionProps }}
			discriminateBy={discriminateBy}
		/>
	),
	'AnyFiles',
) as <AcceptArtifacts = unknown>(props: AnyFilesProps<AcceptArtifacts>) => ReactElement | null
