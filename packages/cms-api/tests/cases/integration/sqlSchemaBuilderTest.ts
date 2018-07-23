import SchemaBuilder from "../../../src/schema/builder/SchemaBuilder";
import { expect } from "chai"
import getSql from "../../../src/sqlSchema/sqlSchemaBuilderHelper";
import { SQL } from "../../src/tags";
import { OnDelete } from "../../../src/schema/model";

const test = (test: { builder: (builder: SchemaBuilder) => SchemaBuilder, sql: string }) => {
  let builder = test.builder(new SchemaBuilder()).buildSchema();
  expect(getSql(builder).replace(/\s+/g, " ").trim()).equals(test.sql)
}

describe('Create SQL schema', () => {
  it('author table (no relations, unique on column)', () => {
    test({
      builder: builder => builder
        .entity("Author", e => e
          .column("name", c => c.type('string'))
          .column("email", c => c.type('string').unique())
          .column("registeredAt", c => c.type('datetime'))
        ),
      sql: SQL`CREATE TABLE "author" (
        "id"            uuid PRIMARY KEY,
        "name"          text,
        "email"         text,
        "registered_at" timestamp
      );
      CREATE UNIQUE INDEX "author_email_unique_index"
        ON "author" ("email");`
    })
  })

  it('post with author (many has one)', () => {
    test({
      builder: builder => builder
        .entity("Post", e => e
          .column('title', c => c.type('string'))
          .manyHasOne('author', r => r.target('Author').onDelete(OnDelete.cascade))
        )
        .entity("Author", e => e
          .column("name", c => c.type('string'))
        ),
      sql: SQL`CREATE TABLE "post" (
        "id"        uuid PRIMARY KEY,
        "title"     text,
        "author_id" uuid
      );
      CREATE TABLE "author" (
        "id"   uuid PRIMARY KEY,
        "name" text
      );
      CREATE INDEX "post_author_id_index"
        ON "post" ("author_id");
      ALTER TABLE "post"
        ADD CONSTRAINT "fk_post_author" FOREIGN KEY ("author_id") REFERENCES "author"(id) ON DELETE cascade;`
    })
  })

  it('post with locales (one has many)', () => {
    test({
      builder: builder => builder
        .entity("Post", e => e
          .oneHasMany('locales', r => r.target('PostLocale').ownerNotNull().ownedBy('post'))
        )
        .entity('PostLocale', e => e
          .unique(['post', 'locale'])
          .column('title', c => c.type('string'))
          .column('locale', c => c.type('string'))
        ),
      sql: SQL`CREATE TABLE "post" (
        "id" uuid PRIMARY KEY
      );
      CREATE TABLE "post_locale" (
        "post_id" uuid NOT NULL,
        "id"      uuid PRIMARY KEY,
        "title"   text,
        "locale"  text
      );
      CREATE UNIQUE INDEX "post_locale_post_id_locale_unique_index"
        ON "post_locale" ("post_id", "locale");
      CREATE INDEX "post_locale_post_id_index"
        ON "post_locale" ("post_id");
      ALTER TABLE "post_locale"
        ADD CONSTRAINT "fk_post_locale_post" FOREIGN KEY ("post_id") REFERENCES "post"(id) ON DELETE restrict;`
    })
  })

  it('post with categories (many has many)', () => {
    test({
      builder: builder => builder
        .entity('Post', e => e
          .column('title', c => c.type('string'))
          .manyHasMany('categories', r => r.target('Category'))
        )
        .entity('Category', e => e
          .column('title', c => c.type('string'))
        ),
      sql: SQL`CREATE TABLE "post_categories" (
        "post_id"     uuid NOT NULL,
        "category_id" uuid NOT NULL,
        CONSTRAINT "post_categories_pkey" PRIMARY KEY ("post_id", "category_id")
      );
      CREATE TABLE "post" (
        "id"    uuid PRIMARY KEY,
        "title" text
      );
      CREATE TABLE "category" (
        "id"    uuid PRIMARY KEY,
        "title" text
      );
      ALTER TABLE "post_categories"
        ADD CONSTRAINT "fk_post_categories_Post" FOREIGN KEY ("post_id") REFERENCES "post"(id) ON DELETE cascade;
      ALTER TABLE "post_categories"
        ADD CONSTRAINT "fk_post_categories_Category" FOREIGN KEY ("category_id") REFERENCES "category"(id) ON DELETE cascade;`,
    })
  })

  it('site and setting (one has one)', () => {
    test({
      builder: builder => builder
        .entity("Site", entity => entity
          .column("name", c => c.type('string'))
          .oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site'))
        )
        .entity('SiteSetting', e => e
          .column('url', c => c.type('string'))
        ),
      sql: SQL`CREATE TABLE "site" (
        "id"         uuid PRIMARY KEY,
        "name"       text,
        "setting_id" uuid
      );
      CREATE TABLE "site_setting" (
        "id"  uuid PRIMARY KEY,
        "url" text
      );
      CREATE UNIQUE INDEX "site_setting_id_unique_index"
        ON "site" ("setting_id");
      ALTER TABLE "site"
        ADD CONSTRAINT "fk_site_setting" FOREIGN KEY ("setting_id") REFERENCES "site_setting"(id) ON DELETE restrict;`,
    })
  })
})
