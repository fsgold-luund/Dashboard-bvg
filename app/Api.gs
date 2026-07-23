/**
 * Api.gs — API Gateway. Điểm vào DUY NHẤT mà client gọi qua google.script.run.
 * Toàn bộ logic xác thực/phân quyền/log nằm ở Middleware — hàm này chỉ chuyển tiếp.
 */

function apiCall(actionName, params, sessionToken) {
  return Middleware.handle(actionName, params, sessionToken);
}
