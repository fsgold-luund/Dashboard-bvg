/**
 * Webhook.gs — cổng vào Data-In cho hệ thống bên ngoài qua doPost (xem app/Main.gs), tách biệt
 * với Api.gs vì không có sessionToken người dùng để xác thực. Thay vào đó xác thực bằng
 * WEBHOOK_SECRET (Script Property) và CHỈ cho phép action nằm trong ALLOWED_ACTIONS — nếu không,
 * đây sẽ thành cửa hậu gọi được bất kỳ Controller nào mà bỏ qua toàn bộ kiểm tra quyền của Middleware.
 * Vẫn tái dùng đúng Controller/Route như luồng nội bộ để không lặp lại logic validate/ghi dữ liệu.
 */

var Webhook = (function () {

  var ALLOWED_ACTIONS = [
    Constant.ACTION_NAME.TASK_CREATE,
    Constant.ACTION_NAME.TASK_UPDATE_STATUS,
    Constant.ACTION_NAME.EMPLOYEE_CREATE
  ];

  // Actor hệ thống dùng cho các action vốn được viết để chạy sau Middleware (kỳ vọng context.session
  // tồn tại). roleLevel 0 thấp hơn mọi ROLE_LEVEL thật nên các so sánh "cấp bậc" trong Controller
  // (vd. giới hạn Leader chỉ giao việc trong team) tự động không áp dụng cho webhook.
  var SYSTEM_CONTEXT = Object.freeze({
    session: { userId: 'webhook', employeeId: null, roleLevel: 0, permissions: [] },
    sessionToken: null
  });

  function isAuthorized_(secret) {
    return !!secret && secret === Config.getWebhookSecret();
  }

  return {

    // body: chuỗi JSON dạng { secret, action, data }.
    handle: function (body) {
      var payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch (e) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Payload không phải JSON hợp lệ.');
      }

      if (!isAuthorized_(payload.secret)) {
        throw new AppError(Constant.ERROR_CODE.PERMISSION_DENIED, 'Webhook secret không hợp lệ.');
      }
      if (ALLOWED_ACTIONS.indexOf(payload.action) === -1) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Action không được phép qua webhook: ' + payload.action);
      }

      var routeDef = Route.resolveAction(payload.action);
      Security.checkRateLimit('webhook:' + payload.action, Config.getApiRateLimitPerMinute(), 60);

      var safeParams = Security.sanitizeInput(payload.data) || {};
      var context = Object.assign({ actionName: payload.action }, SYSTEM_CONTEXT);
      var result = routeDef.controller[routeDef.method](safeParams, context);

      AppLogger.write('webhook', payload.action, routeDef.module, safeParams, true);
      return result;
    }

  };

})();
