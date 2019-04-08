

## Bodybuilder helper ##

So, you are using bodybuilder in your application, and say it's a web application.

You are using it with elasticsearch and you want to take existing Elasticsearch-JSON query from the URI parameter and load into bodybuilder?

```
const bbHelpder = require('bodybuilder-helper');


const elasticQuery = {
  "query": {
    "bool": {
      "filter": {
        "bool": {
          "must": [
            {
              "term": {
                "user": "kimchy"
              }
            },
            {
              "term": {
                "user": "herald"
              }
            }
          ],
          "should": [
            {
              "term": {
                "user": "johnny"
              }
            }
          ],
          "must_not": [
            {
              "term": {
                "user": "cassie"
              }
            }
          ]
        }
      },
      "must": {
        "match": {
          "message": "this is a test"
        }
      }
    }
  },
  "aggs": {
    "agg_terms_user": {
      "terms": {
        "field": "user"
      }
    }
  }
};

const loaded = bbHelpder.loadQuery(elasticQuery);

console.log(loaded);

// {
//   "query": [
//     {
//       "queryType": "must",
//       "field": "message",
//       "value": "this is a test",
//       "type": "match"
//     }
//   ],
//   "filter": [
//     {
//       "queryType": "must",
//       "field": "user",
//       "value": "kimchy",
//       "type": "term"
//     },
//     {
//       "queryType": "must",
//       "field": "user",
//       "value": "herald",
//       "type": "term"
//     },
//     {
//       "queryType": "should",
//       "field": "user",
//       "value": "johnny",
//       "type": "term"
//     },
//     {
//       "queryType": "must_not",
//       "field": "user",
//       "value": "cassie",
//       "type": "term"
//     }
//   ],
//   "aggs": [
//     {
//       "name": "agg_terms_user",
//       "type": "terms",
//       "field": "user",
//       "options": {}
//     }
// }  

```

Now you can add and remove query as it is a object in array.

Want to add filter?

```
loaded.filter.push({
  type : 'term',
  queryType:'must',
  value : 'hostname.keyword',
  value : 'example.com'
});

// Get the query

const elasticJson = bbHelpder.generateQuery(loaded);


```
