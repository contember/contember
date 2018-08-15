import { RecursiveStringObject } from '../utils/url'

export interface Request extends RecursiveStringObject {
	name: string
}

export interface LoginRequest extends Request {
	name: 'login'
}

export interface ProjectRequest extends Request {
	project: string
}

export interface StageRequest extends ProjectRequest {
	stage: string
}

type PageParameters = RecursiveStringObject

export interface PageRequest<P extends PageParameters> extends StageRequest {
	name: 'project_page'
	pageName: string
	parameters: P
}

type RequestState = LoginRequest | PageRequest<any>

export default RequestState

export const emptyRequestState: RequestState = {
	name: 'login'
}

export type RequestChange = () => RequestState

export const loginRequest = (): RequestChange => (): LoginRequest => ({ name: 'login' })

export const pageRequest = <P extends PageParameters>(
	project: string,
	stage: string,
	pageName: string,
	parameters: P
): RequestChange => (): PageRequest<P> => ({
	name: 'project_page',
	project,
	stage,
	pageName,
	parameters
})
