import { SlugField } from '~/lib-extra/slug-field/field'
import { DataGridTextColumn, DefaultDataGrid } from '~/lib/datagrid'
import { SideDimensions } from '~/lib/dimensions'
import { CheckboxField, FormLayout, InputField, MultiSelectField, SelectField, TextareaField } from '~/lib/form'
import { DefaultRepeater, RepeaterItemActions, RepeaterRemoveItemButton } from '~/lib/repeater'
import { LinkAnchor, LinkAnchorButton } from '~/lib/links'
import { Component, EnvironmentMiddleware, Field, Link, Variable } from '@contember/interface'
import slugify from '@sindresorhus/slugify'
import { CreatePage, EditPage, GenericPage } from '~/lib/pages'

export default () => (
	<GenericPage
		title="Articles"
		actions={<>
			<LinkAnchorButton to="form/articleCreate">Create article</LinkAnchorButton>
			<LinkAnchorButton to="form/tagCreate">Create tag</LinkAnchorButton>
			<LinkAnchorButton to="form/authorCreate">Create author</LinkAnchorButton>
		</>}
	>
		<DefaultDataGrid entities="FormArticle">
			<DataGridTextColumn header="Internal name" field="internalName">
				<LinkAnchor to="form/articleEdit(id: $entity.id)">
					<Field field="internalName" />
				</LinkAnchor>
			</DataGridTextColumn>
		</DefaultDataGrid>

		<h2 className="text-2xl">Tags</h2>
		<DefaultDataGrid entities="FormTag">
			<DataGridTextColumn header="Name" field="name">
				<LinkAnchor to="form/tagEdit(id: $entity.id)">
					<Field field="name" />
				</LinkAnchor>
			</DataGridTextColumn>
		</DefaultDataGrid>

		<h2 className="text-2xl">Authors</h2>
		<DefaultDataGrid entities="FormAuthor">
			<DataGridTextColumn header="Name" field="name">
				<LinkAnchor to="form/authorEdit(id: $entity.id)">
					<Field field="name" />
				</LinkAnchor>
			</DataGridTextColumn>
		</DefaultDataGrid>
	</GenericPage>
)

export const ArticleCreate = () => (
	<CreatePage entity="FormArticle" title="Create article" sidebar={<ArticleSidebarForm />}>
		<ArticleForm />
	</CreatePage>
)

export const ArticleEdit = () => (
	<EditPage entity="FormArticle(id = $id)" title="Edit article">
		<ArticleForm />
	</EditPage>
)

export const TagCreate = () => (
	<CreatePage entity="FormTag" title="Create tag">
		<ArticleTagForm />
	</CreatePage>
)

export const TagEdit = () => (
	<EditPage entity="FormTag(id = $id)" title="Edit tag">
		<ArticleTagForm />
	</EditPage>
)

export const AuthorCreate = () => (
	<CreatePage entity="FormAuthor" title="Create author">
		<ArticleAuthorForm />
	</CreatePage>
)

export const AuthorEdit = () => (
	<EditPage entity="FormAuthor(id = $id)" title="Edit author">
		<ArticleAuthorForm />
	</EditPage>
)

export const ArticleForm = Component(() => (
	<FormLayout>
		<EnvironmentMiddleware create={it => it.withDimensions({ locale: ['cs', 'en'] })}>
			<SideDimensions dimension="locale" field="locales(locale = $currentLocale)" as="currentLocale">
				<h2 className="text-2xl"><Variable name="currentLocale" /></h2>
				<ArticleLocaleForm />
			</SideDimensions>
		</EnvironmentMiddleware>
		<DefaultRepeater field="notes" orderBy="createdAt" initialEntityCount={1}>
			<RepeaterItemActions>
				<RepeaterRemoveItemButton />
			</RepeaterItemActions>
			<ArticleNoteForm />
		</DefaultRepeater>
	</FormLayout>
))

export const ArticleSidebarForm = Component(() => (
	<FormLayout>
		<InputField field="internalName" required />
		<CheckboxField field="locked" />
		<InputField field="publishedAt" />
		<MultiSelectField field="tags" createNewForm={<ArticleTagForm />}>
			<Field field="name" />
		</MultiSelectField>
		<SelectField field="author" createNewForm={<ArticleAuthorForm />}>
			<Field field="name" />
		</SelectField>
	</FormLayout>
))

export const ArticleLocaleForm = Component(() => (
	<FormLayout>
		<SelectField field="article" createNewForm={<ArticleForm />}>
			<Field field="internalName" />
		</SelectField>
		<InputField field="title" required />
		<SlugField field="slug" derivedFrom="title" slugify={slugify} />
		<TextareaField field="content" />
	</FormLayout>
))

export const ArticleNoteForm = Component(() => (
	<FormLayout>
		<SelectField field="article" createNewForm={<ArticleForm />}>
			<Field field="internalName" />
		</SelectField>
		<TextareaField field="text" />
	</FormLayout>
))

export const ArticleTagForm = Component(() => (
	<FormLayout>
		<MultiSelectField field="articles" createNewForm={<ArticleForm />}>
			<Field field="internalName" />
		</MultiSelectField>
		<InputField field="name" required />
		<SlugField field="slug" derivedFrom="name" slugify={slugify} />
	</FormLayout>
))

export const ArticleAuthorForm = Component(() => (
	<FormLayout>
		<MultiSelectField field="articles" createNewForm={<ArticleForm />}>
			<Field field="internalName" />
		</MultiSelectField>
		<InputField field="name" required />
		<SlugField field="slug" derivedFrom="name" slugify={slugify} />
	</FormLayout>
))
