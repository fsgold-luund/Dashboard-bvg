/**
 * Config.gs — nguồn cấu hình duy nhất của hệ thống.
 * Mọi giá trị có thể thay đổi theo môi trường (không phải enum cố định — xem Constant.gs)
 * phải đọc qua đây, lấy từ Script Properties. Không hard-code ở Controller/Model/View.
 */

var Config = (function () {

  var DEFAULTS = {
    SESSION_TIMEOUT_MINUTES: 60,
    REMEMBER_TOKEN_DAYS: 30,
    OTP_EXPIRY_MINUTES: 10,
    OTP_MAX_PER_HOUR: 3,
    MAX_FAILED_LOGIN_ATTEMPTS: 5,
    ACCOUNT_LOCK_MINUTES: 15,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DASHBOARD_CACHE_TTL_SECONDS: 60,
    LOOKUP_CACHE_TTL_SECONDS: 21600,
    API_RATE_LIMIT_PER_MINUTE: 60,
    MAIL_SENDER_NAME: 'Hệ thống quản trị công việc',
    DEBUG: false
  };

  function getProperties_() {
    return PropertiesService.getScriptProperties();
  }

  function getString_(key, defaultValue) {
    var value = getProperties_().getProperty(key);
    return (value === null || value === undefined || value === '') ? defaultValue : value;
  }

  function getNumber_(key, defaultValue) {
    var value = getProperties_().getProperty(key);
    if (value === null || value === undefined || value === '') return defaultValue;
    var parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  function getBoolean_(key, defaultValue) {
    var value = getProperties_().getProperty(key);
    if (value === null || value === undefined || value === '') return defaultValue;
    return String(value).toLowerCase() === 'true';
  }

  function getRequiredString_(key) {
    var value = getProperties_().getProperty(key);
    if (value === null || value === undefined || value === '') {
      throw new Error('Thiếu cấu hình bắt buộc "' + key + '" trong Script Properties.');
    }
    return value;
  }

  return {

    getSpreadsheetId: function () {
      return getRequiredString_('SPREADSHEET_ID');
    },

    getAppUrl: function () {
      return getString_('APP_URL', ScriptApp.getService().getUrl());
    },

    getAttachmentFolderId: function () {
      return getRequiredString_('ATTACHMENT_FOLDER_ID');
    },

    getAppSecret: function () {
      return getRequiredString_('APP_SECRET');
    },

    getSessionTimeoutMinutes: function () {
      return getNumber_('SESSION_TIMEOUT_MINUTES', DEFAULTS.SESSION_TIMEOUT_MINUTES);
    },

    getRememberTokenDays: function () {
      return getNumber_('REMEMBER_TOKEN_DAYS', DEFAULTS.REMEMBER_TOKEN_DAYS);
    },

    getOtpExpiryMinutes: function () {
      return getNumber_('OTP_EXPIRY_MINUTES', DEFAULTS.OTP_EXPIRY_MINUTES);
    },

    getOtpMaxPerHour: function () {
      return getNumber_('OTP_MAX_PER_HOUR', DEFAULTS.OTP_MAX_PER_HOUR);
    },

    getMaxFailedLoginAttempts: function () {
      return getNumber_('MAX_FAILED_LOGIN_ATTEMPTS', DEFAULTS.MAX_FAILED_LOGIN_ATTEMPTS);
    },

    getAccountLockMinutes: function () {
      return getNumber_('ACCOUNT_LOCK_MINUTES', DEFAULTS.ACCOUNT_LOCK_MINUTES);
    },

    getDefaultPageSize: function () {
      return getNumber_('DEFAULT_PAGE_SIZE', DEFAULTS.DEFAULT_PAGE_SIZE);
    },

    getMaxPageSize: function () {
      return getNumber_('MAX_PAGE_SIZE', DEFAULTS.MAX_PAGE_SIZE);
    },

    getDashboardCacheTtlSeconds: function () {
      return getNumber_('DASHBOARD_CACHE_TTL_SECONDS', DEFAULTS.DASHBOARD_CACHE_TTL_SECONDS);
    },

    getLookupCacheTtlSeconds: function () {
      return getNumber_('LOOKUP_CACHE_TTL_SECONDS', DEFAULTS.LOOKUP_CACHE_TTL_SECONDS);
    },

    getApiRateLimitPerMinute: function () {
      return getNumber_('API_RATE_LIMIT_PER_MINUTE', DEFAULTS.API_RATE_LIMIT_PER_MINUTE);
    },

    getMailSenderName: function () {
      return getString_('MAIL_SENDER_NAME', DEFAULTS.MAIL_SENDER_NAME);
    },

    isDebug: function () {
      return getBoolean_('DEBUG', DEFAULTS.DEBUG);
    }

  };

})();
