/**
 * DashboardController.gs — điều phối số liệu KPI/chart cho Dashboard.
 * TaskModel chỉ trả ID thô (TeamID/AssigneeID) cho các nhóm — Controller là nơi resolve
 * sang tên hiển thị, vì việc join Team/Employee là điều phối liên-Model, không phải việc của TaskModel.
 */

var DashboardController = (function () {

  var EMPLOYEE_STATUS_LABEL = {
    Active: 'Đang làm việc',
    OnLeave: 'Nghỉ phép',
    Resigned: 'Đã nghỉ việc',
    Inactive: 'Tạm ngưng',
    Locked: 'Bị khoá'
  };

  function resolveTeamName_(teamId) {
    var team = teamId ? TeamModel.getById(teamId) : null;
    return team ? team.TeamName : 'Chưa gán team';
  }

  function resolveEmployeeName_(employeeId) {
    var employee = employeeId ? EmployeeModel.getById(employeeId) : null;
    return employee ? employee.FullName : 'Chưa gán người phụ trách';
  }

  function resolveDepartmentName_(departmentId) {
    var department = departmentId ? DepartmentModel.getById(departmentId) : null;
    return department ? department.DepartmentName : 'Chưa gán phòng ban';
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
    },

    // Danh sách phòng ban cho sidebar drill-down — kèm số nhân viên/công việc để hiển thị ngay,
    // không cần round-trip riêng khi người dùng chưa click chọn phòng ban nào.
    getDepartmentList: function () {
      var departments = DepartmentModel.list({});
      var employeeCounts = Helper.groupBy(EmployeeModel.list({}), function (e) { return e.DepartmentID; });
      var taskCounts = TaskModel.getWorkloadByGroup({}, 'department');
      var taskCountByDept = {};
      taskCounts.forEach(function (item) { taskCountByDept[item.label] = item.value; });

      return {
        items: departments.map(function (d) {
          return {
            departmentId: d.DepartmentID,
            departmentName: d.DepartmentName,
            employeeCount: (employeeCounts[d.DepartmentID] || []).length,
            taskCount: taskCountByDept[d.DepartmentID] || 0
          };
        })
      };
    },

    // Dữ liệu 2 cấp Phòng ban -> Team kèm số lượng công việc, cho biểu đồ treemap.
    getWorkloadTreemap: function (params) {
      var raw = TaskModel.getWorkloadByDepartmentAndTeam((params && params.filters) || {});
      return {
        tree: raw.map(function (item) {
          return {
            department: resolveDepartmentName_(item.departmentId),
            team: resolveTeamName_(item.teamId),
            value: item.value
          };
        })
      };
    },

    getEmployeeStatusDistribution: function (params) {
      var distribution = EmployeeModel.getStatusDistribution((params && params.filters) || {});
      return {
        labels: distribution.map(function (d) { return EMPLOYEE_STATUS_LABEL[d.label] || d.label; }),
        series: distribution
      };
    },

    // Tỷ lệ giới tính theo từng phòng ban (bar ngang xếp chồng) — nếu filters.departmentId được truyền,
    // EmployeeModel.getGenderDistribution đã tự giới hạn nên kết quả chỉ còn 1 phòng ban đó.
    getGenderDistribution: function (params) {
      var distribution = EmployeeModel.getGenderDistribution((params && params.filters) || {});
      return {
        items: distribution
          .filter(function (d) { return d.departmentId; })
          .map(function (d) {
            return {
              departmentId: d.departmentId,
              departmentName: resolveDepartmentName_(d.departmentId),
              male: d.male,
              female: d.female,
              other: d.other,
              total: d.total,
              malePct: d.total ? Math.round(d.male / d.total * 100) : 0,
              femalePct: d.total ? Math.round(d.female / d.total * 100) : 0
            };
          })
      };
    },

    // Bảng chi tiết Phòng ban x Vị trí: số nhân viên, tổng công việc, tỷ lệ hoàn thành.
    // TaskModel/EmployeeModel chỉ trả dữ liệu thô theo ID — join Employee.Position với số liệu Task
    // là điều phối liên-Model, thuộc trách nhiệm Controller (cùng quy ước với resolveTeamName_ ở trên).
    getDepartmentTable: function (params) {
      var filters = (params && params.filters) || {};
      var employees = EmployeeModel.list(filters);
      var taskCounts = TaskModel.getCountsByAssignee(filters);

      var grouped = Helper.groupBy(employees, function (e) {
        return (e.DepartmentID || '') + '|' + (e.Position || 'Khác');
      });

      var rows = Object.keys(grouped).map(function (key) {
        var parts = key.split('|');
        var departmentId = parts[0];
        var position = parts[1];
        var emps = grouped[key];

        var totalTasks = 0;
        var completedTasks = 0;
        emps.forEach(function (e) {
          var counts = taskCounts[e.EmployeeID];
          if (counts) {
            totalTasks += counts.total;
            completedTasks += counts.completed;
          }
        });

        return {
          departmentId: departmentId,
          departmentName: resolveDepartmentName_(departmentId),
          position: position,
          totalEmployees: emps.length,
          totalTasks: totalTasks,
          completionRate: totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0
        };
      });

      rows.sort(function (a, b) {
        return a.departmentName.localeCompare(b.departmentName) || a.position.localeCompare(b.position);
      });

      return { rows: rows };
    }

  };

})();
