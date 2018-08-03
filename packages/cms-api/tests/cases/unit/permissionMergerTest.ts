import 'mocha'
import { Acl } from 'cms-common'
import { expect } from 'chai'
import PermissionMerger from '../../../src/acl/PermissionMerger'

describe('permission merger', () => {
	it('merges inheritance', () => {
		const acl: Acl.Schema = {
			variables: {},
			roles: {
				role1: {
					entities: {
						Entity1: {
							predicates: {},
							operations: {
								read: {
									id: true
								}
							}
						}
					}
				},
				role2: {
					inherits: ['role1'],
					entities: {
						Entity2: {
							predicates: {},
							operations: {
								read: {
									id: true
								}
							}
						}
					}
				}
			}
		}

		const merger = new PermissionMerger()
		const result = merger.merge(acl, ['role2'])
		expect(result).deep.equals({
			Entity1: {
				predicates: {},
				operations: {
					read: {
						id: true
					}
				}
			},
			Entity2: {
				predicates: {},
				operations: {
					read: {
						id: true
					}
				}
			}
		})
	})

	it('merges entity operations', () => {
		const acl: Acl.Schema = {
			variables: {},
			roles: {
				role1: {
					entities: {
						Entity1: {
							predicates: {},
							operations: {
								read: {
									id: true
								}
							}
						}
					}
				},
				role2: {
					entities: {
						Entity1: {
							predicates: {},
							operations: {
								read: {
									title: true
								}
							}
						}
					}
				}
			}
		}

		const merger = new PermissionMerger()
		const result = merger.merge(acl, ['role1', 'role2'])
		expect(result).deep.equals({
			Entity1: {
				predicates: {},
				operations: {
					read: {
						id: true,
						title: true
					}
				}
			}
		})
	})

	it('merges entity operations with predicates', () => {
		const acl: Acl.Schema = {
			variables: {},
			roles: {
				role1: {
					entities: {
						Entity1: {
							predicates: {},
							operations: {
								read: {
									id: true
								}
							}
						}
					}
				},
				role2: {
					entities: {
						Entity1: {
							predicates: {
								foo: { bar: { eq: 'abc' } }
							},
							operations: {
								read: {
									title: 'foo'
								}
							}
						}
					}
				}
			}
		}

		const merger = new PermissionMerger()
		const result = merger.merge(acl, ['role1', 'role2'])
		expect(result).deep.equals({
			Entity1: {
				predicates: {
					foo: { bar: { eq: 'abc' } }
				},
				operations: {
					read: {
						id: true,
						title: 'foo'
					}
				}
			}
		})
	})

	it('merges entity operations and drops predicate', () => {
		const acl: Acl.Schema = {
			variables: {},
			roles: {
				role1: {
					entities: {
						Entity1: {
							predicates: {},
							operations: {
								read: {
									id: true,
									title: true
								}
							}
						}
					}
				},
				role2: {
					entities: {
						Entity1: {
							predicates: {
								foo: { bar: { eq: 'abc' } }
							},
							operations: {
								read: {
									title: 'foo'
								}
							}
						}
					}
				}
			}
		}

		const merger = new PermissionMerger()
		const result = merger.merge(acl, ['role1', 'role2'])
		expect(result).deep.equals({
			Entity1: {
				predicates: {},
				operations: {
					read: {
						id: true,
						title: true
					}
				}
			}
		})
	})

	it('merges entity operations and merges predicates', () => {
		const acl: Acl.Schema = {
			variables: {},
			roles: {
				role1: {
					entities: {
						Entity1: {
							predicates: {
								bar: { lorem: { eq: 'ipsum' } }
							},
							operations: {
								read: {
									id: true,
									title: 'bar'
								}
							}
						}
					}
				},
				role2: {
					entities: {
						Entity1: {
							predicates: {
								foo: { bar: { eq: 'abc' } }
							},
							operations: {
								read: {
									title: 'foo'
								}
							}
						}
					}
				}
			}
		}

		const merger = new PermissionMerger()
		const result = merger.merge(acl, ['role1', 'role2'])
		expect(result).deep.equals({
			Entity1: {
				predicates: {
					__merge__bar__foo: {
						or: [{ lorem: { eq: 'ipsum' } }, { bar: { eq: 'abc' } }]
					}
				},
				operations: {
					read: {
						id: true,
						title: '__merge__bar__foo'
					}
				}
			}
		})
	})

	it('merges delete operation', () => {
		const acl: Acl.Schema = {
			variables: {},
			roles: {
				role1: {
					entities: {
						Entity1: {
							predicates: {
								bar: { lorem: { eq: 'ipsum' } }
							},
							operations: {
								delete: 'bar'
							}
						}
					}
				},
				role2: {
					entities: {
						Entity1: {
							predicates: {
								foo: { bar: { eq: 'abc' } }
							},
							operations: {
								delete: 'foo'
							}
						}
					}
				}
			}
		}

		const merger = new PermissionMerger()
		const result = merger.merge(acl, ['role1', 'role2'])
		expect(result).deep.equals({
			Entity1: {
				predicates: {
					__merge__bar__foo: {
						or: [{ lorem: { eq: 'ipsum' } }, { bar: { eq: 'abc' } }]
					}
				},
				operations: {
					delete: '__merge__bar__foo'
				}
			}
		})
	})

	it('merges predicates and resolves conflicts', () => {
		const acl: Acl.Schema = {
			variables: {},
			roles: {
				role1: {
					entities: {
						Entity1: {
							predicates: {
								foo: { lorem: { eq: 'ipsum' } }
							},
							operations: {
								read: {
									id: true,
									title: 'foo'
								}
							}
						}
					}
				},
				role2: {
					entities: {
						Entity1: {
							predicates: {
								foo: { bar: { eq: 'abc' } }
							},
							operations: {
								read: {
									content: 'foo'
								}
							}
						}
					}
				}
			}
		}

		const merger = new PermissionMerger()
		const result = merger.merge(acl, ['role1', 'role2'])
		expect(result).deep.equals({
			Entity1: {
				predicates: {
					foo: { lorem: { eq: 'ipsum' } },
					foo_: { bar: { eq: 'abc' } }
				},
				operations: {
					read: {
						id: true,
						title: 'foo',
						content: 'foo_'
					}
				}
			}
		})
	})
})
