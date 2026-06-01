import type { ErrorMessageFactory } from './ErrorMessageFactory.js'

export interface ChildrenAnalyzerOptions<StaticContext = any> {
	ignoreRenderProps: boolean
	renderPropsErrorMessage: ErrorMessageFactory<StaticContext>

	ignoreUnhandledNodes: boolean
	unhandledNodeErrorMessage: ErrorMessageFactory<StaticContext>

	staticContextFactoryName: string
	staticRenderFactoryName: string
}
