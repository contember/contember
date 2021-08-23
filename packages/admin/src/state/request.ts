export interface RecursiveStringObject {
	[key: string]: string | RecursiveStringObject | undefined
}

export interface SelectedDimension {
	[key: string]: string[]
}


type PageParameters = RecursiveStringObject

export interface PageRequest<P extends PageParameters> {
	pageName: string
	parameters: P
	dimensions: SelectedDimension
}

type RequestState = PageRequest<any> | null

export default RequestState

export const emptyRequestState: RequestState = null

export type RequestChange = (currentState: RequestState) => RequestState

export const pageRequest =
	<P extends PageParameters>(pageName: string, parameters: P): RequestChange =>
	(currentState: RequestState): PageRequest<P> => ({
		pageName,
		parameters,
		dimensions: currentState?.dimensions || {},
	})
