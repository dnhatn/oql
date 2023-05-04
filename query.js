/* find all queries specified in SearchSourceBuilder in the heap dump */

function to_js(o) {
   if (o == null) {
      return null;
   }
   /* primitive types */
   if (classof(o) == null) {
      return toHtml(o);
   }
   switch(classof(o).name) {
      /* base classes */
      case 'java.lang.String':
         return o.toString();
      case 'java.lang.Integer':
      case 'java.lang.Long':
      case 'java.lang.Float':
      case 'java.lang.Double':
         return o.value;
      case 'java.util.ArrayList':
         return array_list_to_js(o);
      case 'java.util.HashSet':
         return hash_set_to_js(o);
      case 'java.util.HashMap':
         return hash_map_to_js(o);
      case 'java.util.TreeMap':
         return tree_map_to_js(o);
      /* Lucene and ES types */
      case 'org.apache.lucene.util.BytesRef':
         return String.fromCharCode.apply('utf8', o.bytes);
      case 'org.elasticsearch.common.bytes.BytesArray':
         return String.fromCharCode.apply('utf8', o.bytes);
      /* suggestions */
      case 'org.elasticsearch.search.suggest.SuggestBuilder':
          return suggest_builder(o);
      case 'org.elasticsearch.search.suggest.completion.CompletionSuggestionBuilder':
          return completion_suggestion_builder(o);          
      /* queries */
      case 'org.elasticsearch.index.query.BoolQueryBuilder':
         return bool_query(o);
      case 'org.elasticsearch.index.query.RangeQueryBuilder':
         return range_query(o);
      case 'org.elasticsearch.index.query.MatchAllQueryBuilder':
         return {'match_all': {}};
      case 'org.elasticsearch.index.query.MatchNoneQueryBuilder':
         return {'match_none': {}};         
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
      case 'org.elasticsearch.index.query.QueryStringQueryBuilder':
         return query_string(o);
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

function hash_map_to_js(map) {
   return hash_map_to_js(map, {});
}

function hash_map_to_js(map, rs) {
  for (var i in map.table) {
    var entry = map.table[i];
    if (entry != null) {
      rs[to_js(entry.key)] = to_js(entry.value);
    }
  }
}

function tree_map_to_js(map) {
    return tree_map_to_js(map.root, {});
}

function tree_map_to_js(e, rs) {
    if (e == null) {
        return rs
    }
    if (e.key != null && e.value != null) {
        rs[to_js(e.key)] = to_js(e.value);
    }
    tree_map_to_js(e.left, rs);
    tree_map_to_js(e.right, rs)
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

function query_string(o) {
   return {
        'query_string': {
            'fields': to_js(o.fieldsAndWeights),
            'query': to_js(o.queryString)
        }
   }
}

function suggest_builder(o) {
    var suggest = {};
    suggest["text"] = to_js(o.globalText);
    hash_map_to_js(o.suggestions, suggest);    
    return suggest;
}

function completion_suggestion_builder(o) {
    return {
      field: to_js(o.field),
      text: to_js(o.text),  
      prefix: to_js(o.prefix),
      regex: to_js(o.regex), 
      analyzer: to_js(o.analyzer),
      size: to_js(o.size),
      shard_size: to_js(o.shardSize),
      //fields that are specific to completion suggester
      fuzzy: fuzzy_options(o.fuzzyOptions),
      regex: regex_options(o.regexOptions),
      skip_duplicates: to_js(o.skipDuplicates),
      contexts: to_js(o.contextBytes)
    };
}

function fuzzy_options(fuzzy) {
   if (fuzzy == null) {
       return null;    
   }
   return { 
       edit_distance: to_js(fuzzy.editDistance),
       transpositions: to_js(fuzzy.transpositions),
       fuzzy_min_length: to_js(fuzzy.fuzzyMinLength),
       fuzzy_prefix_length: to_js(fuzzy.fuzzyPrefixLength),
       unicode_aware: to_js(fuzzy.unicodeAware),
       max_determinized_states: to_js(fuzzy.maxDeterminizedStates)
   };
}

function regex_options(regex) {
    if (regex == null) {
        return null;    
    }
    return {
        flags_value: to_js(regex.flagsValue),
        max_determinized_states: to_js(regex.maxDeterminizedStates)  
    };
}

map(heap.objects(heap.findClass('org.elasticsearch.search.builder.SearchSourceBuilder'), true), function (source) {
    var request = {
        query: to_js(source.queryBuilder),
        post_filter: to_js(source.postQueryBuilder),
        suggest: to_js(source.suggestBuilder)
    };
    return toHtml(source) + ":\n" + JSON.stringify(request, null, 4);
});
