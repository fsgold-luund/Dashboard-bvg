/**
 * Helper.gs — hàm tiện ích dùng chung phía server + lớp lỗi nghiệp vụ AppError.
 * Không chứa business logic riêng của module nào.
 */

function AppError(code, message) {
  this.name = 'AppError';
  this.code = code;
  this.message = message;
}
AppError.prototype = Object.create(Error.prototype);
AppError.prototype.constructor = AppError;

var Helper = (function () {

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
  }

  function groupBy(list, keyFn) {
    var result = {};
    (list || []).forEach(function (item) {
      var key = keyFn(item);
      if (!result[key]) result[key] = [];
      result[key].push(item);
    });
    return result;
  }

  function pick(obj, keys) {
    var result = {};
    keys.forEach(function (key) {
      if (obj && obj.hasOwnProperty(key)) result[key] = obj[key];
    });
    return result;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Dịch object camelCase (payload từ client) sang object PascalCase (tên cột Sheet),
  // chỉ đưa vào những field thực sự có mặt trong data (phục vụ update từng phần - PATCH semantics).
  function mapFields(data, mapping) {
    var result = {};
    Object.keys(mapping).forEach(function (key) {
      if (data[key] !== undefined) result[mapping[key]] = data[key];
    });
    return result;
  }

  return {

    formatDate: function (date, pattern) {
      if (!date) return '';
      return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), pattern || 'yyyy-MM-dd');
    },

    toIsoString: function (date) {
      if (!date) return null;
      var d = new Date(date);
      return isNaN(d.getTime()) ? null : d.toISOString();
    },

    isValidEmail: isValidEmail,
    groupBy: groupBy,
    pick: pick,
    clamp: clamp,
    mapFields: mapFields,

    daysBetween: function (dateA, dateB) {
      var msPerDay = 24 * 60 * 60 * 1000;
      return Math.round((new Date(dateB) - new Date(dateA)) / msPerDay);
    }

  };

})();
