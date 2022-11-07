import * as Typesafe from '@contember/typesafe'
import { Settings } from '@contember/schema'

export const settingsSchema = Typesafe.partial({
	useExistsInHasManyFilter: Typesafe.boolean,
})

const settingSchemaCheck: Typesafe.Equals<Settings.Schema, ReturnType<typeof settingsSchema>> = true
