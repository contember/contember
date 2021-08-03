export interface RecursiveStringObject {
	[key: string]: string | RecursiveStringObject | undefined
}

export interface Request {
	name: string
}

export interface LoginRequest extends Request {
	name: 'login'
}

export interface ProjectsListRequest extends Request {
	name: 'projects_list'
}

export interface ProjectRequest extends Request {
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
	name: 'project_page'
	pageName: string
	parameters: P
}

type RequestState = LoginRequest | ProjectsListRequest | PageRequest<any>

export default RequestState

export const emptyRequestState: RequestState = {
	name: 'login',
}

export type RequestChange = (currentState: RequestState) => RequestState

export const loginRequest = (): RequestChange => (): LoginRequest => ({ name: 'login' })

export const pageRequest =
	<P extends PageParameters>(project: string, stage: string, pageName: string, parameters: P): RequestChange =>
	(currentState): PageRequest<P> => ({
		name: 'project_page',
		project,
		stage,
		pageName,
		parameters,
		dimensions: (currentState as StageRequest).dimensions || {},
	})
