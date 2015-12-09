var request = require("request-promise"),
    cheerio = require("cheerio");

var authorsPageUrl = 'http://onlyart.org.ua/?page_id=5026';
function getParamFromUrlQuery ( name, url) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    return results == null ? null : results[1];
}

function getAuthorsPages () {
    request({
        uri: authorsPageUrl,
        transform: function (body) {
            return cheerio.load(body);
        }
    }).then(function ($) {
        var result = [];
        $('#posts li').each(function (i, el) {
            var link = $('a', el),
                href = link.attr('href');

            if (!href) return;
            result.push({
                id: getParamFromUrlQuery('page_id', href),
                name: link.text()
            });
        });
        console.log(result);
    });
}

getAuthorsPages();