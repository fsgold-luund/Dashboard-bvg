/**
 * DatabaseModel.gs — lớp CRUD gốc, điểm chạm SpreadsheetApp DUY NHẤT của toàn hệ thống.
 * Mọi Model khác (TaskModel, EmployeeModel...) bắt buộc đi qua các hàm ở đây,
 * không tự gọi SpreadsheetApp/Sheet trực tiếp.
 */

var DatabaseModel = (function () {

  var PREFIX_MAP = {
    Company: 'CTY', Department: 'DEP', Team: 'TEA', Role: 'ROL', Permission: 'PER',
    RolePermission: 'RPM', User: 'USR', Employee: 'EMP', Task: 'TSK', TaskHistory: 'THI',
    DailyReport: 'DRP', WeeklyReport: 'WRP', MonthlyReport: 'MRP', YearlyReport: 'YRP',
    Notification: 'NOT', Log: 'LOG'
  };

  var cachedSpreadsheet_ = null;
  var headerMemo_ = {};

  function getSpreadsheet_() {
    if (!cachedSpreadsheet_) {
      cachedSpreadsheet_ = SpreadsheetApp.openById(Config.getSpreadsheetId());
    }
    return cachedSpreadsheet_;
  }

  function getSheet_(sheetName) {
    var sheet = getSpreadsheet_().getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Sheet "' + sheetName + '" chưa tồn tại. Chạy Database.ensureSheetsExist() trước.');
    }
    return sheet;
  }

  function getHeader_(sheet, sheetName) {
    if (!headerMemo_[sheetName]) {
      var lastCol = sheet.getLastColumn() || Database.getColumns(sheetName).length;
      headerMemo_[sheetName] = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    }
    return headerMemo_[sheetName];
  }

  function rowToObject_(header, rowValues) {
    var obj = {};
    header.forEach(function (col, i) {
      obj[col] = rowValues[i];
    });
    return obj;
  }

  function objectToRow_(header, obj) {
    return header.map(function (col) {
      var value = obj[col];
      return (value === undefined || value === null) ? '' : value;
    });
  }

  function generateId_(sheetName) {
    var prefix = PREFIX_MAP[sheetName] || sheetName.substring(0, 3).toUpperCase();
    return prefix + '-' + Utilities.getUuid().substring(0, 8);
  }

  function idIndexCacheKey_(sheetName) {
    return 'dbidx_' + sheetName;
  }

  function buildIdIndex_(sheet, sheetName) {
    var pk = Database.getPrimaryKey(sheetName);
    var header = getHeader_(sheet, sheetName);
    var pkCol = header.indexOf(pk);
    var lastRow = sheet.getLastRow();
    var index = {};
    if (lastRow > 1 && pkCol > -1) {
      var ids = sheet.getRange(2, pkCol + 1, lastRow - 1, 1).getValues();
      ids.forEach(function (row, i) {
        if (row[0]) index[row[0]] = i + 2;
      });
    }
    return index;
  }

  function getIdIndex_(sheet, sheetName) {
    var cache = CacheService.getScriptCache();
    var key = idIndexCacheKey_(sheetName);
    var cached = cache.get(key);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* cache hỏng, build lại */ }
    }
    var index = buildIdIndex_(sheet, sheetName);
    try {
      cache.put(key, JSON.stringify(index), Config.getLookupCacheTtlSeconds());
    } catch (e) {
      // Vượt giới hạn dung lượng CacheService (~100KB) — bỏ qua cache, các lần sau tự quét lại.
    }
    return index;
  }

  function invalidateIdIndex_(sheetName) {
    CacheService.getScriptCache().remove(idIndexCacheKey_(sheetName));
  }

  function findRowNumberById_(sheet, sheetName, id) {
    var index = getIdIndex_(sheet, sheetName);
    var rowNum = index[id];
    if (rowNum) return rowNum;
    // Cache có thể lệch (vd. vừa insert ở request khác) — quét lại 1 lần cho chắc.
    var freshIndex = buildIdIndex_(sheet, sheetName);
    return freshIndex[id] || null;
  }

  function withLock_(fn) {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      return fn();
    } finally {
      lock.releaseLock();
    }
  }

  function compareValues_(a, b) {
    if (a instanceof Date || b instanceof Date) {
      return new Date(a).getTime() - new Date(b).getTime();
    }
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  }

  return {

    getAll: function (sheetName) {
      var sheet = getSheet_(sheetName);
      var header = getHeader_(sheet, sheetName);
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return [];
      var values = sheet.getRange(2, 1, lastRow - 1, header.length).getValues();
      var pk = Database.getPrimaryKey(sheetName);
      var pkCol = header.indexOf(pk);
      return values
        .filter(function (row) { return row[pkCol]; })
        .map(function (row) { return rowToObject_(header, row); });
    },

    getById: function (sheetName, id) {
      if (!id) return null;
      var sheet = getSheet_(sheetName);
      var rowNum = findRowNumberById_(sheet, sheetName, id);
      if (!rowNum) return null;
      var header = getHeader_(sheet, sheetName);
      var values = sheet.getRange(rowNum, 1, 1, header.length).getValues()[0];
      return rowToObject_(header, values);
    },

    find: function (sheetName, filterFn) {
      var all = this.getAll(sheetName);
      return filterFn ? all.filter(filterFn) : all;
    },

    count: function (sheetName, filterFn) {
      return this.find(sheetName, filterFn).length;
    },

    paginate: function (sheetName, filterFn, options) {
      options = options || {};
      var page = Math.max(1, options.page || 1);
      var pageSize = Math.min(options.pageSize || Config.getDefaultPageSize(), Config.getMaxPageSize());
      var items = this.find(sheetName, filterFn);

      if (options.sortBy) {
        var sortBy = options.sortBy;
        var dir = options.sortDir === 'desc' ? -1 : 1;
        items = items.slice().sort(function (a, b) {
          return compareValues_(a[sortBy], b[sortBy]) * dir;
        });
      }

      var total = items.length;
      var start = (page - 1) * pageSize;
      return {
        items: items.slice(start, start + pageSize),
        total: total,
        page: page,
        pageSize: pageSize
      };
    },

    insert: function (sheetName, dataObject) {
      var self = this;
      return withLock_(function () {
        var sheet = getSheet_(sheetName);
        var header = getHeader_(sheet, sheetName);
        var pk = Database.getPrimaryKey(sheetName);

        var record = Object.assign({}, dataObject);
        if (!record[pk]) record[pk] = generateId_(sheetName);

        var now = new Date();
        if (header.indexOf('CreatedAt') > -1) record.CreatedAt = now;
        if (header.indexOf('UpdatedAt') > -1) record.UpdatedAt = now;

        sheet.appendRow(objectToRow_(header, record));
        invalidateIdIndex_(sheetName);
        return record;
      });
    },

    update: function (sheetName, id, patch) {
      var self = this;
      return withLock_(function () {
        var sheet = getSheet_(sheetName);
        var header = getHeader_(sheet, sheetName);
        var pk = Database.getPrimaryKey(sheetName);
        var rowNum = findRowNumberById_(sheet, sheetName, id);
        if (!rowNum) return null;

        var existingValues = sheet.getRange(rowNum, 1, 1, header.length).getValues()[0];
        var existing = rowToObject_(header, existingValues);

        var merged = Object.assign({}, existing, patch);
        merged[pk] = existing[pk];
        if (header.indexOf('CreatedAt') > -1) merged.CreatedAt = existing.CreatedAt;
        if (header.indexOf('UpdatedAt') > -1) merged.UpdatedAt = new Date();

        sheet.getRange(rowNum, 1, 1, header.length).setValues([objectToRow_(header, merged)]);
        return merged;
      });
    },

    softDelete: function (sheetName, id) {
      var sheet = getSheet_(sheetName);
      var header = getHeader_(sheet, sheetName);
      if (header.indexOf('Status') === -1) {
        throw new Error('Sheet "' + sheetName + '" không có cột Status, không hỗ trợ softDelete.');
      }
      return this.update(sheetName, id, { Status: Constant.ENTITY_STATUS.DELETED });
    },

    invalidateCache: function (sheetName) {
      invalidateIdIndex_(sheetName);
      delete headerMemo_[sheetName];
    }

  };

})();
