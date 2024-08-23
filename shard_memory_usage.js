/** Calculate the number of shards, segments, and fields from a heap dump, then estimate the memory usage */
function shardFieldStats(shard) {
    var segments = 0;
    var fields = 0;
    var shardFieldStats = shard.shardFieldStats;
    if (shardFieldStats) {
        segments = shardFieldStats.numSegments;
        fields = shardFieldStats.totalFields;
    } else {
        var engine = shard.currentEngineReference.value;
        if (engine) {
            var readerManager = shard.currentEngineReference.value.readerManager;
            if (readerManager) {
                var subReaders = readerManager.current.subReaders;
                for (i in subReaders){
                    var reader = subReaders[i];
                    // unwrap filtered reader
                    while(reader.in) {
                        reader = reader.in;
                    }
                    segments += 1;
                    fields += reader.fieldInfos.byName.size;
                }
            }
        }
    }
    return {"segments": segments, "fields": fields};
}

var globalStats = {
    "shards": 0,
    "segments": 0,
    "fields": 0,
    "prev_estimate": "",
    "new_estimate": ""
};

heap.forEachObject(function(shard){
    var stats = shardFieldStats(shard);
    globalStats.shards += 1;
    globalStats.segments += stats.segments;
    globalStats.fields += stats.fields;
},'org.elasticsearch.index.shard.IndexShard', false);

SHARD_OVERHEAD = 75 * 1024;
SEGMENT_OVERHEAD = 55 * 1024;
FIELD_OVERHEAD = 1024;

function estimateMemoryUsage(stats) {
    stats.prev_estimate = (stats.shards * 6) + "mb";
    var estimate = stats.shards * SHARD_OVERHEAD + stats.segments * SEGMENT_OVERHEAD + stats.fields* FIELD_OVERHEAD;
    estimate *= 1.5; /* additional 50% overhead */
    stats.new_estimate = ((estimate / 1024/1024) | 0) + "mb";
}

estimateMemoryUsage(globalStats);

globalStats;