/**
 * DashboardController.gs — điều phối số liệu KPI/chart cho Dashboard.
 * TaskModel chỉ trả ID thô (TeamID/AssigneeID) cho các nhóm — Controller là nơi resolve
 * sang tên hiển thị, vì việc join Team/Employee là điều phối liên-Model, không phải việc của TaskModel.
 */

var DashboardController = (function () {

  function resolveTeamName_(teamId) {
    var team = teamId ? TeamModel.getById(teamId) : null;
    return team ? team.TeamName : 'Chưa gán team';
  }

  function resolveEmployeeName_(employeeId) {
    var employee = employeeId ? EmployeeModel.getById(employeeId) : null;
    return employee ? employee.FullName : 'Chưa gán người phụ trách';
  }

  return {

    getSummaryCards: function (params) {
      return TaskModel.getSummary((params && params.filters) || {});
    },

    getStatusChartData: function (params) {
      var distribution = TaskModel.getStatusDistribution((params && params.filters) || {});
      return {
        labels: distribution.map(function (d) { return d.label; }),
        series: distribution
      };
    },

    getWorkloadChartData: function (params) {
      var groupBy = (params && params.groupBy === 'employee') ? 'employee' : 'team';
      var raw = TaskModel.getWorkloadByGroup((params && params.filters) || {}, groupBy);
      var resolveName = groupBy === 'team' ? resolveTeamName_ : resolveEmployeeName_;

      var series = raw.map(function (item) {
        return { label: resolveName(item.label), value: item.value };
      });

      return {
        labels: series.map(function (s) { return s.label; }),
        series: series
      };
    },

    getDeadlineList: function (params) {
      var limit = (params && params.limit) || 10;
      var tasks = TaskModel.getUpcomingDeadlines((params && params.filters) || {}, limit);
      return {
        items: tasks.map(function (t) {
          return {
            taskId: t.TaskID,
            title: t.Title,
            assigneeName: resolveEmployeeName_(t.AssigneeID),
            dueDate: Helper.toIsoString(t.DueDate),
            priority: t.Priority
          };
        })
      };
    }

  };

})();
