/* find all queries specified in SearchSourceBuilder in the heap dump */

function to_js(o) {
   if (o == null) {
      return null;
   }
   switch(classof(o).name) {
      /* primitive types */
      case 'java.lang.String':
         return o.toString();
      case 'java.lang.Integer':
      case 'java.lang.Long':
         return o.value;
      case 'java.util.ArrayList':
         return array_list_to_js(o);
      case 'java.util.HashSet':
         return hash_set_to_js(o);
      /* Lucene and ES types */
      case 'org.apache.lucene.util.BytesRef':
         return String.fromCharCode.apply('utf8', o.bytes);

      /* queries */
      case 'org.elasticsearch.index.query.BoolQueryBuilder':
         return bool_query(o);
      case 'org.elasticsearch.index.query.RangeQueryBuilder':
         return range_query(o);
      case 'org.elasticsearch.index.query.MatchAllQueryBuilder':
         return {'match_all': {}};
      case 'org.elasticsearch.index.query.ExistsQueryBuilder':
         return {'exist': {'field': to_js(o.fieldName)}};

      /* single field-value queries (i.e., term, match, wildcard) */
      case 'org.elasticsearch.index.query.MatchPhraseQueryBuilder':
      case 'org.elasticsearch.index.query.MatchQueryBuilder':
      case 'org.elasticsearch.index.query.TermQueryBuilder':
      case 'org.elasticsearch.index.query.WildcardQueryBuilder':
         return single_field_value_query(o);
      case 'org.elasticsearch.index.query.TermsQueryBuilder':
         return terms_query(o);
      case 'org.elasticsearch.index.query.NestedQueryBuilder':
         return nested_query(o);
      case 'org.elasticsearch.index.query.IdsQueryBuilder':
         return ids_query(o);
      default:
         return 'unsupported type: ' + toHtml(o);
   }
}

function array_list_to_js(es) {
   var rs = [];
   for(var i = 0; i < es.size; i++) {
      var e = es.elementData[i];
      rs.push(to_js(e));
   }
   return rs;
}

function hash_set_to_js(es) {
   var rs = [];
   var node = es.map.table;
   while (node != null && node.key != null) {
      var k = to_js(node.key);
      node = node.next;
      rs.push(k);
   }
   return rs;
}

function single_field_value_query(q) {
   var clause = {};
   clause[q.fieldName.toString()] = to_js(q.value);
   var query = {};
   var name = classof(q).statics['NAME'];
   query[name.toString()] = clause;
   return query;
}

function terms_query(q) {
   var clause = {};
   clause[q.fieldName.toString()] = to_js(q.values.values);
   return {'terms': clause};
}

function bool_query(q) {
   var clauses = {};
   if (q.filterClauses.size > 0) {
      clauses['filter'] = to_js(q.filterClauses);
   }
   if (q.shouldClauses.size > 0) {
      clauses['should'] = to_js(q.shouldClauses);
   }
   if (q.mustClauses.size > 0) {
      clauses['must'] = to_js(q.mustClauses);
   }
   if (q.mustNotClauses.size > 0) {
      clauses['must_not'] = to_js(q.mustNotClauses);
   }
   return { 'bool': clauses };
}

function range_query(q) {
   var clause = {};
   clause[q.includeLower ? "gte" : "gt"] = to_js(q.from);
   clause[q.includeUpper ? "lte" : "le"] = to_js(q.to);
   var query = {};
   query[q.fieldName.toString()] = clause;
   return {'range': query};
}

function nested_query(o) {
   return {
      'nested': {
         'path' : to_js(o.path),
         'query': to_js(o.query)
      }
   }
}

function ids_query(o) {
   return {
      'ids': to_js(o.ids)
   }
}

map(heap.objects(heap.findClass('org.elasticsearch.search.builder.SearchSourceBuilder'), true), function (source) {
   return toHtml(source) + "\n" + JSON.stringify(to_js(source.queryBuilder));
});
