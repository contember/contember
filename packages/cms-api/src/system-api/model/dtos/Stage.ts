export class Stage {
	public constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly slug: string,
		public readonly event_id: string
	) {
	}
}

export type StageWithoutEvent = Pick<Stage, Exclude<keyof Stage, 'event_id'>>
