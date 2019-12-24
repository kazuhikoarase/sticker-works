'use strict';

var http = require('http');
var fs = require('fs');

var port = 8080;

var mimeTypes = {
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.map': 'application/octet-stream',
  '.woff': 'application/octet-stream'
};

var getHeaders = function(contentType) {
  return {
    'Content-Type': contentType,
    // disable cache
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

var requestListener = (req, res) => {
  var url = req.url;
  if (url.match(/^.*\/$/) ) {
    url += 'index.html';
  }
  var path = url.replace(/^([A-Za-z0-9_\-\.\$\/]+)(.*)$/, '$1');
  var contentType = mimeTypes[path.replace(/^.+(\.\w+)$/, '$1')];
  if (contentType) {
    res.writeHead(200, getHeaders(contentType) );
    res.end(fs.readFileSync(__dirname + '/docs' + path, 'UTF-8') );
  } else {
    res.writeHead(404, getHeaders('text/html') );
    res.end('<h1>Not Found</h1>');
  }
};

var server = http.createServer(requestListener);
server.listen(port);
console.log('server started at port ' + port);
