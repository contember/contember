export interface Stage {
	readonly name: string
	readonly slug: string
}

export interface StageWithId extends Stage {
	readonly id: string
}

