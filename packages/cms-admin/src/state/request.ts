type Obj = { [key: string]: string | undefined }

export interface Request extends Obj {
	name: string
}

export interface LoginRequest extends Request {
	name: 'login'
}

export interface ProjectRequest extends Request {
	project: string
}

export interface DashboardRequest extends ProjectRequest {
	name: 'dashboard'
}

export interface EntityListRequest extends ProjectRequest {
	name: 'entity_list'
	entityGroupName: string
}

export interface EntityEditRequest extends ProjectRequest {
	name: 'entity_edit'
	entity: string
	entityId: string
}

type RequestState = LoginRequest | DashboardRequest | EntityListRequest | EntityEditRequest

export default RequestState

export const emptyRequestState: RequestState = {
	name: 'login'
}

export type RequestChange = () => RequestState

export const loginRequest = (): RequestChange => (): LoginRequest => ({ name: 'login' })
export const dashboardRequest = (project: string): RequestChange => (): DashboardRequest => ({
	name: 'dashboard',
	project
})
export const entityListRequest = (
	project: string,
	entityGroupName: string
): RequestChange => (): EntityListRequest => ({
	name: 'entity_list',
	project,
	entityGroupName
})
export const entityEditRequest = (
	project: string,
	entity: string,
	entityId: string
): RequestChange => (): EntityEditRequest => ({
	name: 'entity_edit',
	project,
	entity,
	entityId
})
