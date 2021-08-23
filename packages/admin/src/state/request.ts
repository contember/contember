export interface RecursiveStringObject {
	[key: string]: string | RecursiveStringObject | undefined
}

export interface ProjectRequest {
	project: string
}

export interface SelectedDimension {
	[key: string]: string[]
}

export interface StageRequest extends ProjectRequest {
	stage: string
	dimensions: SelectedDimension
}

type PageParameters = RecursiveStringObject

export interface PageRequest<P extends PageParameters> extends StageRequest {
	pageName: string
	parameters: P
}

type RequestState = PageRequest<any> | null

export default RequestState

export const emptyRequestState: RequestState = null

export type RequestChange = (currentState: RequestState) => RequestState

export const pageRequest =
	<P extends PageParameters>(project: string, stage: string, pageName: string, parameters: P): RequestChange =>
	(currentState: RequestState): PageRequest<P> => ({
		project,
		stage,
		pageName,
		parameters,
		dimensions: currentState?.dimensions || {},
	})
