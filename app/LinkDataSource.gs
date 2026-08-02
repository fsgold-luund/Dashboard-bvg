/**
 * LinkDataSource.gs — gán SPREADSHEET_ID và ATTACHMENT_FOLDER_ID vào Script Properties bằng code,
 * thay vì phải tự gõ tay trong Project Settings → Script Properties (xem DEPLOYMENT.md mục 4).
 *
 * CHỈ chạy 1 LẦN, thủ công từ trình soạn thảo Apps Script (chọn hàm linkDataSource → Run) — không
 * expose qua Api.gs/Route.gs vì đây là thao tác hạ tầng lúc khởi tạo, cùng quy ước với Setup.gs.
 *
 * QUAN TRỌNG: SPREADSHEET_ID_ dưới đây phải LÀ ID của Google Sheet (lấy từ URL dạng
 * docs.google.com/spreadsheets/d/<ID>/edit), KHÔNG PHẢI Script ID của project này (Script ID nằm ở
 * .clasp.json / URL trình soạn thảo script.google.com/.../edit). Hai loại ID có cùng định dạng
 * (~44 ký tự) nên rất dễ dán nhầm chỗ — hàm này chủ động mở thử bằng SpreadsheetApp/DriveApp
 * TRƯỚC KHI lưu, để nếu ID sai thì báo lỗi ngay tại đây thay vì lưu sai rồi mới vỡ lúc Setup.gs
 * hoặc Dashboard chạy.
 */

var SPREADSHEET_ID_ = '1LnuwDqP5Rhd7kycv2jgvB6sQjKTgykEgklvet2p1AXo';
var ATTACHMENT_FOLDER_ID_ = '1ECXRHHJpKBwIlyAT39wXFsxv0pd_K8rF';

function linkDataSource() {
  var spreadsheet;
  try {
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID_);
  } catch (e) {
    throw new Error(
      'Không mở được Google Sheet với ID "' + SPREADSHEET_ID_ + '". ' +
      'Kiểm tra lại: đây có đúng là ID lấy từ URL Google Sheet (docs.google.com/spreadsheets/d/<ID>/edit) ' +
      'không, hay đang bị nhầm với Script ID? Lỗi gốc: ' + e.message
    );
  }
  Logger.log('✓ Đã mở được Google Sheet: "' + spreadsheet.getName() + '"');

  var folder;
  try {
    folder = DriveApp.getFolderById(ATTACHMENT_FOLDER_ID_);
  } catch (e) {
    throw new Error(
      'Không mở được thư mục Drive với ID "' + ATTACHMENT_FOLDER_ID_ + '". ' +
      'Kiểm tra lại: đây có đúng là ID lấy từ URL thư mục Drive (drive.google.com/drive/folders/<ID>) không? ' +
      'Lỗi gốc: ' + e.message
    );
  }
  Logger.log('✓ Đã mở được thư mục Drive: "' + folder.getName() + '"');

  PropertiesService.getScriptProperties().setProperties({
    SPREADSHEET_ID: SPREADSHEET_ID_,
    ATTACHMENT_FOLDER_ID: ATTACHMENT_FOLDER_ID_
  });

  Logger.log('Đã lưu SPREADSHEET_ID và ATTACHMENT_FOLDER_ID vào Script Properties.');
  Logger.log('Bước tiếp theo: chạy Setup.gs → setupInitialData() để tạo sheet + tài khoản Super Admin ' +
    '(nếu chưa từng chạy), rồi Deploy → Test deployments hoặc mở URL Web App để kiểm tra.');
}
