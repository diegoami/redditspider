
/**
 * Module dependencies.
 */

var express =   require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , search= require('./routes/search')

    , http = require('http')
  , path = require('path')
  ,expressValidator = require('express-validator')

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(expressValidator);

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


app.get('/', routes.index);
app.get('/users', user.list);
app.use('/search', search.search);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
