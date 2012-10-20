var request = require('request');
var cheerio = require('cheerio');
var url = require('url');

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
    exports.login(users, password, function(err, resp, body){
        request('http://www.reddit.com'+urlParam, function(err, resp, body){
            $ = cheerio.load(body);
            var links = $('a.title'); //use your CSS selector here
            var linkArray = [];
            $(links).each(function(i, link){
                var parsedLink = url.parse($(link).attr('href'));
                var linkToPass = parsedLink.host ? $(link).attr('href') : "http://www.reddit.com"+$(link).attr('href');
                linkArray.push({href:linkToPass, text:  $(link).text()})
            });
            res.render('search', {links : linkArray,  title: 'Search Results' });
        });
    });
};


