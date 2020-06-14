// simple http server for static contents.

'use strict';

var http = require('http');
var fs = require('fs');

var config = {
  port: 8080,
  baseDir: '/docs'
};

var mimeTypes = {
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml'
};
var defaultContentType = 'application/octet-stream';

var buildHeaders = function(contentType) {
  return {
    'Content-Type': contentType,
    // disable cache
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
};

var server = http.createServer(function(req, res) {
  var url = req.url;
  if (url.match(/^.*\/$/) ) {
    url += 'index.html';
  }
  var path = decodeURIComponent(url.replace(/^([^\;\?]+)(.*)$/, '$1') );
  var filePath = __dirname + config.baseDir + path;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile() ) {
    var contentType = mimeTypes[path.replace(/^.+(\.\w+)$/, '$1')] ||
      defaultContentType;
    res.writeHead(200, buildHeaders(contentType) );
    res.end(fs.readFileSync(filePath) );
  } else {
    res.writeHead(404, buildHeaders('text/html') );
    res.end('<h1>Not Found</h1>');
  }
});
server.listen(config.port);
console.log('server started at port ' + config.port);
