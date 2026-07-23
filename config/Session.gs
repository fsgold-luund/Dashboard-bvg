/**
 * Session.gs — quản lý phiên đăng nhập qua CacheService.
 * Đặt tên "AppSession" (không phải "Session") để không đè lên global Session có sẵn của Apps Script.
 */

var AppSession = (function () {

  var MAX_CACHE_SECONDS = 21600; // giới hạn cứng của CacheService (6 giờ)

  function cacheKey_(token) {
    return 'sess_' + token;
  }

  return {

    create: function (sessionData) {
      var token = Utilities.getUuid();
      var ttl = Helper.clamp(Config.getSessionTimeoutMinutes() * 60, 60, MAX_CACHE_SECONDS);
      CacheService.getScriptCache().put(cacheKey_(token), JSON.stringify(sessionData), ttl);
      return token;
    },

    validate: function (token) {
      if (!token) return null;
      var cache = CacheService.getScriptCache();
      var raw = cache.get(cacheKey_(token));
      if (!raw) return null;
      try {
        var data = JSON.parse(raw);
        var ttl = Helper.clamp(Config.getSessionTimeoutMinutes() * 60, 60, MAX_CACHE_SECONDS);
        cache.put(cacheKey_(token), raw, ttl); // sliding session: còn hoạt động thì gia hạn
        return data;
      } catch (e) {
        return null;
      }
    },

    destroy: function (token) {
      if (!token) return;
      CacheService.getScriptCache().remove(cacheKey_(token));
    }

  };

})();
