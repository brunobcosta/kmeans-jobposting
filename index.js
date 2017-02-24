var MongoClient = require('mongodb').MongoClient;
var natural = require('natural'),
    TfIdf = natural.TfIdf;
var removeDiacritics = require('diacritics').remove;
var _ = require('lodash');


// Connection URL 
var url = 'mongodb://localhost:27017/geojobs';
// Use connect method to connect to the Server 
MongoClient.connect(url, function (err, db) {
    findDocuments(db, function (docs) {
        var tfidf = new TfIdf();
        console.log("Tokenizing...");
        for (var i in docs) {
            tfidf.addDocument(removeDiacritics(docs[i].Description));
        }

        var terms = [];
        for (var d in tfidf.documents) {
            for (var term in tfidf.documents[d]) {
                if (term != '__key')
                    terms.push(term);
            }
        }
        //terms.sort(function (x, y) { return x === y ? 0 : x > y ? 1 : -1; });
        terms = _.uniq(terms);


        console.log("Vetorizing...");
        var vectors = new Array();
        for (var d in tfidf.documents) {
            //vectors[d] = _.map(tfidf.listTerms(d),'tfidf').slice(0,10);
            vectors[d] =new Array();
            for (var t in terms) {
                vectors[d][t] = tfidf.tfidf(terms[t], d);
            }
        }

        const kmeans = require('node-kmeans');
        console.log('Clusterizing...');
        kmeans.clusterize(vectors, { k: 100 }, (err, res) => {
            var inds = _.map(res, 'clusterInd');
            for(var i in inds)
            {
                var bla = new Array();
                for(var j in inds[i]){
                    bla[j]=docs[inds[i][j]].Title;
                }
                console.log(bla);
            }
        });






        db.close();
    })
});

var findDocuments = function (db, callback) {
    console.log("Finding...");
    var list = db.collection("jobs").find({}).toArray(function (err, docs) {
        callback(docs);
    });
};

