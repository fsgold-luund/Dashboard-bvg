/**
 * Main.gs — Entry Point của Web App.
 *
 * Kiến trúc SPA trong 1 trang: doGet luôn trả về app/views/index.html — file này include sẵn
 * (ẩn/hiện bằng CSS) toàn bộ fragment login/sidebar/header/footer/task/employee/...
 * Lý do: Apps Script webapp không có cookie/session phía server cho mỗi doGet request, nên
 * việc quyết định hiển thị gì (login hay dashboard) phải do client JS làm sau khi gọi
 * auth.getSession bằng sessionToken lưu trong localStorage — không thể quyết định đúng lúc
 * doGet chạy trên server. Điều hướng giữa các module (task/employee/...) diễn ra client-side,
 * không reload trang — đáp ứng yêu cầu UX "loading dưới 2 giây".
 */

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('app/views/index');
  return template.evaluate()
    .setTitle('Hệ thống quản trị công việc')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/apps_script_48dp.png')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Dùng trong template HTML: <?!= include('app/views/components/modal') ?>
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
