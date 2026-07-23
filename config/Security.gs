/**
 * Security.gs — sanitize input, escape HTML, action-token, rate-limit.
 */

var Security = (function () {

  function sanitizeValue_(value) {
    if (typeof value === 'string') {
      return value
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .trim();
    }
    if (Array.isArray(value)) return value.map(sanitizeValue_);
    if (value && typeof value === 'object') return sanitizeObject_(value);
    return value;
  }

  function sanitizeObject_(obj) {
    var result = {};
    Object.keys(obj).forEach(function (key) {
      result[key] = sanitizeValue_(obj[key]);
    });
    return result;
  }

  return {

    escapeHtml: function (str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    sanitizeInput: function (params) {
      if (!params || typeof params !== 'object') return params;
      return sanitizeObject_(params);
    },

    generateActionToken: function (sessionToken, actionName) {
      var raw = sessionToken + ':' + actionName;
      var signatureBytes = Utilities.computeHmacSha256Signature(raw, Config.getAppSecret());
      return Utilities.base64EncodeWebSafe(signatureBytes);
    },

    validateActionToken: function (token, sessionToken, actionName) {
      return token === this.generateActionToken(sessionToken, actionName);
    },

    // Ném AppError(RATE_LIMITED) nếu vượt quá maxCount lần trong windowSeconds.
    checkRateLimit: function (key, maxCount, windowSeconds) {
      var cache = CacheService.getScriptCache();
      var cacheKey = 'rl_' + key;
      var current = Number(cache.get(cacheKey) || 0);
      if (current >= maxCount) {
        throw new AppError(Constant.ERROR_CODE.RATE_LIMITED, 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.');
      }
      cache.put(cacheKey, String(current + 1), windowSeconds);
    }

  };

})();
