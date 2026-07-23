/**
 * AuthController.gs — Login/Logout/Session/quên mật khẩu qua OTP email.
 */

var AuthController = (function () {

  function buildSessionPayload_(user) {
    var role = RoleModel.getById(user.RoleID);
    if (!role) throw new AppError(Constant.ERROR_CODE.SERVER_ERROR, 'Tài khoản không có Role hợp lệ.');
    var employee = user.EmployeeID ? EmployeeModel.getById(user.EmployeeID) : null;

    return {
      userId: user.UserID,
      email: user.Email,
      employeeId: user.EmployeeID || '',
      fullName: employee ? employee.FullName : user.Email,
      roleId: role.RoleID,
      roleName: role.RoleName,
      roleLevel: Number(role.RoleLevel),
      permissions: RoleModel.getPermissionCodesByRoleId(role.RoleID)
    };
  }

  return {

    login: function (params) {
      if (!Helper.isValidEmail(params.email) || !params.password) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Vui lòng nhập email và mật khẩu.');
      }

      var user = UserModel.verifyCredential(params.email, params.password);
      var sessionPayload = buildSessionPayload_(user);
      var sessionToken = AppSession.create(sessionPayload);

      var rememberToken = null;
      if (params.rememberMe) {
        rememberToken = UserModel.setRememberToken(user.UserID);
      }

      return {
        sessionToken: sessionToken,
        rememberToken: rememberToken,
        user: Helper.pick(sessionPayload, ['userId', 'email', 'employeeId', 'fullName']),
        role: Helper.pick(sessionPayload, ['roleId', 'roleName', 'roleLevel']),
        permissions: sessionPayload.permissions
      };
    },

    logout: function (params, context) {
      AppSession.destroy(context.sessionToken);
      return {};
    },

    forgotPassword: function (params) {
      if (!Helper.isValidEmail(params.email)) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Email không hợp lệ.');
      }

      var user = UserModel.findByEmail(params.email);
      if (user) {
        Security.checkRateLimit('otp:' + user.UserID, Config.getOtpMaxPerHour(), 3600);
        var otp = UserModel.setOtp(user.UserID);
        MailApp.sendEmail({
          to: user.Email,
          subject: 'Mã xác thực đặt lại mật khẩu',
          htmlBody: 'Mã xác thực (OTP) của bạn là <b>' + otp + '</b>, có hiệu lực trong ' +
            Config.getOtpExpiryMinutes() + ' phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.',
          name: Config.getMailSenderName()
        });
      }

      // Trả về response giống nhau dù email có tồn tại hay không, tránh lộ thông tin tài khoản.
      return { otpSent: true, expiresInSeconds: Config.getOtpExpiryMinutes() * 60 };
    },

    verifyOtpAndReset: function (params) {
      if (!Helper.isValidEmail(params.email) || !params.otp) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Thiếu thông tin xác thực.');
      }
      if (!params.newPassword || params.newPassword.length < 6) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      }

      var user = UserModel.findByEmail(params.email);
      if (!user || !UserModel.verifyOtp(user.UserID, params.otp)) {
        throw new AppError(Constant.ERROR_CODE.AUTH_OTP_INVALID, 'Mã OTP không đúng hoặc đã hết hạn.');
      }

      UserModel.updatePassword(user.UserID, params.newPassword);
      return {};
    },

    getSession: function (params, context) {
      return AppSession.validate(context.sessionToken);
    }

  };

})();
