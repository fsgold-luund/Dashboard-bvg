/**
 * LogModel.gs — chiều đọc của sheet Log (phục vụ màn Admin xem log ở giai đoạn mở rộng).
 * Chiều ghi do AppLogger.gs đảm nhiệm trực tiếp (xem ghi chú trong config/Logger.gs).
 */

var LogModel = (function () {

  var SHEET = Constant.SHEET_NAME.LOG;

  function buildFilter_(filters) {
    filters = filters || {};
    return function (log) {
      if (filters.actorId && log.ActorID !== filters.actorId) return false;
      if (filters.module && log.Module !== filters.module) return false;
      if (filters.action && log.Action !== filters.action) return false;
      if (filters.dateFrom && new Date(log.Timestamp) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(log.Timestamp) > new Date(filters.dateTo)) return false;
      return true;
    };
  }

  return {

    listPaged: function (filters, page, pageSize) {
      return DatabaseModel.paginate(SHEET, buildFilter_(filters), {
        page: page, pageSize: pageSize, sortBy: 'Timestamp', sortDir: 'desc'
      });
    }

  };

})();
