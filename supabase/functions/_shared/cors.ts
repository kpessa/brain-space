export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// CalDAV specific CORS headers
export const caldavCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, depth, if-match, if-none-match, if-modified-since, prefer, destination, overwrite, x-caldav-authorization',
  'Access-Control-Allow-Methods':
    'GET, POST, PUT, DELETE, OPTIONS, PROPFIND, PROPPATCH, REPORT, MKCALENDAR, MKCOL, MOVE, COPY',
  'Access-Control-Expose-Headers': 'content-type, etag, last-modified, dav, location',
  'Access-Control-Max-Age': '86400', // 24 hours
}
