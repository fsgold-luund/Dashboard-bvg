/**
 * TaskModel.gs — nghiệp vụ Task + TaskHistory + số liệu tổng hợp cho Dashboard.
 * "Xoá" task = chuyển Status sang Cancelled (giữ lịch sử, không softDelete kiểu ENTITY_STATUS
 * vì cột Status của Task dùng domain riêng TASK_STATUS, không phải Active/Deleted).
 */

var TaskModel = (function () {

  var SHEET = Constant.SHEET_NAME.TASK;
  var HISTORY_SHEET = Constant.SHEET_NAME.TASK_HISTORY;
  var TS = Constant.TASK_STATUS;
  var TH = Constant.TASK_HISTORY_ACTION;

  var OPEN_STATUSES = [TS.NEW, TS.IN_PROGRESS, TS.PENDING];

  var UPDATE_FIELD_MAP = {
    title: 'Title', description: 'Description', teamId: 'TeamID',
    assigneeId: 'AssigneeID', priority: 'Priority', dueDate: 'DueDate'
  };

  function addHistory_(taskId, action, oldValue, newValue, actorId, note) {
    DatabaseModel.insert(HISTORY_SHEET, {
      TaskID: taskId,
      Action: action,
      OldValue: oldValue || '',
      NewValue: newValue || '',
      ActorID: actorId || '',
      Note: note || '',
      Timestamp: new Date()
    });
  }

  function isOverdue_(task) {
    return OPEN_STATUSES.indexOf(task.Status) > -1 && task.DueDate && new Date(task.DueDate) < new Date();
  }

  function buildScopeFilter_(filters) {
    filters = filters || {};
    return function (task) {
      if (filters.teamId && task.TeamID !== filters.teamId) return false;
      if (filters.departmentId && task.DepartmentID !== filters.departmentId) return false;
      if (filters.dateFrom && new Date(task.DueDate) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(task.DueDate) > new Date(filters.dateTo)) return false;
      return true;
    };
  }

  function buildListFilter_(filters) {
    filters = filters || {};
    var inScope = buildScopeFilter_(filters);
    return function (task) {
      if (!inScope(task)) return false;
      if (filters.status && task.Status !== filters.status) return false;
      if (filters.priority && task.Priority !== filters.priority) return false;
      if (filters.assigneeId && task.AssigneeID !== filters.assigneeId) return false;
      if (filters.keyword) {
        var kw = filters.keyword.toLowerCase();
        var haystack = (task.Title + ' ' + task.TaskCode).toLowerCase();
        if (haystack.indexOf(kw) === -1) return false;
      }
      return true;
    };
  }

  return {

    listPaged: function (filters, page, pageSize, sortBy, sortDir) {
      return DatabaseModel.paginate(SHEET, buildListFilter_(filters), {
        page: page, pageSize: pageSize, sortBy: sortBy || 'DueDate', sortDir: sortDir || 'asc'
      });
    },

    getById: function (taskId) {
      var task = DatabaseModel.getById(SHEET, taskId);
      if (!task) return null;
      task.history = DatabaseModel.find(HISTORY_SHEET, function (h) { return h.TaskID === taskId; })
        .sort(function (a, b) { return new Date(b.Timestamp) - new Date(a.Timestamp); });
      return task;
    },

    // data cần đã có companyId/departmentId/teamId (denormalize từ Assignee — do Controller tra cứu
    // qua EmployeeModel rồi truyền vào, TaskModel không tự gọi Model khác).
    create: function (data, actorId) {
      if (!data.title) throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Tiêu đề công việc là bắt buộc.');
      if (!data.assigneeId) throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Người nhận việc là bắt buộc.');
      if (!data.dueDate) throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Hạn hoàn thành là bắt buộc.');

      var startDate = data.startDate || new Date();
      if (new Date(data.dueDate) < new Date(startDate)) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Hạn hoàn thành phải sau ngày bắt đầu.');
      }

      var task = DatabaseModel.insert(SHEET, {
        TaskCode: 'TSK' + Date.now().toString().slice(-6),
        Title: data.title,
        Description: data.description || '',
        CompanyID: data.companyId || '',
        DepartmentID: data.departmentId || '',
        TeamID: data.teamId || '',
        AssignerID: data.assignerId || actorId || '',
        AssigneeID: data.assigneeId,
        WatcherIDs: (data.watcherIds || []).join(','),
        Priority: data.priority || Constant.TASK_PRIORITY.MEDIUM,
        Status: TS.NEW,
        Progress: 0,
        StartDate: startDate,
        DueDate: data.dueDate,
        CompletedDate: '',
        ExtensionStatus: Constant.EXTENSION_STATUS.NONE,
        ExtensionReason: '',
        ExtensionNewDueDate: '',
        AttachmentURL: (data.attachmentUrls || []).join(',')
      });

      addHistory_(task.TaskID, TH.CREATED, '', task.Title, actorId, '');
      return task;
    },

    update: function (taskId, data, actorId) {
      var existing = DatabaseModel.getById(SHEET, taskId);
      if (!existing) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy công việc.');

      var mapped = Helper.mapFields(data, UPDATE_FIELD_MAP);
      var updated = DatabaseModel.update(SHEET, taskId, mapped);

      if (mapped.AssigneeID && mapped.AssigneeID !== existing.AssigneeID) {
        addHistory_(taskId, TH.REASSIGNED, existing.AssigneeID, mapped.AssigneeID, actorId, '');
      } else {
        addHistory_(taskId, TH.UPDATED, '', JSON.stringify(mapped), actorId, '');
      }
      return updated;
    },

    updateStatus: function (taskId, status, progress, actorId) {
      var existing = DatabaseModel.getById(SHEET, taskId);
      if (!existing) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy công việc.');
      if (Object.keys(TS).map(function (k) { return TS[k]; }).indexOf(status) === -1) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Trạng thái không hợp lệ: ' + status);
      }

      var patch = { Status: status };
      if (progress !== undefined && progress !== null) patch.Progress = Helper.clamp(Number(progress), 0, 100);
      if (status === TS.COMPLETED) {
        patch.CompletedDate = new Date();
        patch.Progress = 100;
      }

      var updated = DatabaseModel.update(SHEET, taskId, patch);
      addHistory_(taskId, TH.STATUS_CHANGED, existing.Status, status, actorId, '');
      return updated;
    },

    requestExtension: function (taskId, reason, newDueDate, actorId) {
      var existing = DatabaseModel.getById(SHEET, taskId);
      if (!existing) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy công việc.');
      if (existing.ExtensionStatus === Constant.EXTENSION_STATUS.PENDING) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Công việc đang có yêu cầu gia hạn chờ duyệt.');
      }

      var updated = DatabaseModel.update(SHEET, taskId, {
        ExtensionStatus: Constant.EXTENSION_STATUS.PENDING,
        ExtensionReason: reason || '',
        ExtensionNewDueDate: newDueDate
      });
      addHistory_(taskId, TH.EXTENSION_REQUESTED, existing.DueDate, newDueDate, actorId, reason);
      return updated;
    },

    resolveExtension: function (taskId, decision, actorId) {
      var existing = DatabaseModel.getById(SHEET, taskId);
      if (!existing) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy công việc.');
      if (existing.ExtensionStatus !== Constant.EXTENSION_STATUS.PENDING) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Không có yêu cầu gia hạn đang chờ duyệt.');
      }

      var patch = { ExtensionStatus: decision };
      if (decision === Constant.EXTENSION_STATUS.APPROVED) {
        patch.DueDate = existing.ExtensionNewDueDate;
      }

      var updated = DatabaseModel.update(SHEET, taskId, patch);
      addHistory_(taskId, TH.EXTENSION_RESOLVED, existing.ExtensionStatus, decision, actorId, '');
      return updated;
    },

    addAttachment: function (taskId, url, actorId) {
      var existing = DatabaseModel.getById(SHEET, taskId);
      if (!existing) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy công việc.');
      var urls = existing.AttachmentURL ? existing.AttachmentURL.split(',').filter(Boolean) : [];
      urls.push(url);
      var updated = DatabaseModel.update(SHEET, taskId, { AttachmentURL: urls.join(',') });
      addHistory_(taskId, TH.UPDATED, '', 'Thêm file đính kèm', actorId, url);
      return updated;
    },

    delete: function (taskId, actorId) {
      var existing = DatabaseModel.getById(SHEET, taskId);
      if (!existing) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy công việc.');
      var updated = DatabaseModel.update(SHEET, taskId, { Status: TS.CANCELLED });
      addHistory_(taskId, TH.STATUS_CHANGED, existing.Status, TS.CANCELLED, actorId, 'Đã huỷ công việc');
      return updated;
    },

    getSummary: function (filters) {
      var tasks = DatabaseModel.find(SHEET, buildScopeFilter_(filters));
      return {
        totalTask: tasks.length,
        completed: tasks.filter(function (t) { return t.Status === TS.COMPLETED; }).length,
        inProgress: tasks.filter(function (t) { return t.Status === TS.IN_PROGRESS; }).length,
        overdue: tasks.filter(isOverdue_).length
      };
    },

    getStatusDistribution: function (filters) {
      var tasks = DatabaseModel.find(SHEET, buildScopeFilter_(filters));
      var grouped = Helper.groupBy(tasks, function (t) { return t.Status; });
      return Object.keys(grouped).map(function (status) {
        return { label: status, value: grouped[status].length };
      });
    },

    // Trả về {label, value} với label là ID thô (DepartmentID/TeamID/AssigneeID) — Controller tự resolve tên hiển thị.
    getWorkloadByGroup: function (filters, groupBy) {
      var tasks = DatabaseModel.find(SHEET, buildScopeFilter_(filters));
      var keyFn = (groupBy === 'department') ? function (t) { return t.DepartmentID; }
        : (groupBy === 'team') ? function (t) { return t.TeamID; }
        : function (t) { return t.AssigneeID; };
      var grouped = Helper.groupBy(tasks, keyFn);
      return Object.keys(grouped).filter(function (k) { return k; }).map(function (key) {
        return { label: key, value: grouped[key].length };
      });
    },

    // Nhóm 2 cấp DepartmentID -> TeamID kèm số lượng task — phục vụ biểu đồ treemap Dashboard.
    // Trả về ID thô, Controller tự resolve tên phòng ban/team hiển thị.
    getWorkloadByDepartmentAndTeam: function (filters) {
      var tasks = DatabaseModel.find(SHEET, buildScopeFilter_(filters));
      var grouped = Helper.groupBy(tasks, function (t) { return (t.DepartmentID || '') + '|' + (t.TeamID || ''); });
      return Object.keys(grouped).map(function (key) {
        var parts = key.split('|');
        return { departmentId: parts[0], teamId: parts[1], value: grouped[key].length };
      }).filter(function (item) { return item.departmentId; });
    },

    // Trả về {assigneeId: {total, completed}} — dùng để tính tỷ lệ hoàn thành theo nhân viên/vị trí ở Dashboard.
    getCountsByAssignee: function (filters) {
      var tasks = DatabaseModel.find(SHEET, buildScopeFilter_(filters));
      var result = {};
      tasks.forEach(function (t) {
        if (!t.AssigneeID) return;
        if (!result[t.AssigneeID]) result[t.AssigneeID] = { total: 0, completed: 0 };
        result[t.AssigneeID].total++;
        if (t.Status === TS.COMPLETED) result[t.AssigneeID].completed++;
      });
      return result;
    },

    getUpcomingDeadlines: function (filters, limit) {
      var inScope = buildScopeFilter_(filters);
      var tasks = DatabaseModel.find(SHEET, function (t) {
        return inScope(t) && OPEN_STATUSES.indexOf(t.Status) > -1;
      });
      tasks.sort(function (a, b) { return new Date(a.DueDate) - new Date(b.DueDate); });
      return tasks.slice(0, limit || 10);
    }

  };

})();
