/**
 * TeamController.gs — điều phối CRUD Team.
 */

var TeamController = (function () {

  function toTeamDto_(team) {
    return {
      teamId: team.TeamID,
      departmentId: team.DepartmentID,
      teamName: team.TeamName,
      leaderId: team.LeaderID,
      status: team.Status
    };
  }

  return {

    list: function (params) {
      var teams = TeamModel.list((params && params.filters) || {});
      return { items: teams.map(toTeamDto_) };
    },

    getById: function (params) {
      var team = TeamModel.getById(params.teamId);
      if (!team) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy team.');
      return toTeamDto_(team);
    },

    create: function (params) {
      var team = TeamModel.create(params);
      return toTeamDto_(team);
    },

    update: function (params) {
      var updated = TeamModel.update(params.teamId, params);
      return toTeamDto_(updated);
    },

    delete: function (params) {
      TeamModel.softDelete(params.teamId);
      return {};
    }

  };

})();
