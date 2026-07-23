/**
 * NotificationModel.gs — stub, giai đoạn mở rộng (ngoài phạm vi MVP đã chốt ở Giai đoạn 1).
 * Giữ đúng interface dự kiến để không phá vỡ cấu trúc khi lấp đầy sau này.
 */

var NotificationModel = (function () {

  function notImplemented_() {
    throw new AppError(Constant.ERROR_CODE.NOT_IMPLEMENTED, 'Notification chưa được triển khai ở giai đoạn MVP.');
  }

  return {
    listByRecipient: notImplemented_,
    create: notImplemented_,
    markAsRead: notImplemented_
  };

})();
