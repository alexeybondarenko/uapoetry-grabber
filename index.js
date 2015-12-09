var request = require("request-promise"),
    cheerio = require("cheerio"),
    Q = require("bluebird");
    async = require("async");

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
var current = Q.resolve();
getPoemsPages(testAuthor.id).then(function (resp) {
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

}).then(function (resp) {
    console.log(resp);
});

//var testPoem =  {
//    id: 11831,
//    name: '“На сіні, що срібліє над кущами…”',
//    url: 'http://onlyart.org.ua/?page_id=11831'
//};
//
//
//getPoemPage (testPoem.id).then(function (resp) {
//    console.log(resp);
//});