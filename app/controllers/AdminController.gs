/**
 * AdminController.gs — stub, giai đoạn mở rộng (ngoài phạm vi MVP đã chốt ở Giai đoạn 1).
 * Sẽ đảm nhiệm: Import/Export Excel, xem Log, quản lý Permission nâng cao.
 */

var AdminController = (function () {

  function notImplemented_() {
    throw new AppError(Constant.ERROR_CODE.NOT_IMPLEMENTED, 'Chức năng quản trị nâng cao chưa được triển khai ở giai đoạn MVP.');
  }

  return {
    listLogs: notImplemented_,
    importExcel: notImplemented_,
    exportExcel: notImplemented_,
    managePermissions: notImplemented_
  };

})();
