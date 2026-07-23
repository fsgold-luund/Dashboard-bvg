/**
 * EmployeeController.gs — điều phối CRUD Employee, kèm tạo tài khoản đăng nhập khi cần.
 */

var EmployeeController = (function () {

  function toEmployeeDto_(employee) {
    return {
      employeeId: employee.EmployeeID,
      employeeCode: employee.EmployeeCode,
      fullName: employee.FullName,
      avatar: employee.Avatar,
      phone: employee.Phone,
      companyId: employee.CompanyID,
      departmentId: employee.DepartmentID,
      teamId: employee.TeamID,
      position: employee.Position,
      joinDate: Helper.toIsoString(employee.JoinDate),
      status: employee.Status
    };
  }

  return {

    list: function (params) {
      var result = EmployeeModel.listPaged(params.filters || {}, params.page, params.pageSize, params.sortBy, params.sortDir);
      return {
        items: result.items.map(toEmployeeDto_),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize
      };
    },

    getById: function (params) {
      var employee = EmployeeModel.getById(params.employeeId);
      if (!employee) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy nhân viên.');
      return toEmployeeDto_(employee);
    },

    create: function (params) {
      // Single-tenant: nếu client không truyền companyId, tự lấy công ty duy nhất đang có.
      if (!params.companyId) {
        var company = CompanyModel.getInfo();
        if (company) params.companyId = company.CompanyID;
      }
      var employee = EmployeeModel.create(params);

      // Tạo kèm tài khoản đăng nhập nếu có email — nhân viên tự đặt mật khẩu qua OTP gửi email.
      if (params.email) {
        if (!params.roleId) {
          throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Vai trò (roleId) là bắt buộc khi tạo tài khoản đăng nhập.');
        }
        var tempPassword = Utilities.getUuid().slice(0, 8);
        var user = UserModel.createUser(params.email, tempPassword, params.roleId, employee.EmployeeID);
        var otp = UserModel.setOtp(user.UserID);
        MailApp.sendEmail({
          to: params.email,
          subject: 'Tài khoản của bạn đã được tạo',
          htmlBody: 'Email đăng nhập: ' + params.email + '<br>Mã xác thực để đặt mật khẩu: <b>' + otp +
            '</b> (hiệu lực ' + Config.getOtpExpiryMinutes() + ' phút). Vào mục "Quên mật khẩu" trên trang đăng nhập để đặt mật khẩu mới.',
          name: Config.getMailSenderName()
        });
      }

      return toEmployeeDto_(employee);
    },

    update: function (params) {
      var updated = EmployeeModel.update(params.employeeId, params);
      return toEmployeeDto_(updated);
    },

    delete: function (params) {
      EmployeeModel.softDelete(params.employeeId);
      return {};
    }

  };

})();
