export declare class Queue {
	private concurrency
	private processing
	private resolvers
	private closed
	constructor(concurrency: number)
	execute<T>(cb: () => Promise<T>): Promise<T>
	close(): Promise<void>
	setConcurrency(concurrency: number): void
	private doExecute
	private processNext
}
export declare class QueueError {
}
export declare class QueueClosedError extends QueueError {
}
//# sourceMappingURL=Queue.d.ts.map
