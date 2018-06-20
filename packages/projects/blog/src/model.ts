interface Entity
{
  fields: { [name: string]: Field | Relation }
}

interface Field
{
  type: Type
  unique?: boolean
  nullable?: boolean
  options?: {
    [name: string]: any,
  }
}

interface Relation
{
  has: 'one' | 'many'
  target: string
  inversedBy?: string
}

interface Schema
{
  entities: { [name: string]: Entity }
}


type Type = string;

export default {
  entities: {
    Post: {
      fields: {
        publishedAt: {type: 'datetime'},
        locales: {has: 'many', target: 'PostLocale', inversedBy: 'post'},
        sites: {has: 'many', target: 'PostSite'},
      }
    },
    PostLocale: {
      fields: {
        post: {has: 'one', target: 'Post'},
        locale: {type: 'enum', options: {values: ['cs', 'en']}},
        title: {type: 'string'},
      }
    },
    PostSite: {
      fields: {
        post: {has: 'one', target: 'Post'},
        site: {has: 'one', target: 'Site'},
        visibility: {type: 'enum', options: {values: ['visible', 'hidden']}},
      }
    },
    Site: {
      fields: {
        name: {type: 'string'},
      },
    }
  }
} as Schema
