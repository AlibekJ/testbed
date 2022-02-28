import http.server
import socketserver

PORT = 8083

class HttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
       '': 'application/json',
        '.html': 'text/html',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.svg':	'image/svg+xml',
        '.css':	'text/css',
        '.js':'application/x-javascript',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.mjs': 'application/javascript',
    }

httpd = socketserver.TCPServer(("localhost", PORT), HttpRequestHandler)

try:
    print(f"serving at http://localhost:{PORT}")
    httpd.serve_forever()
except KeyboardInterrupt:
    print('^C received, shutting down server')
    httpd.socket.close()
    httpd.shutdown()
    httpd.server_close()
    pass
finally:
    httpd.socket.close()
    httpd.shutdown()
    httpd.server_close()
