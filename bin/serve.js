var argv = require('optimist').argv;
var nstatic = require('node-static');
var path = require('path');
var sys = require('sys');

var staticdir = path.resolve(process.cwd(), argv._);

var file = new nstatic.Server(staticdir);

sys.puts("Serving static files under " + staticdir);


require('http').createServer(function(request, response) {
    request.addListener('end', function() {
        file.serve(request, response, function(err, res) {
            if(err) {
                if(request.url.indexOf("favicon.ico") === -1) {
                    sys.error("> Error serving " + request.url + " - " + err.message);
                }
                response.writeHead(err.status, err.headers);
                response.end();
            } else {
                sys.puts("> " + request.url + " - " + res.message);
            }
        });
    });
}).listen(5002, '0.0.0.0');

sys.puts("Server listening on 5002.");
