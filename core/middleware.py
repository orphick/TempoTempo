import logging
import uuid


logger = logging.getLogger('core.request')


class RequestIDMiddleware:
    """Attach a safe correlation id without logging request bodies or credentials."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = request.headers.get('X-Request-ID') or str(uuid.uuid4())
        response = self.get_response(request)
        response['X-Request-ID'] = request.request_id
        logger.info('request_completed', extra={
            'request_id': request.request_id, 'method': request.method,
            'path': request.path, 'status_code': response.status_code,
        })
        return response


class ContentSecurityPolicyMiddleware:
    """A restrictive default CSP for the SPA; configure only required API origins separately."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.setdefault('Content-Security-Policy', "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https: http://localhost:8000 http://127.0.0.1:8000")
        return response
