export type Serializable =
	| string
	| number
	| boolean
	| null
	| readonly Serializable[]
	| { readonly [K in string]?: Serializable }
