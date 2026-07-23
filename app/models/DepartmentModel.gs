/**
 * DepartmentModel.gs — phòng ban (bổ sung so với danh sách file gốc — cần thiết vì
 * Sheet Department có trong thiết kế DB nhưng README chỉ liệt kê CompanyController quản lý nó).
 */

var DepartmentModel = (function () {

  var SHEET = Constant.SHEET_NAME.DEPARTMENT;

  var UPDATE_FIELD_MAP = {
    departmentName: 'DepartmentName', departmentCode: 'DepartmentCode',
    parentDepartmentId: 'ParentDepartmentID', managerId: 'ManagerID', status: 'Status'
  };

  return {

    list: function (filters) {
      filters = filters || {};
      return DatabaseModel.find(SHEET, function (d) {
        if (d.Status === Constant.ENTITY_STATUS.DELETED) return false;
        if (filters.companyId && d.CompanyID !== filters.companyId) return false;
        return true;
      });
    },

    getById: function (departmentId) {
      var department = DatabaseModel.getById(SHEET, departmentId);
      if (!department || department.Status === Constant.ENTITY_STATUS.DELETED) return null;
      return department;
    },

    create: function (data) {
      if (!data.departmentName) throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Tên phòng ban là bắt buộc.');
      if (!data.companyId) throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Công ty là bắt buộc.');
      return DatabaseModel.insert(SHEET, {
        CompanyID: data.companyId,
        DepartmentName: data.departmentName,
        DepartmentCode: data.departmentCode || '',
        ParentDepartmentID: data.parentDepartmentId || '',
        ManagerID: data.managerId || '',
        Status: Constant.ENTITY_STATUS.ACTIVE
      });
    },

    update: function (departmentId, data) {
      var mapped = Helper.mapFields(data, UPDATE_FIELD_MAP);
      var updated = DatabaseModel.update(SHEET, departmentId, mapped);
      if (!updated) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy phòng ban.');
      return updated;
    },

    softDelete: function (departmentId) {
      var result = DatabaseModel.softDelete(SHEET, departmentId);
      if (!result) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy phòng ban.');
      return result;
    }

  };

})();
