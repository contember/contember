export type StaticContextFactory<Props extends {}, StaticContext> = (
	props: Props,
	staticContext: StaticContext,
) => StaticContext
