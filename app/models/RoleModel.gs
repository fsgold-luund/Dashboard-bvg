/**
 * RoleModel.gs — Role + RolePermission. Danh sách quyền theo Role được cache dài hạn
 * (Config.getLookupCacheTtlSeconds()) vì Role/Permission gần như không đổi khi hệ thống chạy.
 */

var RoleModel = (function () {

  var SN = Constant.SHEET_NAME;

  function permCacheKey_(roleId) {
    return 'roleperm_' + roleId;
  }

  return {

    getById: function (roleId) {
      return DatabaseModel.getById(SN.ROLE, roleId);
    },

    getByName: function (roleName) {
      return DatabaseModel.find(SN.ROLE, function (r) { return r.RoleName === roleName; })[0] || null;
    },

    list: function () {
      return DatabaseModel.getAll(SN.ROLE);
    },

    // Trả về mảng PermissionCode (string[]) mà role được phép thực hiện.
    getPermissionCodesByRoleId: function (roleId) {
      var cache = CacheService.getScriptCache();
      var key = permCacheKey_(roleId);
      var cached = cache.get(key);
      if (cached) {
        try { return JSON.parse(cached); } catch (e) { /* cache hỏng, build lại bên dưới */ }
      }

      var rolePermissions = DatabaseModel.find(SN.ROLE_PERMISSION, function (rp) { return rp.RoleID === roleId; });
      var permissionIds = rolePermissions.map(function (rp) { return rp.PermissionID; });
      var codes = DatabaseModel.getAll(SN.PERMISSION)
        .filter(function (p) { return permissionIds.indexOf(p.PermissionID) > -1; })
        .map(function (p) { return p.PermissionCode; });

      try {
        cache.put(key, JSON.stringify(codes), Config.getLookupCacheTtlSeconds());
      } catch (e) { /* vượt dung lượng CacheService, bỏ qua cache lần này */ }

      return codes;
    },

    invalidatePermissionCache: function (roleId) {
      CacheService.getScriptCache().remove(permCacheKey_(roleId));
    }

  };

})();
