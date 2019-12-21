'use strict';

var http = require('http');
var fs = require('fs');

var mimeTypes = {
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml'
};

var requestListener = (req,res) => {
  var url = req.url;
  if (url.match(/^.*\/$/) ) {
    url += 'index.html';
  }
  var contentType = mimeTypes[url.replace(/^.+(\.\w+)$/, '$1')];
  if (contentType) {
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(__dirname + '/docs' + url, 'UTF-8') );
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>Not Found</h1>');
  }
};

var port = 8080;
var server = http.createServer(requestListener);
server.listen(port);
console.log('server started at port ' + port);
