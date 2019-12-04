export interface DesugaredAnyField {}

export interface AnyField {
	isNonbearing: boolean | undefined
}

export interface SugarableAnyField {}

export interface UnsugarableAnyField {
	isNonbearing?: boolean
}
