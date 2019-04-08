const bodybuilder = require('bodybuilder');
const cloneDeep = require('clone-deep');

function getKey(object){
  return Object.keys(object).shift();
}

function parseAggr(orignalAggs){
  const aggs = cloneDeep(orignalAggs)
  const keys = Object.keys(aggs);

  return keys.map(function (key){

    const aggregation = aggs[key];

    const type = getKey(aggregation);
    const value = aggregation[type];
    const field = value.field;
    delete value.field;
    let nest = false;

    if (aggregation.aggs){
      nest =  parseAggr(aggregation.aggs);
    }

    const output = {
      name : key,
      type,
      field,
      options : value
    };
    if (nest){
      output.nest = nest;
    }

    return output;
  })
}

function parseQuery(query){

  const queryArray = [];
  parseQueryAndAppend(query, queryArray);

  const output = {}
  queryArray.forEach(function (item){

    const type = item.queryOrFilter;

    if (! Array.isArray(output[type])){
      output[type] = [];
    }
    delete item.queryOrFilter;
    output[type].push(item);
  });

  return output;

}

function parseQueryAndAppend(query,  queryArray,  queryOrFilter, queryType){

  const availableKeys = ['must', 'must_not', 'should'];

  queryOrFilter =  queryOrFilter || 'query';
  queryType = queryType || 'must'; // must_not // should;

  if (query.bool){
    const types = Object.keys(query.bool);
    return types.forEach(function (t){
      if (t === 'filter'){
        return parseQueryAndAppend(query.bool.filter,  queryArray, 'filter', queryType);
      }

      if ( ! availableKeys.includes(t)){
        throw `Type: ${t} was not found in availableKeys: ${availableKeys.join(',')}`;
      }

      const array = query.bool[t];

      if ( !Array.isArray(array)){
        return parseQueryAndAppend(array,  queryArray, queryOrFilter, t);
      }

      return array.forEach(function (object){
        return parseQueryAndAppend(object,  queryArray, queryOrFilter, t);
      });
    })
  }

  const type = getKey(query);
  const field = getKey(query[type]);
  const value = query[type][field];

  return queryArray.push({
    queryType,
    queryOrFilter,
    field,
    value,
    type
  });
}

function parseSort(sorts){

  return sorts.map(function (sort){
    const field = getKey(sort);
    const order = sort[field].order;
    return {
      field,
      order
    }
  });
}


function loadQuery(elasticsearchQueryObject){
  const eQuery = cloneDeep(elasticsearchQueryObject)
  const output = {};

  if (eQuery.query){
    const q = parseQuery(eQuery.query);
    output.query = q.query;
    output.filter = q.filter;
  }
  if (eQuery.aggs){
    output.aggs = parseAggr(eQuery.aggs);
  }

  if (eQuery.sort){
    output.sort = parseSort(eQuery.sort);
  }

  if (typeof eQuery.size === 'number'){
    output.size = eQuery.size;
  }
  return output;
}

function generateAggregation(aggs, bbQuery){
  if (aggs.nest){
    return bbQuery.agg(aggs.type, aggs.field, aggs.name, aggs.options, function (bbNested){
      const nest = aggs.nest[0];
      return generateAggregation(nest, bbNested);
    });
  }
  return bbQuery.agg(aggs.type, aggs.field, aggs.name, aggs.options);
}


function generateQuery(queryObject, asBodyBuilder = false){
  const bbQuery = bodybuilder();

  if ( Array.isArray(queryObject.query)){
    queryObject.query.forEach(function (q){
      switch (q.queryType) {
        case 'must':
          bbQuery.query(q.type, q.field, q.value);
          break;
        case 'must_not':
          bbQuery.notQuery(q.type, q.field, q.value);
          break;
        case 'should':
          bbQuery.orQuery(q.type, q.field, q.value);
          break;
        default:
          bbQuery.query(q.type, q.field, q.value);
      }
    })
  }

  if ( Array.isArray(queryObject.filter)){
    queryObject.filter.forEach(function (q){
      switch (q.queryType) {
        case 'must':
          bbQuery.filter(q.type, q.field, q.value);
          break;
        case 'must_not':
          bbQuery.notFilter(q.type, q.field, q.value);
          break;
        case 'should':
          bbQuery.orFilter(q.type, q.field, q.value);
          break;
        default:
          bbQuery.filter(q.type, q.field, q.value);
      }
    });
  }

  if ( Array.isArray(queryObject.aggs)){
    queryObject.aggs.forEach(function (q){
      generateAggregation(q, bbQuery)
    });
  }

  if ( Array.isArray(queryObject.sort)){
    const sorts = queryObject.sort.map(function (q){
      const object = {};
      object[q.field] = q.order;
      return object;
    });
    bbQuery.sort(sorts);
  }

  if (asBodyBuilder) return bbQuery;
  return bbQuery.build();
}



module.exports = {
  generateQuery,
  loadQuery
};
