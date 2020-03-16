interface Migration {
	version: string
	formatVersion: number
	modifications: Migration.Modification[]
}

namespace Migration {
	export type Modification<Data = { [field: string]: any }> = { modification: string } & Data
}

export default Migration
