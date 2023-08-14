import * as Typesafe from '@contember/typesafe'
import { Settings } from '@contember/schema'

export const settingsSchema = Typesafe.partial({
	useExistsInHasManyFilter: Typesafe.boolean,
	tenant: Typesafe.partial({
		inviteExpirationMinutes: Typesafe.integer,
	}),
})

const settingSchemaCheck: Typesafe.Equals<Settings.Schema, ReturnType<typeof settingsSchema>> = true
