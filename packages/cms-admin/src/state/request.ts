export default interface RequestState
{
  name: string | null
  id: string | null
}

export const emptyRequestState: RequestState = {
  name: null,
  id: null,
}

export type RequestChange = (request: RequestState) => Partial<RequestState>

export const listRequest = (name: string): RequestChange => request => ({name})
export const detailRequest = (name: string, id: string): RequestChange => request => ({name, id})
