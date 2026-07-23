/**
 * Setup.gs — khởi tạo dữ liệu ban đầu: Role, Permission, RolePermission, Company, Super Admin.
 *
 * CHỈ chạy 1 LẦN, thủ công từ trình soạn thảo Apps Script (chọn hàm setupInitialData → Run),
 * KHÔNG expose qua Api.gs/Route.gs vì đây là thao tác hạ tầng lúc khởi tạo hệ thống,
 * không phải nghiệp vụ người dùng cuối. An toàn để chạy lại nhiều lần — mỗi bước tự kiểm tra
 * dữ liệu đã tồn tại trước khi seed (idempotent).
 *
 * Yêu cầu Script Properties trước khi chạy: SPREADSHEET_ID, APP_SECRET, ATTACHMENT_FOLDER_ID
 * (bắt buộc cho toàn hệ thống — xem config/Config.gs) và tuỳ chọn INITIAL_COMPANY_NAME,
 * INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD (chỉ dùng đúng 1 lần ở đây, không phải cấu hình
 * chạy thường xuyên nên không đưa qua Config.gs).
 */

function setupInitialData() {
  Database.ensureSheetsExist();

  var roleIds = seedRoles_();
  var permissionIds = seedPermissions_();
  seedRolePermissions_(roleIds, permissionIds);

  var company = seedCompany_();
  seedSuperAdmin_(roleIds, company);

  Logger.log('Khởi tạo dữ liệu ban đầu hoàn tất.');
}

function seedRoles_() {
  var existing = DatabaseModel.getAll(Constant.SHEET_NAME.ROLE);
  if (existing.length > 0) {
    Logger.log('Role đã có dữ liệu, bỏ qua seed Role.');
    var map = {};
    existing.forEach(function (r) { map[r.RoleName] = r.RoleID; });
    return map;
  }

  var roleIds = {};
  Object.keys(Constant.ROLE_NAME).forEach(function (key) {
    var roleName = Constant.ROLE_NAME[key];
    var role = DatabaseModel.insert(Constant.SHEET_NAME.ROLE, {
      RoleName: roleName,
      RoleLevel: Constant.ROLE_LEVEL[roleName],
      Status: Constant.ENTITY_STATUS.ACTIVE
    });
    roleIds[roleName] = role.RoleID;
  });
  return roleIds;
}

function seedPermissions_() {
  var existing = DatabaseModel.getAll(Constant.SHEET_NAME.PERMISSION);
  if (existing.length > 0) {
    Logger.log('Permission đã có dữ liệu, bỏ qua seed Permission.');
    var map = {};
    existing.forEach(function (p) { map[p.PermissionCode] = p.PermissionID; });
    return map;
  }

  var permissionIds = {};
  Object.keys(Constant.PERMISSION_CODE).forEach(function (key) {
    var code = Constant.PERMISSION_CODE[key];
    var permission = DatabaseModel.insert(Constant.SHEET_NAME.PERMISSION, {
      PermissionCode: code,
      Module: code.split('_')[0],
      Description: code
    });
    permissionIds[code] = permission.PermissionID;
  });
  return permissionIds;
}

function seedRolePermissions_(roleIds, permissionIds) {
  if (DatabaseModel.getAll(Constant.SHEET_NAME.ROLE_PERMISSION).length > 0) {
    Logger.log('RolePermission đã có dữ liệu, bỏ qua seed RolePermission.');
    return;
  }

  var R = Constant.ROLE_NAME;
  var P = Constant.PERMISSION_CODE;
  var ALL_PERMISSIONS = Object.keys(P).map(function (k) { return P[k]; });

  // Ma trận quyền mặc định — chỉnh sửa qua UI quản trị (giai đoạn mở rộng) sau khi hệ thống chạy.
  var matrix = {};
  matrix[R.SUPER_ADMIN] = ALL_PERMISSIONS;
  matrix[R.ADMIN] = ALL_PERMISSIONS;
  matrix[R.DIRECTOR] = [P.DASHBOARD_VIEW, P.TASK_VIEW, P.EMPLOYEE_VIEW, P.ORG_MANAGE];
  matrix[R.MANAGER] = [P.DASHBOARD_VIEW, P.TASK_VIEW, P.TASK_CREATE, P.TASK_UPDATE,
    P.TASK_APPROVE, P.TASK_DELETE, P.EMPLOYEE_VIEW, P.EMPLOYEE_CREATE, P.EMPLOYEE_UPDATE, P.ORG_MANAGE];
  matrix[R.LEADER] = [P.DASHBOARD_VIEW, P.TASK_VIEW, P.TASK_CREATE, P.TASK_UPDATE, P.TASK_APPROVE, P.EMPLOYEE_VIEW];
  matrix[R.EMPLOYEE] = [P.DASHBOARD_VIEW, P.TASK_VIEW, P.TASK_UPDATE, P.EMPLOYEE_VIEW];
  matrix[R.GUEST] = [P.DASHBOARD_VIEW];

  Object.keys(matrix).forEach(function (roleName) {
    var roleId = roleIds[roleName];
    matrix[roleName].forEach(function (permissionCode) {
      DatabaseModel.insert(Constant.SHEET_NAME.ROLE_PERMISSION, {
        RoleID: roleId,
        PermissionID: permissionIds[permissionCode]
      });
    });
  });
}

function seedCompany_() {
  var existing = CompanyModel.getInfo();
  if (existing) {
    Logger.log('Company đã có dữ liệu, bỏ qua seed Company.');
    return existing;
  }
  var name = PropertiesService.getScriptProperties().getProperty('INITIAL_COMPANY_NAME') || 'Công ty của bạn';
  return CompanyModel.create({ companyName: name, companyCode: 'CTY001' });
}

function seedSuperAdmin_(roleIds, company) {
  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty('INITIAL_ADMIN_EMAIL');
  var password = props.getProperty('INITIAL_ADMIN_PASSWORD');

  if (!email || !password) {
    Logger.log('Bỏ qua tạo Super Admin: chưa set INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD trong Script Properties.');
    return;
  }
  if (UserModel.findByEmail(email)) {
    Logger.log('Tài khoản ' + email + ' đã tồn tại, bỏ qua.');
    return;
  }

  var departments = DepartmentModel.list({ companyId: company.CompanyID });
  var department = departments[0] || DepartmentModel.create({
    departmentName: 'Ban Giám Đốc',
    companyId: company.CompanyID
  });

  var employee = EmployeeModel.create({
    fullName: 'Super Admin',
    companyId: company.CompanyID,
    departmentId: department.DepartmentID,
    position: 'Super Admin'
  });

  UserModel.createUser(email, password, roleIds[Constant.ROLE_NAME.SUPER_ADMIN], employee.EmployeeID);
  Logger.log('Đã tạo tài khoản Super Admin: ' + email);
}
