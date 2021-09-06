export interface SelectedDimension {
	[key: string]: string[]
}

export interface PageParameters {
	[key: string]: string | PageParameters | undefined
}

export interface PageRequest<P extends PageParameters> {
	pageName: string
	parameters: P
	dimensions: SelectedDimension
}

export type RequestState = PageRequest<any> | null

export type RequestChange = (currentState: RequestState) => RequestState
