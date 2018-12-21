export class MetaOperationsAccessor {
	public constructor(public readonly triggerPersist: () => Promise<void>) {}
}
