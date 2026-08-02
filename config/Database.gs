/**
 * Database.gs — định nghĩa schema (tên cột, thứ tự cột, khoá chính) của từng Sheet.
 * DatabaseModel.gs dựa vào đây để map object <-> row, và để tạo sheet còn thiếu.
 * Đổi cấu trúc Sheet chỉ cần sửa ở đây, không sửa rải rác trong các Model.
 */

var Database = (function () {

  var SN = Constant.SHEET_NAME;

  var SCHEMA = {};

  SCHEMA[SN.COMPANY] = {
    primaryKey: 'CompanyID',
    columns: ['CompanyID', 'CompanyCode', 'CompanyName', 'Address', 'Logo', 'Phone', 'Email', 'Status', 'CreatedAt', 'UpdatedAt']
  };

  SCHEMA[SN.DEPARTMENT] = {
    primaryKey: 'DepartmentID',
    columns: ['DepartmentID', 'CompanyID', 'DepartmentName', 'DepartmentCode', 'ParentDepartmentID', 'ManagerID', 'Status', 'CreatedAt', 'UpdatedAt']
  };

  SCHEMA[SN.TEAM] = {
    primaryKey: 'TeamID',
    columns: ['TeamID', 'DepartmentID', 'TeamName', 'LeaderID', 'Status', 'CreatedAt', 'UpdatedAt']
  };

  SCHEMA[SN.ROLE] = {
    primaryKey: 'RoleID',
    columns: ['RoleID', 'RoleName', 'RoleLevel', 'Status', 'CreatedAt', 'UpdatedAt']
  };

  SCHEMA[SN.PERMISSION] = {
    primaryKey: 'PermissionID',
    columns: ['PermissionID', 'PermissionCode', 'Module', 'Description', 'CreatedAt', 'UpdatedAt']
  };

  SCHEMA[SN.ROLE_PERMISSION] = {
    primaryKey: 'RolePermissionID',
    columns: ['RolePermissionID', 'RoleID', 'PermissionID', 'CreatedAt', 'UpdatedAt']
  };

  SCHEMA[SN.USER] = {
    primaryKey: 'UserID',
    columns: ['UserID', 'Email', 'PasswordHash', 'Salt', 'RoleID', 'EmployeeID', 'Status',
      'FailedLoginCount', 'RememberToken', 'RememberTokenExpiry', 'OTPCode', 'OTPExpiry',
      'LastLoginAt', 'CreatedAt', 'UpdatedAt']
  };

  SCHEMA[SN.EMPLOYEE] = {
    primaryKey: 'EmployeeID',
    columns: ['EmployeeID', 'EmployeeCode', 'FullName', 'Gender', 'Avatar', 'Phone', 'CompanyID',
      'DepartmentID', 'TeamID', 'Position', 'JoinDate', 'Status', 'CreatedAt', 'UpdatedAt']
  };

  SCHEMA[SN.TASK] = {
    primaryKey: 'TaskID',
    columns: ['TaskID', 'TaskCode', 'Title', 'Description', 'CompanyID', 'DepartmentID', 'TeamID',
      'AssignerID', 'AssigneeID', 'WatcherIDs', 'Priority', 'Status', 'Progress',
      'StartDate', 'DueDate', 'CompletedDate',
      'ExtensionStatus', 'ExtensionReason', 'ExtensionNewDueDate',
      'AttachmentURL', 'CreatedAt', 'UpdatedAt']
  };

  SCHEMA[SN.TASK_HISTORY] = {
    primaryKey: 'HistoryID',
    columns: ['HistoryID', 'TaskID', 'Action', 'OldValue', 'NewValue', 'ActorID', 'Note', 'Timestamp']
  };

  var REPORT_COLUMNS = ['ReportID', 'EmployeeID', 'PeriodKey', 'Content',
    'TasksCompleted', 'TasksInProgress', 'TasksOverdue',
    'Status', 'ApprovedBy', 'ApprovedAt', 'CreatedAt', 'UpdatedAt'];

  SCHEMA[SN.DAILY_REPORT] = { primaryKey: 'ReportID', columns: REPORT_COLUMNS };
  SCHEMA[SN.WEEKLY_REPORT] = { primaryKey: 'ReportID', columns: REPORT_COLUMNS };
  SCHEMA[SN.MONTHLY_REPORT] = { primaryKey: 'ReportID', columns: REPORT_COLUMNS };
  SCHEMA[SN.YEARLY_REPORT] = { primaryKey: 'ReportID', columns: REPORT_COLUMNS };

  SCHEMA[SN.NOTIFICATION] = {
    primaryKey: 'NotificationID',
    columns: ['NotificationID', 'RecipientID', 'Type', 'Title', 'Message',
      'RelatedEntityType', 'RelatedEntityID', 'IsRead', 'CreatedAt']
  };

  SCHEMA[SN.LOG] = {
    primaryKey: 'LogID',
    columns: ['LogID', 'ActorID', 'Action', 'Module', 'EntityID', 'Detail', 'Timestamp']
  };

  SCHEMA[SN.SETTING] = {
    primaryKey: 'Key',
    columns: ['Key', 'Value', 'Type', 'Description', 'UpdatedBy', 'UpdatedAt']
  };

  function getSchema_(sheetName) {
    var schema = SCHEMA[sheetName];
    if (!schema) {
      throw new Error('Không tìm thấy schema cho sheet "' + sheetName + '".');
    }
    return schema;
  }

  return {

    getColumns: function (sheetName) {
      return getSchema_(sheetName).columns.slice();
    },

    getPrimaryKey: function (sheetName) {
      return getSchema_(sheetName).primaryKey;
    },

    getAllSheetNames: function () {
      return Object.keys(SCHEMA);
    },

    // Tạo sẵn các sheet còn thiếu kèm header đúng thứ tự cột. Chạy 1 lần lúc khởi tạo hệ thống.
    ensureSheetsExist: function () {
      var spreadsheet = SpreadsheetApp.openById(Config.getSpreadsheetId());
      Database.getAllSheetNames().forEach(function (sheetName) {
        var sheet = spreadsheet.getSheetByName(sheetName);
        var columns = Database.getColumns(sheetName);
        if (!sheet) {
          sheet = spreadsheet.insertSheet(sheetName);
          sheet.appendRow(columns);
          sheet.setFrozenRows(1);
        }
      });
    }

  };

})();
