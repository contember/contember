import type { BindingConfig } from '../accessors'

export class Config {
	private static defaultConfig: BindingConfig = {
		beforePersistSettleLimit: 20,
		beforeUpdateSettleLimit: 20,
		persistSuccessSettleLimit: 20,
	}

	private readonly config: BindingConfig

	public constructor(config: Partial<BindingConfig> = {}) {
		this.config = {
			...Config.defaultConfig,
			...config,
		}
	}

	public getValue<Name extends keyof BindingConfig>(name: Name): BindingConfig[Name] {
		return this.config[name]
	}

	public setValue<Name extends keyof BindingConfig>(name: Name, value: BindingConfig[Name]): this {
		this.config[name] = value
		return this
	}
}
