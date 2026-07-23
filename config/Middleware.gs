/**
 * Middleware.gs — pipeline chạy cho MỌI action gọi qua Api.gs:
 * resolve route → validate session → check permission → rate-limit → sanitize input
 * → gọi Controller → ghi log → trả về response envelope chuẩn {success, data|error}.
 */

var Middleware = (function () {

  function actorIdOf_(sessionData) {
    return sessionData ? sessionData.userId : 'anonymous';
  }

  return {

    handle: function (actionName, params, sessionToken) {
      try {
        var routeDef = Route.resolveAction(actionName);
        if (!routeDef) {
          throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Action không tồn tại: ' + actionName);
        }

        var sessionData = null;
        if (!routeDef.public) {
          sessionData = AppSession.validate(sessionToken);
          if (!sessionData) {
            throw new AppError(Constant.ERROR_CODE.AUTH_SESSION_EXPIRED, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
          }
          if (routeDef.permission && sessionData.permissions.indexOf(routeDef.permission) === -1) {
            throw new AppError(Constant.ERROR_CODE.PERMISSION_DENIED, 'Bạn không có quyền thực hiện thao tác này.');
          }
        }

        Security.checkRateLimit(actorIdOf_(sessionData) + ':' + actionName, Config.getApiRateLimitPerMinute(), 60);

        var safeParams = Security.sanitizeInput(params) || {};
        var context = { session: sessionData, actionName: actionName, sessionToken: sessionToken };
        var data = routeDef.controller[routeDef.method](safeParams, context);

        AppLogger.write(actorIdOf_(sessionData), actionName, routeDef.module, safeParams, true);

        return { success: true, data: data };

      } catch (err) {
        var code = err.code || Constant.ERROR_CODE.SERVER_ERROR;
        var message = err.message || 'Đã xảy ra lỗi hệ thống, vui lòng thử lại.';
        AppLogger.writeError(actionName, code, message);
        return { success: false, error: { code: code, message: message } };
      }
    }

  };

})();
