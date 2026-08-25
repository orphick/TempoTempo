from rest_framework.throttling import SimpleRateThrottle


class ScopedUserRateThrottle(SimpleRateThrottle):
    scope = 'login'

    def allow_request(self, request, view):
        self.scope = getattr(view, 'throttle_scope', None)
        if not self.scope:
            return True
        return super().allow_request(request, view)

    def get_cache_key(self, request, view):
        if not self.scope:
            return None
        ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}
