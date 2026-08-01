/**
 * EmployeeModel.gs — hồ sơ nhân sự.
 */

var EmployeeModel = (function () {

  var SHEET = Constant.SHEET_NAME.EMPLOYEE;

  var UPDATE_FIELD_MAP = {
    fullName: 'FullName', avatar: 'Avatar', phone: 'Phone', companyId: 'CompanyID',
    departmentId: 'DepartmentID', teamId: 'TeamID', position: 'Position',
    joinDate: 'JoinDate', status: 'Status'
  };

  function buildFilter_(filters) {
    filters = filters || {};
    return function (emp) {
      if (emp.Status === Constant.ENTITY_STATUS.DELETED) return false;
      if (filters.departmentId && emp.DepartmentID !== filters.departmentId) return false;
      if (filters.teamId && emp.TeamID !== filters.teamId) return false;
      if (filters.status && emp.Status !== filters.status) return false;
      if (filters.keyword) {
        var kw = filters.keyword.toLowerCase();
        var haystack = (emp.FullName + ' ' + emp.EmployeeCode).toLowerCase();
        if (haystack.indexOf(kw) === -1) return false;
      }
      return true;
    };
  }

  return {

    listPaged: function (filters, page, pageSize, sortBy, sortDir) {
      return DatabaseModel.paginate(SHEET, buildFilter_(filters), {
        page: page, pageSize: pageSize, sortBy: sortBy || 'FullName', sortDir: sortDir
      });
    },

    getById: function (employeeId) {
      var employee = DatabaseModel.getById(SHEET, employeeId);
      if (!employee || employee.Status === Constant.ENTITY_STATUS.DELETED) return null;
      return employee;
    },

    create: function (data) {
      if (!data.fullName) throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Họ tên là bắt buộc.');
      if (!data.companyId) throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Công ty là bắt buộc.');
      if (!data.departmentId) throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Phòng ban là bắt buộc.');

      return DatabaseModel.insert(SHEET, {
        EmployeeCode: data.employeeCode || ('NV' + Date.now().toString().slice(-6)),
        FullName: data.fullName,
        Avatar: data.avatar || '',
        Phone: data.phone || '',
        CompanyID: data.companyId,
        DepartmentID: data.departmentId,
        TeamID: data.teamId || '',
        Position: data.position || '',
        JoinDate: data.joinDate || new Date(),
        Status: Constant.ENTITY_STATUS.ACTIVE
      });
    },

    update: function (employeeId, data) {
      var mapped = Helper.mapFields(data, UPDATE_FIELD_MAP);
      var updated = DatabaseModel.update(SHEET, employeeId, mapped);
      if (!updated) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy nhân viên.');
      return updated;
    },

    softDelete: function (employeeId) {
      var result = DatabaseModel.softDelete(SHEET, employeeId);
      if (!result) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy nhân viên.');
      return result;
    }

  };

})();
