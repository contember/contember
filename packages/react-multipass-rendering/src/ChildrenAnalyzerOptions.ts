import { ErrorMessageFactory } from './ErrorMessageFactory'

export interface ChildrenAnalyzerOptions<StaticContext = any> {
	ignoreRenderProps: boolean
	renderPropsErrorMessage: ErrorMessageFactory<StaticContext>

	ignoreUnhandledNodes: boolean
	unhandledNodeErrorMessage: ErrorMessageFactory<StaticContext>

	staticContextFactoryName: string
	staticRenderFactoryName: string
}
