/**
 * Logger.gs — ghi log chuẩn hoá vào sheet Log.
 * Đặt tên "AppLogger" (không phải "Logger") để không đè lên global Logger.log() có sẵn của Apps Script.
 * Ngoại lệ có chủ đích: ghi thẳng qua DatabaseModel thay vì qua LogModel, vì đây là
 * hạ tầng cross-cutting (Middleware gọi cho MỌI action) — LogModel chỉ phục vụ chiều đọc (Admin xem log).
 */

var AppLogger = (function () {

  function safeInsert_(record) {
    try {
      DatabaseModel.insert(Constant.SHEET_NAME.LOG, record);
    } catch (e) {
      // Không được để lỗi ghi log làm vỡ luồng chính — chỉ log ra Stackdriver.
      Logger.log('AppLogger lỗi khi ghi Log sheet: ' + e.message);
    }
  }

  return {

    write: function (actorId, actionName, module, params, success) {
      safeInsert_({
        ActorID: actorId || 'anonymous',
        Action: actionName,
        Module: module || '',
        EntityID: (params && (params.taskId || params.employeeId || params.teamId || params.departmentId)) || '',
        Detail: JSON.stringify({ success: !!success, params: params || {} }),
        Timestamp: new Date()
      });
    },

    writeError: function (actionName, code, message) {
      safeInsert_({
        ActorID: 'system',
        Action: actionName,
        Module: 'Error',
        EntityID: code,
        Detail: message,
        Timestamp: new Date()
      });
    }

  };

})();
