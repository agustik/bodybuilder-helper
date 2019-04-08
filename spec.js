


const bbHelpder = require('./index.js');


const bodybuilder = require('bodybuilder');


test('Simple query test', () => {
  const elasticQuery = bodybuilder()
                          .query('match', 'field1', 'value1')
                          .build();
  const loaded = bbHelpder.loadQuery(elasticQuery);
  const parsed = bbHelpder.generateQuery(loaded);

  expect(loaded.query).toBeDefined();
  expect(loaded.filter).not.toBeDefined();
  expect(loaded.query.length).toBe(1);
  expect(elasticQuery).toMatchObject(parsed);
});


test('Simple filter test', () => {
  const elasticQuery = bodybuilder()
                          .filter('term', 'field1', 'value1')
                          .build();
  const loaded = bbHelpder.loadQuery(elasticQuery);
  const parsed = bbHelpder.generateQuery(loaded);

  expect(loaded.filter).toBeDefined();
  expect(loaded.query).not.toBeDefined();
  expect(loaded.filter.length).toBe(1);
  expect(elasticQuery).toMatchObject(parsed);
});



test('Simple filter and query test', () => {
  const elasticQuery = bodybuilder()
                          .filter('term', 'field1', 'value1')
                          .query('match', 'field1', 'value1')
                          .build();
  const loaded = bbHelpder.loadQuery(elasticQuery);
  const parsed = bbHelpder.generateQuery(loaded);

  expect(loaded.filter).toBeDefined();
  expect(loaded.query).toBeDefined();
  expect(loaded.filter.length).toBe(1);
  expect(loaded.query.length).toBe(1);

  expect(elasticQuery).toMatchObject(parsed);
});


test('Simple aggregation', () => {
  const elasticQuery = bodybuilder()
                          .agg('term', 'field1')
                          .build();
  const loaded = bbHelpder.loadQuery(elasticQuery);
  const parsed = bbHelpder.generateQuery(loaded);

  expect(loaded.aggs).toBeDefined();
  expect(loaded.filter).not.toBeDefined();
  expect(loaded.query).not.toBeDefined();

  expect(loaded.aggs.length).toBe(1);

  expect(elasticQuery).toMatchObject(parsed);
});

test('Add sort', () => {
  const elasticQuery = bodybuilder()
                          .sort([ {'user': 'asc'} ])
                          .build();
  const loaded = bbHelpder.loadQuery(elasticQuery);
  const parsed = bbHelpder.generateQuery(loaded);

  expect(loaded.aggs).not.toBeDefined();
  expect(loaded.filter).not.toBeDefined();
  expect(loaded.query).not.toBeDefined();


  expect(loaded.sort.length).toBe(1);

  expect(elasticQuery).toMatchObject(parsed);
});


test('Complex query', () => {
  const elasticQuery = bodybuilder()
                          .query('match', 'message', 'this is a test')
                          .filter('term', 'user', 'kimchy')
                          .filter('term', 'user', 'herald')
                          .orFilter('term', 'user', 'johnny')
                          .notFilter('term', 'user', 'cassie')
                          .aggregation('terms', 'user')
                          .build();

  const loaded = bbHelpder.loadQuery(elasticQuery);
  const parsed = bbHelpder.generateQuery(loaded);
  console.log('Complex', JSON.stringify(loaded, null, 2))

  expect(loaded.aggs).toBeDefined();
  expect(loaded.filter).toBeDefined();
  expect(loaded.query).toBeDefined();



  expect(elasticQuery).toMatchObject(parsed);
});
