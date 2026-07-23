/**
 * TeamModel.gs — nghiệp vụ Team.
 */

var TeamModel = (function () {

  var SHEET = Constant.SHEET_NAME.TEAM;

  var UPDATE_FIELD_MAP = {
    teamName: 'TeamName', departmentId: 'DepartmentID', leaderId: 'LeaderID', status: 'Status'
  };

  return {

    list: function (filters) {
      filters = filters || {};
      return DatabaseModel.find(SHEET, function (t) {
        if (t.Status === Constant.ENTITY_STATUS.DELETED) return false;
        if (filters.departmentId && t.DepartmentID !== filters.departmentId) return false;
        return true;
      });
    },

    getById: function (teamId) {
      var team = DatabaseModel.getById(SHEET, teamId);
      if (!team || team.Status === Constant.ENTITY_STATUS.DELETED) return null;
      return team;
    },

    create: function (data) {
      if (!data.teamName) throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Tên team là bắt buộc.');
      if (!data.departmentId) throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Phòng ban là bắt buộc.');
      return DatabaseModel.insert(SHEET, {
        TeamName: data.teamName,
        DepartmentID: data.departmentId,
        LeaderID: data.leaderId || '',
        Status: Constant.ENTITY_STATUS.ACTIVE
      });
    },

    update: function (teamId, data) {
      var mapped = Helper.mapFields(data, UPDATE_FIELD_MAP);
      var updated = DatabaseModel.update(SHEET, teamId, mapped);
      if (!updated) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy team.');
      return updated;
    },

    softDelete: function (teamId) {
      var result = DatabaseModel.softDelete(SHEET, teamId);
      if (!result) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy team.');
      return result;
    }

  };

})();
