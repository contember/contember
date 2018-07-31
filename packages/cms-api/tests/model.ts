import { RelationType, Schema } from "../src/content-schema/model"

const schema: Schema = {
  enums: {
    siteVisibility: ["visible", "hidden"],
    locale: ["cs", "en"],
  },
  entities: {
    Author: {
      name: "Author",
      pluralName: "Authors",
      primary: "id",
      primaryColumn: "id",
      tableName: "Author",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        name: {name: "name", type: "string", columnName: "name"},
        posts: {name: "posts", relation: RelationType.OneHasMany, target: "Post", ownedBy: "author"}
      }
    },
    Category: {
      name: "Category",
      pluralName: "Categories",
      primary: "id",
      primaryColumn: "id",
      tableName: "Category",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        locales: {name: "locales", relation: RelationType.OneHasMany, target: "CategoryLocale", ownedBy: "category"},
        posts: {name: "posts", relation: RelationType.ManyHasMany, target: "Post", ownedBy: "categories"},
      }
    },
    CategoryLocale: {
      name: "CategoryLocale",
      pluralName: "CategoryLocales",
      primary: "id",
      primaryColumn: "id",
      tableName: "CategoryLocale",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        name: {name: "name", type: "string", columnName: "name"},
        locale: {name: "locale", type: "locale", columnName: "locale"},
        category: {
          name: "category",
          relation: RelationType.ManyHasOne,
          target: "Category",
          inversedBy: "locales",
          joiningColumn: {
            columnName: "category_id",
            onDelete: "restrict",
          }
        },
      }
    },
    Post: {
      name: "Post",
      pluralName: "Posts",
      primary: "id",
      primaryColumn: "id",
      tableName: "Post",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        publishedAt: {name: "publishedAt", type: "datetime", columnName: "publishedAt"},
        author: {
          name: "author",
          relation: RelationType.ManyHasOne,
          target: "Author",
          joiningColumn: {columnName: "author_id", onDelete: "cascade"},
          inversedBy: "posts"
        },
        locales: {name: "locales", relation: RelationType.OneHasMany, target: "PostLocale", ownedBy: "post"},
        sites: {name: "sites", relation: RelationType.OneHasMany, target: "PostSite", ownedBy: "post"},
        categories: {
          name: "categories",
          relation: RelationType.ManyHasMany,
          target: "Category",
          inversedBy: "posts",
          joiningTable: {
            tableName: "PostCategories",
            joiningColumn: {
              columnName: "post_id",
              onDelete: "cascade"
            },
            inverseJoiningColumn: {
              columnName: "category_id",
              onDelete: "cascade"
            }
          }
        },
      }
    },
    PostLocale: {
      name: "PostLocale",
      pluralName: "PostLocales",
      primary: "id",
      primaryColumn: "id",
      tableName: "PostLocale",
      unique: [{fields: ["post", "locale"], name: "unique_post_locale"}],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        post: {
          name: "post",
          relation: RelationType.ManyHasOne,
          target: "Post",
          inversedBy: "locales",
          joiningColumn: {
            columnName: "post_id",
            onDelete: "cascade",
          }
        },
        locale: {name: "locale", type: "locale", columnName: "locale"},
        title: {name: "title", type: "string", columnName: "title"},
      }
    },
    PostSite: {
      name: "PostSite",
      pluralName: "PostSites",
      primary: "id",
      primaryColumn: "id",
      tableName: "PostSite",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        post: {
          name: "post",
          relation: RelationType.ManyHasOne,
          target: "Post",
          inversedBy: "sites",
          joiningColumn: {
            columnName: "post_id",
            onDelete: "cascade",
          }
        },
        site: {
          name: "site",
          relation: RelationType.ManyHasOne,
          target: "Site",
          joiningColumn: {
            columnName: "site_id",
            onDelete: "cascade"
          }
        },
        visibility: {name: "visibility", type: "siteVisibility", columnName: "visibility"},
      }
    },
    Site: {
      name: "Site",
      pluralName: "Sites",
      primary: "id",
      primaryColumn: "id",
      tableName: "Site",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        name: {name: "name", type: "string", columnName: "name"},
        setting: {
          name: "setting", relation: RelationType.OneHasOne, inversedBy: "site", target: "SiteSetting", nullable: false, joiningColumn: {
            columnName: "setting_id",
            onDelete: "cascade"
          }
        }
      },
    },
    SiteSetting: {
      name: "SiteSetting",
      pluralName: "SiteSettings",
      primary: "id",
      primaryColumn: "id",
      tableName: "SiteSetting",
      unique: [],
      fields: {
        id: {name: "id", type: "uuid", columnName: "id"},
        url: {name: "url", type: "string", columnName: "url"},
        site: {name: "site", relation: RelationType.OneHasOne, ownedBy: "setting", target: "Site"}
      }
    },
  }
}

export default schema
