var request = require('request');
var cheerio = require('cheerio');
var url = require('url');
var util = require('util');

exports.linksWaiting = 0;
exports.login = function(users, password, callback) {
    request.post('https://ssl.reddit.com/post/login', {form:{user:users, passwd: password}}, callback);
}
/**
 * Created with JetBrains WebStorm.
 * User: diego
 * Date: 20.10.12
 * Time: 15:23
 * To change this template use File | Settings | File Templates.
 */
exports.search = function(req, res){
    var urlParam = req.param('url');
    var users = req.param('username');
    var password = req.param('password');
    var linkArray = [];
    var searchString = req.param('searchString');
    req.assert('searchString', 'SearchString Too short').notEmpty().len(3);

    var errors = req.validationErrors();
    if (errors) {
        res.send('There have been validation errors: ' + util.inspect(errors), 500);
        return;
    }
    exports.login(users, password, function(err, resp, body){
        request('http://www.reddit.com'+urlParam, function(err, resp, body){
            $ = cheerio.load(body);
            var links = $('a.title, a.comments'); //use your CSS selector here
            var currentLink;
            $(links).each(function(i, link){
                var parsedLink = url.parse($(link).attr('href'));
                var linkToPass = parsedLink.host ? $(link).attr('href') : "http://www.reddit.com"+$(link).attr('href');
                if ($(link).attr('class').indexOf("title") > -1) {
                    linkArray.push(currentLink = {href:linkToPass, text:  $(link).text()})
                } else {
                    if ($(link).attr('class').indexOf("comments") > -1 && linkToPass) {
                        currentLink.commentLink = $(link).attr('href');

                    }
                }
            });
            var linkMap = {};
            for (var linkIndex = 0; linkIndex < linkArray.length; linkIndex++) {
                if (linkArray[linkIndex].commentLink) {
                    linkArray[linkIndex].inProgress = true;
                    linkArray[linkIndex].requestStart = new Date();
                    linkArray[linkIndex].commentArray = [];
                    console.log("Starting to process "+linkArray[linkIndex].commentLink);
                    linkMap[linkArray[linkIndex].commentLink] = linkArray[linkIndex];
                    request(linkArray[linkIndex].commentLink, function(err, resp, body) {
                        var $ = cheerio.load(body);
                        var comments = $('form div.md p');
                        var that = this;
                        $(comments ).each(function(i, comment) {
                            if ($(comment).text().indexOf(searchString) > -1) {
                                console.log($(comment).text());

                                (_ = $(comment).parent()) && (_ = _.parent()) && (_ = _.parent()) && (_ =_.next() ) && (_ =_.find('a:contains("permalink")' ) );
                                if (_) {
                                    var commObjToPush = {text: $(comment).text(), href:_.attr("href"), toString : function() {return this.text +" "+this.href; }};
                                    console.log("Pushing "+ commObjToPush );
                                    linkMap[that.uri.href].commentArray.push(commObjToPush );
                                } else {
                                    var commObjToPush = {text: $(comment).text(), href:"", toString : function() {return this.text +" "+this.href; }};

                                }
                            }
                        });
                        var analyzedCommentLink = linkMap[this.uri.href];
                        console.log("Finished processing "+this.uri.href);
                        linkMap[this.uri.href].inProgress = false;
                        exports.renderIfFinished(res, linkArray);
                        setTimeout(function() {
                            exports.renderIfFinished(res,linkArray);
                        }, 1000 );

                    });
                }
            }
        });
    });
};


exports.renderIfFinished = function (res, linkArray) {
    var inProgressLinks = 0;
    for (var linkIndex = 0; linkIndex < linkArray.length; linkIndex++) {
        var currentLink = linkArray[linkIndex];
        var currentDate = new Date();
        if ( (currentLink.inProgress) && ( currentDate.getTime() -currentLink.requestStart.getTime() <  10000)) {
            inProgressLinks++;
            //console.log("STILL IN PROGRESS : "+currentLink.commentLink);
        }
    }
    if (inProgressLinks > 0) {
        console.log("Still "+inProgressLinks+ " links in progress");
        if (inProgressLinks < 3) {
            setTimeout(function() {
                exports.renderIfFinished(res,linkArray);
            }, 1000 );

        }
    } else {
        console.log("Processing.... ");
        for (var linkIndex = 0; linkIndex < linkArray.length; linkIndex++) {

            var currentLink = linkArray[linkIndex];
            currentLink.inProgress = false;
            console.log(currentLink.href );
            console.log(currentLink.commentLink);
            if (currentLink.commentArray ) {
                for (var commIndex = 0; commIndex < currentLink.commentArray.length; commIndex++) {
                    console.log(currentLink.commentArray[commIndex].text);
                }
            } else {
                console.log("EMPTY COMMENT ARRAY");

                currentLink.commentArray = [];
            }

        }
        res.render('search', {links : linkArray,  title: 'Search Results' });

    }


}


