/**
 * CompanyModel.gs — thông tin công ty. Hệ thống single-tenant nên chỉ có đúng 1 bản ghi
 * Company "đang hoạt động" — getInfo() luôn trả về bản ghi Active đầu tiên.
 */

var CompanyModel = (function () {

  var SHEET = Constant.SHEET_NAME.COMPANY;

  var UPDATE_FIELD_MAP = {
    companyName: 'CompanyName', address: 'Address', logo: 'Logo', phone: 'Phone', email: 'Email'
  };

  return {

    getInfo: function () {
      return DatabaseModel.find(SHEET, function (c) {
        return c.Status === Constant.ENTITY_STATUS.ACTIVE;
      })[0] || null;
    },

    updateInfo: function (data) {
      var company = this.getInfo();
      if (!company) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Chưa khởi tạo thông tin công ty.');
      var mapped = Helper.mapFields(data, UPDATE_FIELD_MAP);
      return DatabaseModel.update(SHEET, company.CompanyID, mapped);
    },

    // Dùng khi khởi tạo hệ thống lần đầu (chưa có Company nào).
    create: function (data) {
      if (!data.companyName) throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Tên công ty là bắt buộc.');
      return DatabaseModel.insert(SHEET, {
        CompanyCode: data.companyCode || 'CTY001',
        CompanyName: data.companyName,
        Address: data.address || '',
        Logo: data.logo || '',
        Phone: data.phone || '',
        Email: data.email || '',
        Status: Constant.ENTITY_STATUS.ACTIVE
      });
    }

  };

})();
