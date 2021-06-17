import type { Environment } from '@contember/binding'
import { Fragment, ReactElement } from 'react'
import type { FullFileKind } from '../interfaces'

export const staticRenderFileKind = (fileKind: FullFileKind, environment: Environment): ReactElement => (
	<>
		{fileKind.children}
		{fileKind.renderUploadedFile}
		{fileKind.extractors.map((extractor, i) => (
			<Fragment key={i}>{extractor.staticRender({ environment })}</Fragment>
		))}
	</>
)
