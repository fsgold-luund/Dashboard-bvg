/**
 * TaskController.gs — điều phối CRUD Task, gia hạn, upload file đính kèm.
 */

var TaskController = (function () {

  function toTaskDto_(task) {
    var assignee = task.AssigneeID ? EmployeeModel.getById(task.AssigneeID) : null;
    return {
      taskId: task.TaskID,
      taskCode: task.TaskCode,
      title: task.Title,
      description: task.Description,
      assignerId: task.AssignerID,
      assigneeId: task.AssigneeID,
      assigneeName: assignee ? assignee.FullName : '',
      teamId: task.TeamID,
      departmentId: task.DepartmentID,
      priority: task.Priority,
      status: task.Status,
      progress: Number(task.Progress || 0),
      startDate: Helper.toIsoString(task.StartDate),
      dueDate: Helper.toIsoString(task.DueDate),
      completedDate: Helper.toIsoString(task.CompletedDate),
      extensionStatus: task.ExtensionStatus,
      extensionReason: task.ExtensionReason,
      extensionNewDueDate: Helper.toIsoString(task.ExtensionNewDueDate),
      attachmentUrls: task.AttachmentURL ? task.AttachmentURL.split(',').filter(Boolean) : []
    };
  }

  function toHistoryDto_(h) {
    return {
      action: h.Action, oldValue: h.OldValue, newValue: h.NewValue,
      actorId: h.ActorID, note: h.Note, timestamp: Helper.toIsoString(h.Timestamp)
    };
  }

  function getAttachmentFolder_() {
    return DriveApp.getFolderById(Config.getAttachmentFolderId());
  }

  return {

    list: function (params) {
      var result = TaskModel.listPaged(params.filters || {}, params.page, params.pageSize, params.sortBy, params.sortDir);
      return {
        items: result.items.map(toTaskDto_),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize
      };
    },

    getById: function (params) {
      var task = TaskModel.getById(params.taskId);
      if (!task) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy công việc.');
      var dto = toTaskDto_(task);
      dto.history = task.history.map(toHistoryDto_);
      return dto;
    },

    create: function (params, context) {
      if (!params.assigneeId) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Người nhận việc là bắt buộc.');
      }
      var assignee = EmployeeModel.getById(params.assigneeId);
      if (!assignee) throw new AppError(Constant.ERROR_CODE.NOT_FOUND, 'Không tìm thấy nhân viên được giao việc.');

      var session = context.session;
      // Leader chỉ được giao việc trong team của mình; Manager trở lên (roleLevel nhỏ hơn) không bị giới hạn.
      if (session.roleLevel >= Constant.ROLE_LEVEL[Constant.ROLE_NAME.LEADER] && session.employeeId) {
        var assigner = EmployeeModel.getById(session.employeeId);
        if (assigner && assigner.TeamID && assignee.TeamID !== assigner.TeamID) {
          throw new AppError(Constant.ERROR_CODE.PERMISSION_DENIED, 'Bạn chỉ được giao việc trong team của mình.');
        }
      }

      var task = TaskModel.create({
        title: params.title,
        description: params.description,
        companyId: assignee.CompanyID,
        departmentId: assignee.DepartmentID,
        teamId: assignee.TeamID,
        assignerId: session.employeeId,
        assigneeId: params.assigneeId,
        watcherIds: params.watcherIds,
        priority: params.priority,
        startDate: params.startDate,
        dueDate: params.dueDate,
        attachmentUrls: params.attachmentUrls
      }, session.userId);

      return toTaskDto_(task);
    },

    update: function (params, context) {
      var updated = TaskModel.update(params.taskId, params, context.session.userId);
      return toTaskDto_(updated);
    },

    updateStatus: function (params, context) {
      var updated = TaskModel.updateStatus(params.taskId, params.status, params.progress, context.session.userId);
      return toTaskDto_(updated);
    },

    requestExtension: function (params, context) {
      if (!params.newDueDate) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Hạn hoàn thành mới là bắt buộc.');
      }
      var updated = TaskModel.requestExtension(params.taskId, params.reason, params.newDueDate, context.session.userId);
      return toTaskDto_(updated);
    },

    resolveExtension: function (params, context) {
      if ([Constant.EXTENSION_STATUS.APPROVED, Constant.EXTENSION_STATUS.REJECTED].indexOf(params.decision) === -1) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Quyết định không hợp lệ.');
      }
      var updated = TaskModel.resolveExtension(params.taskId, params.decision, context.session.userId);
      return toTaskDto_(updated);
    },

    uploadAttachment: function (params, context) {
      if (!params.fileBase64 || !params.fileName) {
        throw new AppError(Constant.ERROR_CODE.VALIDATION_ERROR, 'Thiếu file đính kèm.');
      }
      var decoded = Utilities.base64Decode(params.fileBase64);
      var blob = Utilities.newBlob(decoded, params.mimeType || 'application/octet-stream', params.fileName);
      var file = getAttachmentFolder_().createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      var url = file.getUrl();
      TaskModel.addAttachment(params.taskId, url, context.session.userId);
      return { url: url };
    },

    delete: function (params, context) {
      var updated = TaskModel.delete(params.taskId, context.session.userId);
      return toTaskDto_(updated);
    }

  };

})();
