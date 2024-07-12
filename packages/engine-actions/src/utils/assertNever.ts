export function assertNever(_: never, formatUnhandledDiscriminator?: (value: any) => string): never {
	throw new Error(`Unhandled case ${formatUnhandledDiscriminator?.(_)}`)
}
