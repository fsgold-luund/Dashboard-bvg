/**
 * CompanyController.gs — điều phối thông tin Company + Department.
 */

var CompanyController = (function () {

  function toCompanyDto_(company) {
    return {
      companyId: company.CompanyID,
      companyCode: company.CompanyCode,
      companyName: company.CompanyName,
      address: company.Address,
      logo: company.Logo,
      phone: company.Phone,
      email: company.Email,
      status: company.Status
    };
  }

  function toDepartmentDto_(department) {
    return {
      departmentId: department.DepartmentID,
      companyId: department.CompanyID,
      departmentName: department.DepartmentName,
      departmentCode: department.DepartmentCode,
      parentDepartmentId: department.ParentDepartmentID,
      managerId: department.ManagerID,
      status: department.Status
    };
  }

  return {

    getInfo: function () {
      var company = CompanyModel.getInfo();
      if (!company) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Chưa khởi tạo thông tin công ty.');
      return toCompanyDto_(company);
    },

    updateInfo: function (params) {
      var updated = CompanyModel.updateInfo(params);
      return toCompanyDto_(updated);
    },

    listDepartments: function (params) {
      var departments = DepartmentModel.list((params && params.filters) || {});
      return { items: departments.map(toDepartmentDto_) };
    },

    createDepartment: function (params) {
      var department = DepartmentModel.create(params);
      return toDepartmentDto_(department);
    },

    updateDepartment: function (params) {
      var updated = DepartmentModel.update(params.departmentId, params);
      return toDepartmentDto_(updated);
    },

    deleteDepartment: function (params) {
      DepartmentModel.softDelete(params.departmentId);
      return {};
    }

  };

})();
