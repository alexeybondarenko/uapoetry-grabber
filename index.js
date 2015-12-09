var request = require("request-promise"),
    cheerio = require("cheerio"),
    Q = require("bluebird"),
    ProgressBar = require('progress');

function getParamFromUrlQuery(name, url) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}

function req(url) {
    return request({
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        }
    });
}

function getAuthorsPages(autorListPage) {
    return req(autorListPage).then(function ($) {
        var result = [];
        $('#posts li a').each(function (i, el) {
            var elem = $(el);
            var href = elem.attr('href');

            if (!href) return;
            result.push({
                id: parseInt(getParamFromUrlQuery('page_id', href)),
                name: elem.text(),
                url: href
            });
        });
        return result;
    });
}
function getPoemsPages(autorPageId) {
    return req('http://onlyart.org.ua/?page_id=' + autorPageId).then(function ($) {
        var result = [];
        $('#post-' + autorPageId + ' ul li a').each(function (i, el) {
            var elem = $(el);
            var href = elem.attr('href');
            if (!href) return;
            result.push({
                id: parseInt(getParamFromUrlQuery('page_id', href)),
                name: elem.text(),
                url: href
            });
        });
        return result;
    })
}
function getPoemPage (poemPageId) {
    return req('http://onlyart.org.ua/?page_id=' + poemPageId).then(function ($) {
        var result = [];
        $('#post-' + poemPageId + ' .entry p').each(function (i, el) {
            var elem = $(el);
            result.push(elem.text());
        });
        return result;
    })
}

var authorsListPageUrl = 'http://onlyart.org.ua/?page_id=5026';
//getAuthorsPages(authorsListPageUrl).then(function (authors) {
//    console.log(authors);
//    var promises = authors.map(function (autorItem) {
//        return getPoemPages(autorItem.id).catch(function (resp) {
//            return null;
//        });
//    });
//    return Q.all(promises);
//
//});
var testAuthor = {
    id: 11567,
    name: 'Герасим’юк Василь',
    url: 'http://onlyart.org.ua/?page_id=11567'
};


function getPoemsContentsByAuthorId (authorId) {
    var current = Q.resolve();
    return getPoemsPages(authorId).then(function (resp) {
        return Q.some(resp.map(function(item) {
            current = current.then(function () {
                return getPoemPage(item.id);
            }).then(function(result) {
                return {
                    name: item.name,
                    content: result
                };
            });
            return current;
        }), 10);
    });
}
function countPoems () {
    return getAuthorsPages(authorsListPageUrl).then(function (authors) {
        return Q.map(authors, function (author) {
            return getPoemsPages(author.id);
        }, {
            concurrency: 7
        });
    }).then(function (results) {
        return results.reduce(function (a, b) {
            return a + b.length;
        }, 0);
    })
}

//console.time("getPoemPage");
// 4940
//countPoems().then(function (result) {
//    console.log(result);
//    console.timeEnd("getPoemPage");
//});
// 14078.381ms
// 2  21261ms
// 3  17569ms
// 4  14916ms
// 5  13627ms 14571ms
// 6  14713ms
// 10 14043.007ms


var testPoem =  {
    id: 11831,
    name: '“На сіні, що срібліє над кущами…”',
    url: 'http://onlyart.org.ua/?page_id=11831'
};

console.time("Page grabbing");
var total = 300;
var bar = new ProgressBar('parsing [:bar] :percent :etas', {
    width: 20,
    total: total
});

Q.map(Array(total), function () {
    bar.tick();
    return getPoemPage (testPoem.id)
}, {
    concurrency: 5
}).then(function (resp) {
    console.timeEnd("Page grabbing");
});
// 100 - 19013.205ms = 190
// 300 - 56246.226ms = 187

// 529ms

// Avg 4940 * 19013 / 100 / 1000 = 932s = 15min
