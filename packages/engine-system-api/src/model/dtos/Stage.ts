export interface Stage {
	readonly name: string
	readonly slug: string
}

export interface StageWithId extends Stage {
	readonly id: string
}

export type StageWithoutEvent = Pick<Stage, Exclude<keyof Stage, 'event_id'>>
