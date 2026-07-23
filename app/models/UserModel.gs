/**
 * UserModel.gs — tài khoản đăng nhập: mật khẩu (băm + salt), khoá tài khoản sau nhiều lần
 * đăng nhập sai, OTP quên mật khẩu, remember-login token dài hạn.
 */

var UserModel = (function () {

  var SHEET = Constant.SHEET_NAME.USER;

  function hashPassword_(password, salt) {
    var digestBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + ':' + salt);
    return digestBytes.map(function (b) {
      return ('0' + ((b + 256) % 256).toString(16)).slice(-2);
    }).join('');
  }

  function generateOtp_() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  return {

    findByEmail: function (email) {
      return DatabaseModel.find(SHEET, function (u) {
        return u.Email === email && u.Status !== Constant.ENTITY_STATUS.DELETED;
      })[0] || null;
    },

    getById: function (userId) {
      return DatabaseModel.getById(SHEET, userId);
    },

    createUser: function (email, password, roleId, employeeId) {
      if (this.findByEmail(email)) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Email đã được sử dụng.');
      }
      var salt = Utilities.getUuid();
      return DatabaseModel.insert(SHEET, {
        Email: email,
        PasswordHash: hashPassword_(password, salt),
        Salt: salt,
        RoleID: roleId,
        EmployeeID: employeeId || '',
        Status: Constant.ENTITY_STATUS.ACTIVE,
        FailedLoginCount: 0
      });
    },

    // Xác thực email/mật khẩu. Ném AppError phù hợp nếu sai hoặc tài khoản đang bị khoá.
    verifyCredential: function (email, password) {
      var user = this.findByEmail(email);
      if (!user) {
        throw new AppError(Constant.ERROR_CODE.AUTH_INVALID_CREDENTIAL, 'Email hoặc mật khẩu không đúng.');
      }

      if (user.Status === Constant.ENTITY_STATUS.LOCKED) {
        var elapsedMs = Date.now() - new Date(user.UpdatedAt).getTime();
        var lockMs = Config.getAccountLockMinutes() * 60000;
        if (elapsedMs < lockMs) {
          var remainMinutes = Math.ceil((lockMs - elapsedMs) / 60000);
          throw new AppError(Constant.ERROR_CODE.AUTH_ACCOUNT_LOCKED,
            'Tài khoản tạm khoá do đăng nhập sai nhiều lần. Thử lại sau ' + remainMinutes + ' phút.');
        }
        // Hết thời gian khoá — tự mở lại và cho thử tiếp.
        user = DatabaseModel.update(SHEET, user.UserID, { Status: Constant.ENTITY_STATUS.ACTIVE, FailedLoginCount: 0 });
      }

      var hash = hashPassword_(password, user.Salt);
      if (hash !== user.PasswordHash) {
        this.incrementFailedLogin(user.UserID);
        throw new AppError(Constant.ERROR_CODE.AUTH_INVALID_CREDENTIAL, 'Email hoặc mật khẩu không đúng.');
      }

      return DatabaseModel.update(SHEET, user.UserID, { FailedLoginCount: 0, LastLoginAt: new Date() });
    },

    incrementFailedLogin: function (userId) {
      var user = DatabaseModel.getById(SHEET, userId);
      if (!user) return;
      var count = Number(user.FailedLoginCount || 0) + 1;
      var patch = { FailedLoginCount: count };
      if (count >= Config.getMaxFailedLoginAttempts()) {
        patch.Status = Constant.ENTITY_STATUS.LOCKED;
      }
      DatabaseModel.update(SHEET, userId, patch);
    },

    updatePassword: function (userId, newPassword) {
      var salt = Utilities.getUuid();
      return DatabaseModel.update(SHEET, userId, {
        PasswordHash: hashPassword_(newPassword, salt),
        Salt: salt,
        OTPCode: '',
        OTPExpiry: ''
      });
    },

    setRememberToken: function (userId) {
      var token = Utilities.getUuid();
      var expiry = new Date(Date.now() + Config.getRememberTokenDays() * 24 * 60 * 60 * 1000);
      DatabaseModel.update(SHEET, userId, { RememberToken: token, RememberTokenExpiry: expiry });
      return token;
    },

    validateRememberToken: function (token) {
      if (!token) return null;
      var user = DatabaseModel.find(SHEET, function (u) { return u.RememberToken === token; })[0];
      if (!user) return null;
      if (!user.RememberTokenExpiry || new Date(user.RememberTokenExpiry).getTime() < Date.now()) {
        return null;
      }
      return user;
    },

    clearRememberToken: function (userId) {
      DatabaseModel.update(SHEET, userId, { RememberToken: '', RememberTokenExpiry: '' });
    },

    setOtp: function (userId) {
      var otp = generateOtp_();
      var expiry = new Date(Date.now() + Config.getOtpExpiryMinutes() * 60000);
      DatabaseModel.update(SHEET, userId, { OTPCode: otp, OTPExpiry: expiry });
      return otp;
    },

    verifyOtp: function (userId, otp) {
      var user = DatabaseModel.getById(SHEET, userId);
      if (!user || !user.OTPCode || user.OTPCode !== otp) return false;
      if (!user.OTPExpiry || new Date(user.OTPExpiry).getTime() < Date.now()) return false;
      return true;
    },

    clearOtp: function (userId) {
      DatabaseModel.update(SHEET, userId, { OTPCode: '', OTPExpiry: '' });
    }

  };

})();
