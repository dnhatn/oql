Some OQL scripts can be used to analyze the heapdumps of Elasticsearch intances with VisualVM.

- [query.js](query.js): extracts Elasticsearch queries in the heapdump

Instructions

1. Open [VisualVM](https://visualvm.github.io/)
2. Load the heapdump (with `.hprof` extension) to VisualVM
3. Select `OQL Console` from the dropdown on the top left
4. Open [query.js](query.js) on the console at the bottom panel and run it
5. Wait for the results
6. If see a list of objects, switch to html view by clicking the little button that looks like a page on the right of the `OQL Console`.
