import 'mocha'
import { expect } from "chai"
import { QueryBuilder } from "../../../src/graphQlBuilder/QueryBuilder";
import { ObjectBuilder } from "../../../src/graphQlBuilder/ObjectBuilder";
import { Literal } from "../../../src/graphQlBuilder/Literal";

describe('GraphQlQueryBuilder', () => {
  it('construct simple query', () => {
    const query = new QueryBuilder()
      .query(builder => builder
        .object('Post', object => object
          .argument('where', {id: '123'})
          .field('id')
          .field('publishedAt')
          .object('locales', new ObjectBuilder()
            .argument('where', {locale: {eq: new Literal('cs')}})
            .field('id')
            .field('title')
          )
        )
        .object('Authors', o => o.field('id'))
      )
    expect(query).equals(`query {
	Post(where: {id: "123"}) {
		id
		publishedAt
		locales(where: {locale: {eq: cs}}) {
			id
			title
		}
	}
	Authors {
		id
	}     
}`)
  })
})
