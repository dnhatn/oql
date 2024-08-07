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
      case 'java.util.LinkedHashSet':
         return linkedhash_set_to_js(o);
      case 'java.util.HashMap':
         return hash_map_to_js(o);
      case 'java.util.TreeMap':
         return tree_map_to_js(o);
      /* Lucene and ES types */
      case 'org.apache.lucene.util.BytesRef':
         return String.fromCharCode.apply('utf8', o.bytes);
      case 'org.elasticsearch.common.bytes.BytesArray':
         return String.fromCharCode.apply('utf8', o.bytes);
      case 'org.elasticsearch.search.builder.SubSearchSourceBuilder':
         return to_js(o.queryBuilder);
      /* suggestions */
      case 'org.elasticsearch.search.suggest.SuggestBuilder':
          return suggest_builder(o);
      case 'org.elasticsearch.index.query.ConstantScoreQueryBuilder':
          return constant_score_query(o);
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
      case 'org.elasticsearch.index.query.PrefixQueryBuilder':   
      case 'org.elasticsearch.index.query.WildcardQueryBuilder':
         return single_field_value_query(o);
      case 'org.elasticsearch.index.query.TermsQueryBuilder':
         return terms_query(o);
      case 'org.elasticsearch.index.query.NestedQueryBuilder':
         return nested_query(o);
      case 'org.elasticsearch.join.query.HasParentQueryBuilder':
         return has_parent(o);
      case 'org.elasticsearch.index.query.IdsQueryBuilder':
         return ids_query(o);
      case 'org.elasticsearch.index.query.QueryStringQueryBuilder':
         return query_string(o);
      case 'org.elasticsearch.search.aggregations.AggregatorFactories$Builder':
          return aggfactory_Builder(o);
      case 'org.elasticsearch.search.aggregations.bucket.filter.FiltersAggregationBuilder':
           //return aggregationBuilder(o);
           return filters_agg(o);
      case 'org.elasticsearch.search.aggregations.bucket.filter.FiltersAggregator$KeyedFilter':
          return keyedfilter(o);
      case 'org.elasticsearch.search.aggregations.bucket.terms.TermsAggregationBuilder':
      case 'org.elasticsearch.search.aggregations.metrics.PercentilesAggregationBuilder':
      case 'org.elasticsearch.search.aggregations.metrics.MaxAggregationBuilder':
          return aggregationBuilder(o);
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

function linkedhash_set_to_js(es) {
   var rs = [];
   var node = es.map.head;
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
   clause[q.fieldName.toString()] = {'valuesRef': to_js(q.values.valueRef), 'values': to_js(q.values)};
   return {'terms': clause}; 
}

function has_parent(q) {
   sub_query = to_js(q.query);
   pt = to_js(q.parentType);

   return {'has_parent': { 'parent_type' : pt, 'query': sub_query } };
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
function constant_score_query(o) {
  return to_js(o.filterBuilder);
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

function aggfactory_Builder(builder) {
    var rs = [];
    var agg = to_js(builder.aggregationBuilders);
    if (agg != null) {
      rs.push(agg);
    }
    var pipeline = to_js(builder.pipelineAggregationBuilders);
    if (pipeline != null) {
      rs.push(pipeline);
    }
    return rs;
}

function aggregationBuilder(agg) {
    var out = {};
    out[agg.name] = { "type" : toHtml(agg)};
    if (agg.factoriesBuilder != null) {
      out["aggs"] = to_js(agg.factoriesBuilder);
    }
    return out;
}

function filters_agg(agg) {
    var out = {};
    out[agg.name] = to_js(agg.filters);
    if (agg.factoriesBuilder != null) {
      out["aggs"] = to_js(agg.factoriesBuilder);
    }
    return out;
}

function keyedfilter(kf) {
   var out = {};
   out[kf.key] = to_js(kf.filter);
   return out;
}


map(heap.objects(heap.findClass('org.elasticsearch.search.builder.SearchSourceBuilder'), true), function (source) {
    var request = {
        query: to_js(source.subSearchSourceBuilders),
        post_filter: to_js(source.postQueryBuilder),
        suggest: to_js(source.suggestBuilder),
        aggs : to_js(source.aggregations)
    };
    return toHtml(source) + ":\n" + JSON.stringify(request, null, 4);
});
