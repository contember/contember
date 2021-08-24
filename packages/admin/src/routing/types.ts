export interface RecursiveStringObject {
	[key: string]: string | RecursiveStringObject | undefined
}

export interface SelectedDimension {
	[key: string]: string[]
}


export type PageParameters = RecursiveStringObject

export interface PageRequest<P extends PageParameters> {
	pageName: string
	parameters: P
	dimensions: SelectedDimension
}

export type RequestState = PageRequest<any> | null

export type RequestChange = (currentState: RequestState) => RequestState
