var atomicalgolia = require("atomic-algolia")
var indexName = process.env.ALGOLIA_INDEX_NAME
var indexPath = process.env.ALGOLIA_INDEX_FILE

var cb = function(error, result) {
    if (error) throw error

    console.log(result)
}

atomicalgolia(indexName, indexPath, cb)
