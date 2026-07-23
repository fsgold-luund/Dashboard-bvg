/**
 * Constant.gs — toàn bộ giá trị cố định dùng chung trong hệ thống.
 * Không hard-code chuỗi/số ở bất kỳ file nào khác — luôn tham chiếu qua Constant.
 */

var Constant = Object.freeze({

  SHEET_NAME: Object.freeze({
    COMPANY: 'Company',
    DEPARTMENT: 'Department',
    TEAM: 'Team',
    EMPLOYEE: 'Employee',
    USER: 'User',
    ROLE: 'Role',
    PERMISSION: 'Permission',
    ROLE_PERMISSION: 'RolePermission',
    TASK: 'Task',
    TASK_HISTORY: 'TaskHistory',
    DAILY_REPORT: 'DailyReport',
    WEEKLY_REPORT: 'WeeklyReport',
    MONTHLY_REPORT: 'MonthlyReport',
    YEARLY_REPORT: 'YearlyReport',
    NOTIFICATION: 'Notification',
    LOG: 'Log',
    SETTING: 'Setting'
  }),

  ROLE_NAME: Object.freeze({
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    DIRECTOR: 'Director',
    MANAGER: 'Manager',
    LEADER: 'Leader',
    EMPLOYEE: 'Employee',
    GUEST: 'Guest'
  }),

  // Số càng nhỏ quyền càng cao. Dùng để so sánh kiểu "Leader trở lên".
  ROLE_LEVEL: Object.freeze({
    'Super Admin': 1,
    'Admin': 2,
    'Director': 3,
    'Manager': 4,
    'Leader': 5,
    'Employee': 6,
    'Guest': 7
  }),

  PERMISSION_CODE: Object.freeze({
    DASHBOARD_VIEW: 'DASHBOARD_VIEW',
    TASK_VIEW: 'TASK_VIEW',
    TASK_CREATE: 'TASK_CREATE',
    TASK_UPDATE: 'TASK_UPDATE',
    TASK_APPROVE: 'TASK_APPROVE',
    TASK_DELETE: 'TASK_DELETE',
    EMPLOYEE_VIEW: 'EMPLOYEE_VIEW',
    EMPLOYEE_CREATE: 'EMPLOYEE_CREATE',
    EMPLOYEE_UPDATE: 'EMPLOYEE_UPDATE',
    EMPLOYEE_DELETE: 'EMPLOYEE_DELETE',
    ORG_MANAGE: 'ORG_MANAGE'
  }),

  ACTION_NAME: Object.freeze({
    AUTH_LOGIN: 'auth.login',
    AUTH_LOGOUT: 'auth.logout',
    AUTH_FORGOT_PASSWORD: 'auth.forgotPassword',
    AUTH_VERIFY_OTP_AND_RESET: 'auth.verifyOtpAndReset',
    AUTH_GET_SESSION: 'auth.getSession',

    DASHBOARD_SUMMARY: 'dashboard.summary',
    DASHBOARD_STATUS_CHART: 'dashboard.statusChart',
    DASHBOARD_WORKLOAD_CHART: 'dashboard.workloadChart',
    DASHBOARD_DEADLINE_LIST: 'dashboard.deadlineList',

    TASK_LIST: 'task.list',
    TASK_GET_BY_ID: 'task.getById',
    TASK_CREATE: 'task.create',
    TASK_UPDATE: 'task.update',
    TASK_UPDATE_STATUS: 'task.updateStatus',
    TASK_REQUEST_EXTENSION: 'task.requestExtension',
    TASK_RESOLVE_EXTENSION: 'task.resolveExtension',
    TASK_UPLOAD_ATTACHMENT: 'task.uploadAttachment',
    TASK_DELETE: 'task.delete',

    EMPLOYEE_LIST: 'employee.list',
    EMPLOYEE_GET_BY_ID: 'employee.getById',
    EMPLOYEE_CREATE: 'employee.create',
    EMPLOYEE_UPDATE: 'employee.update',
    EMPLOYEE_DELETE: 'employee.delete',

    COMPANY_GET_INFO: 'company.getInfo',
    COMPANY_UPDATE_INFO: 'company.updateInfo',
    COMPANY_LIST_DEPARTMENTS: 'company.listDepartments',
    COMPANY_CREATE_DEPARTMENT: 'company.createDepartment',
    COMPANY_UPDATE_DEPARTMENT: 'company.updateDepartment',
    COMPANY_DELETE_DEPARTMENT: 'company.deleteDepartment',

    TEAM_LIST: 'team.list',
    TEAM_GET_BY_ID: 'team.getById',
    TEAM_CREATE: 'team.create',
    TEAM_UPDATE: 'team.update',
    TEAM_DELETE: 'team.delete'
  }),

  ERROR_CODE: Object.freeze({
    AUTH_INVALID_CREDENTIAL: 'AUTH_INVALID_CREDENTIAL',
    AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
    AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
    AUTH_OTP_INVALID: 'AUTH_OTP_INVALID',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    RATE_LIMITED: 'RATE_LIMITED',
    NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
    SERVER_ERROR: 'SERVER_ERROR'
  }),

  TASK_STATUS: Object.freeze({
    NEW: 'New',
    IN_PROGRESS: 'InProgress',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    OVERDUE: 'Overdue',
    CANCELLED: 'Cancelled'
  }),

  TASK_PRIORITY: Object.freeze({
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent'
  }),

  EXTENSION_STATUS: Object.freeze({
    NONE: 'None',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected'
  }),

  TASK_HISTORY_ACTION: Object.freeze({
    CREATED: 'Created',
    UPDATED: 'Updated',
    STATUS_CHANGED: 'StatusChanged',
    REASSIGNED: 'Reassigned',
    EXTENSION_REQUESTED: 'ExtensionRequested',
    EXTENSION_RESOLVED: 'ExtensionResolved',
    COMMENTED: 'Commented'
  }),

  REPORT_STATUS: Object.freeze({
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    APPROVED: 'Approved',
    REJECTED: 'Rejected'
  }),

  ENTITY_STATUS: Object.freeze({
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    LOCKED: 'Locked',
    DELETED: 'Deleted',
    RESIGNED: 'Resigned',
    ON_LEAVE: 'OnLeave'
  }),

  LOG_ACTION: Object.freeze({
    LOGIN: 'Login',
    LOGOUT: 'Logout',
    CREATE: 'Create',
    UPDATE: 'Update',
    DELETE: 'Delete',
    EXPORT: 'Export',
    IMPORT: 'Import'
  }),

  NOTIFICATION_TYPE: Object.freeze({
    TASK_ASSIGNED: 'TaskAssigned',
    DEADLINE: 'Deadline',
    EXTENSION_APPROVED: 'ExtensionApproved',
    EXTENSION_REJECTED: 'ExtensionRejected',
    SYSTEM: 'System'
  })

});
