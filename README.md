Some OQL scripts can be used to analyze the heapdumps of Elasticsearch intances with VisualVM.

- [query.js](query.js): extracts Elasticsearch queries in the heapdump

Instructions

. Open [VisualVM](https://visualvm.github.io/)
. Load the heapdump (with `.hprof` extension) to VisualVM
. Select `OQL Console` from the dropdown on the top left
. Open [query.js](query.js) on the console at the bottom panel and run it
. Wait for the results
. If see a list of objects, switch to html view by clicking the little button that looks like a page on the right of the `OQL Console`.
