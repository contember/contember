interface Migration {
	version: string
	modifications: Migration.Modification[]
}

namespace Migration {
	export type Modification<Data = { [field: string]: any }> = { modification: string } & Data
}

export default Migration
