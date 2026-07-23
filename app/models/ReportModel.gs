/**
 * ReportModel.gs — stub, giai đoạn mở rộng (ngoài phạm vi MVP đã chốt ở Giai đoạn 1).
 * Sẽ thao tác trên 4 sheet DailyReport/WeeklyReport/MonthlyReport/YearlyReport (cùng schema).
 * Giữ đúng interface dự kiến để không phá vỡ cấu trúc khi lấp đầy sau này.
 */

var ReportModel = (function () {

  function notImplemented_() {
    throw new AppError(Constant.ERROR_CODE.NOT_IMPLEMENTED, 'Report chưa được triển khai ở giai đoạn MVP.');
  }

  return {
    listPaged: notImplemented_,
    getById: notImplemented_,
    create: notImplemented_,
    approve: notImplemented_
  };

})();
