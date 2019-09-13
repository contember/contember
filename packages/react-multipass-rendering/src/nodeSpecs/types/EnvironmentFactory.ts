export type EnvironmentFactory<Props extends {}, Environment> = (props: Props, environment: Environment) => Environment
