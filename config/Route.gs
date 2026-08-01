/**
 * Route.gs — bảng ánh xạ action → {controller, method, permission} và page → file HTML.
 * Đăng ký được hoãn tới lần gọi đầu tiên (ensureRegistered_) vì lúc Route.gs được nạp,
 * các biến Controller ở file khác có thể chưa gán xong (Apps Script không đảm bảo thứ tự nạp file).
 */

var Route = (function () {

  var A = Constant.ACTION_NAME;
  var P = Constant.PERMISSION_CODE;

  var actionMap_ = null;

  function reg_(map, action, controller, method, permission, isPublic) {
    map[action] = {
      controller: controller,
      method: method,
      permission: permission || null,
      module: action.split('.')[0],
      public: !!isPublic
    };
  }

  function ensureRegistered_() {
    if (actionMap_) return actionMap_;
    var map = {};

    reg_(map, A.AUTH_LOGIN, AuthController, 'login', null, true);
    reg_(map, A.AUTH_LOGOUT, AuthController, 'logout', null, false);
    reg_(map, A.AUTH_FORGOT_PASSWORD, AuthController, 'forgotPassword', null, true);
    reg_(map, A.AUTH_VERIFY_OTP_AND_RESET, AuthController, 'verifyOtpAndReset', null, true);
    reg_(map, A.AUTH_GET_SESSION, AuthController, 'getSession', null, true);

    reg_(map, A.DASHBOARD_SUMMARY, DashboardController, 'getSummaryCards', P.DASHBOARD_VIEW);
    reg_(map, A.DASHBOARD_STATUS_CHART, DashboardController, 'getStatusChartData', P.DASHBOARD_VIEW);
    reg_(map, A.DASHBOARD_WORKLOAD_CHART, DashboardController, 'getWorkloadChartData', P.DASHBOARD_VIEW);
    reg_(map, A.DASHBOARD_DEADLINE_LIST, DashboardController, 'getDeadlineList', P.DASHBOARD_VIEW);
    reg_(map, A.DASHBOARD_DEPARTMENT_LIST, DashboardController, 'getDepartmentList', P.DASHBOARD_VIEW);
    reg_(map, A.DASHBOARD_WORKLOAD_TREEMAP, DashboardController, 'getWorkloadTreemap', P.DASHBOARD_VIEW);
    reg_(map, A.DASHBOARD_EMPLOYEE_STATUS, DashboardController, 'getEmployeeStatusDistribution', P.DASHBOARD_VIEW);
    reg_(map, A.DASHBOARD_GENDER_DISTRIBUTION, DashboardController, 'getGenderDistribution', P.DASHBOARD_VIEW);
    reg_(map, A.DASHBOARD_DEPARTMENT_TABLE, DashboardController, 'getDepartmentTable', P.DASHBOARD_VIEW);

    reg_(map, A.TASK_LIST, TaskController, 'list', P.TASK_VIEW);
    reg_(map, A.TASK_GET_BY_ID, TaskController, 'getById', P.TASK_VIEW);
    reg_(map, A.TASK_CREATE, TaskController, 'create', P.TASK_CREATE);
    reg_(map, A.TASK_UPDATE, TaskController, 'update', P.TASK_UPDATE);
    reg_(map, A.TASK_UPDATE_STATUS, TaskController, 'updateStatus', P.TASK_UPDATE);
    reg_(map, A.TASK_REQUEST_EXTENSION, TaskController, 'requestExtension', P.TASK_UPDATE);
    reg_(map, A.TASK_RESOLVE_EXTENSION, TaskController, 'resolveExtension', P.TASK_APPROVE);
    reg_(map, A.TASK_UPLOAD_ATTACHMENT, TaskController, 'uploadAttachment', P.TASK_UPDATE);
    reg_(map, A.TASK_DELETE, TaskController, 'delete', P.TASK_DELETE);

    reg_(map, A.EMPLOYEE_LIST, EmployeeController, 'list', P.EMPLOYEE_VIEW);
    reg_(map, A.EMPLOYEE_GET_BY_ID, EmployeeController, 'getById', P.EMPLOYEE_VIEW);
    reg_(map, A.EMPLOYEE_CREATE, EmployeeController, 'create', P.EMPLOYEE_CREATE);
    reg_(map, A.EMPLOYEE_UPDATE, EmployeeController, 'update', P.EMPLOYEE_UPDATE);
    reg_(map, A.EMPLOYEE_DELETE, EmployeeController, 'delete', P.EMPLOYEE_DELETE);

    reg_(map, A.COMPANY_GET_INFO, CompanyController, 'getInfo', P.ORG_MANAGE);
    reg_(map, A.COMPANY_UPDATE_INFO, CompanyController, 'updateInfo', P.ORG_MANAGE);
    reg_(map, A.COMPANY_LIST_DEPARTMENTS, CompanyController, 'listDepartments', P.ORG_MANAGE);
    reg_(map, A.COMPANY_CREATE_DEPARTMENT, CompanyController, 'createDepartment', P.ORG_MANAGE);
    reg_(map, A.COMPANY_UPDATE_DEPARTMENT, CompanyController, 'updateDepartment', P.ORG_MANAGE);
    reg_(map, A.COMPANY_DELETE_DEPARTMENT, CompanyController, 'deleteDepartment', P.ORG_MANAGE);

    reg_(map, A.TEAM_LIST, TeamController, 'list', P.ORG_MANAGE);
    reg_(map, A.TEAM_GET_BY_ID, TeamController, 'getById', P.ORG_MANAGE);
    reg_(map, A.TEAM_CREATE, TeamController, 'create', P.ORG_MANAGE);
    reg_(map, A.TEAM_UPDATE, TeamController, 'update', P.ORG_MANAGE);
    reg_(map, A.TEAM_DELETE, TeamController, 'delete', P.ORG_MANAGE);

    actionMap_ = map;
    return actionMap_;
  }

  var PAGE_MAP = {
    'login': { file: 'login', public: true },
    'dashboard': { file: 'dashboard', public: false },
    'task': { file: 'task', public: false },
    'employee': { file: 'employee', public: false },
    'company': { file: 'company', public: false },
    'team': { file: 'team', public: false },
    'report': { file: 'report', public: false },
    'setting': { file: 'setting', public: false }
  };

  return {

    resolveAction: function (actionName) {
      return ensureRegistered_()[actionName] || null;
    },

    resolvePage: function (pageName) {
      return PAGE_MAP[pageName] || PAGE_MAP['dashboard'];
    }

  };

})();
