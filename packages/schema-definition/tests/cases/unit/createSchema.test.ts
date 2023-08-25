import { expect, test } from 'vitest'
import { c, createSchema, settingsPresets } from '../../../src'

namespace SimpleModel {
	export const publicRole = c.createRole('public')

	@c.Allow(publicRole, { read: true })
	export class Book {
		@c.Required('test')
		title = c.stringColumn()
	}
}

test('basic createSchema test', () => {
	const schema = createSchema(SimpleModel, schema => ({
		...schema,
		settings: settingsPresets['v1.3'],
	}))

	expect(schema).toMatchInlineSnapshot(`
		{
		  "acl": {
		    "roles": {
		      "public": {
		        "entities": {
		          "Book": {
		            "operations": {
		              "read": {
		                "title": true,
		              },
		            },
		            "predicates": {},
		          },
		        },
		        "stages": "*",
		        "variables": {},
		      },
		    },
		  },
		  "actions": {
		    "targets": {},
		    "triggers": {},
		  },
		  "model": {
		    "entities": {
		      "Book": {
		        "eventLog": {
		          "enabled": true,
		        },
		        "fields": {
		          "id": {
		            "columnName": "id",
		            "columnType": "uuid",
		            "name": "id",
		            "nullable": false,
		            "type": "Uuid",
		          },
		          "title": {
		            "columnName": "title",
		            "columnType": "text",
		            "name": "title",
		            "nullable": true,
		            "type": "String",
		          },
		        },
		        "indexes": [],
		        "name": "Book",
		        "primary": "id",
		        "primaryColumn": "id",
		        "tableName": "book",
		        "unique": [],
		      },
		    },
		    "enums": {},
		  },
		  "settings": {
		    "tenant": {
		      "inviteExpirationMinutes": 10080,
		    },
		    "useExistsInHasManyFilter": true,
		  },
		  "validation": {
		    "Book": {
		      "title": [
		        {
		          "message": {
		            "text": "test",
		          },
		          "validator": {
		            "args": [],
		            "operation": "defined",
		          },
		        },
		      ],
		    },
		  },
		}
	`)
})
