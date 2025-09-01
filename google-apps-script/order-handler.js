/**
 * Google Apps Script cho xử lý đơn hàng Vòng Dâu Tằm An Nhiên
 * File: order-handler.js
 * Tác giả: Augment Agent
 * Ngày tạo: 2025-09-01
 */

// ==================== CẤU HÌNH ====================
const SHEET_NAME = "Đơn Hàng";

// CẤU HÌNH TELEGRAM BOT THÔNG BÁO
const TELEGRAM_BOT_TOKEN = "7585519498:AAFHt6QMqI-zfVVnbQW1E_fxzQ1kNUsiEQU";
const TELEGRAM_CHAT_ID = "5816975483";           // Chat ID của Yên Nguyễn
const SECRET_KEY = "VDT_SECRET_2025_ANHIEN";     // Secret key để bảo mật

// Không cần xử lý webhook nữa - chỉ gửi thông báo đơn hàng

// Định nghĩa cột headers - Tối ưu hóa cho dễ đọc
const HEADERS = [
  "Mã Đơn Hàng",
  "Ngày Đặt",
  "Tên Khách Hàng",
  "Số Điện Thoại",
  "Địa Chỉ",
  "Chi Tiết Sản Phẩm",
  "💰 TỔNG KHÁCH PHẢI TRẢ",
  "Phương Thức Thanh Toán",
  "Ghi Chú"
];

// ==================== HÀM CHÍNH ====================

/**
 * Hàm chính xử lý POST request từ website (chỉ xử lý đơn hàng)
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);

    // Chỉ xử lý đơn hàng từ website, bỏ qua webhook Telegram
    if (requestData.message || requestData.update_id) {
      // Bỏ qua webhook từ Telegram để tránh loop
      Logger.log('🚫 Bỏ qua webhook Telegram');
      return ContentService.createTextOutput("OK");
    } else {
      // Đây là đơn hàng từ website
      return handleOrderFromWebsite(requestData);
    }

  } catch (error) {
    Logger.log(`❌ LỖI XỬ LÝ REQUEST: ${error.message}`);
    return createJsonResponse({
      result: 'error',
      message: `Lỗi xử lý request: ${error.message}`
    });
  }
}

/**
 * Xử lý đơn hàng từ website
 */
function handleOrderFromWebsite(orderData) {
  try {
    // Kiểm tra và khởi tạo sheet
    const sheet = initializeSheet();

    // Validate dữ liệu
    validateOrderData(orderData);

    // Format và thêm đơn hàng vào sheet
    addOrderToSheet(sheet, orderData);

    // Gửi thông báo Telegram (chỉ khi có secret key đúng)
    if (orderData.telegramNotification === SECRET_KEY) {
      sendTelegramNotification(orderData);
    }

    // Trả về kết quả thành công
    return createJsonResponse({
      result: 'success',
      message: 'Đơn hàng đã được ghi nhận thành công!',
      data: {
        orderId: orderData.orderId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    Logger.log(`❌ LỖI XỬ LÝ ĐƠN HÀNG: ${error.message}`);
    return createJsonResponse({
      result: 'error',
      message: `Lỗi xử lý đơn hàng: ${error.message}`
    });
  }
}

// ==================== HÀM HỖ TRỢ ====================

/**
 * Khởi tạo và kiểm tra sheet
 */
function initializeSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  // Tạo sheet mới nếu chưa có
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    Logger.log(`✅ Đã tạo sheet mới: ${SHEET_NAME}`);
  }
  
  // Thêm headers nếu sheet trống
  if (sheet.getLastRow() === 0) {
    setupSheetHeaders(sheet);
  }
  
  return sheet;
}

/**
 * Thiết lập headers và format cho sheet
 */
function setupSheetHeaders(sheet) {
  // Thêm dòng headers
  sheet.appendRow(HEADERS);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setBackground("#4F46E5") // Màu xanh đậm
    .setFontColor("#FFFFFF")  // Chữ trắng
    .setFontSize(11);
  
  // Highlight cột tổng tiền
  const totalColumn = HEADERS.indexOf("💰 TỔNG KHÁCH PHẢI TRẢ") + 1;
  sheet.getRange(1, totalColumn)
    .setBackground("#F59E0B") // Màu vàng
    .setFontColor("#000000"); // Chữ đen
  
  // Thiết lập độ rộng cột
  sheet.setColumnWidth(1, 120);  // Mã đơn hàng
  sheet.setColumnWidth(2, 100);  // Ngày đặt
  sheet.setColumnWidth(3, 150);  // Tên khách hàng
  sheet.setColumnWidth(4, 120);  // Số điện thoại
  sheet.setColumnWidth(5, 250);  // Địa chỉ
  sheet.setColumnWidth(6, 300);  // Chi tiết sản phẩm
  sheet.setColumnWidth(7, 150);  // Tổng tiền
  sheet.setColumnWidth(8, 150);  // Phương thức thanh toán
  sheet.setColumnWidth(9, 200);  // Ghi chú
  
  Logger.log("✅ Đã thiết lập headers và format cho sheet");
}

/**
 * Validate dữ liệu đơn hàng
 */
function validateOrderData(orderData) {
  if (!orderData.orderId) throw new Error("Thiếu mã đơn hàng");
  if (!orderData.customer?.name) throw new Error("Thiếu tên khách hàng");
  if (!orderData.customer?.phone) throw new Error("Thiếu số điện thoại");
  if (!orderData.cart || orderData.cart.length === 0) throw new Error("Giỏ hàng trống");
  if (!orderData.total) throw new Error("Thiếu tổng tiền");
}

/**
 * Format chi tiết sản phẩm thành chuỗi đẹp
 */
function formatProductDetails(cartItems) {
  if (!cartItems || cartItems.length === 0) return "Không có sản phẩm";

  let result = "";

  cartItems.forEach((item, index) => {
    result += `▪ ${item.name}\n`;
    result += `   • SL: ${item.quantity}`;

    // Thêm thông tin cân nặng nếu có
    if (item.weight && item.weight !== 'Không có') {
      result += ` | Cân nặng: ${item.weight}`;
    }

    // Thêm ghi chú sản phẩm nếu có
    if (item.notes && item.notes.trim()) {
      result += `\n   📝 Ghi chú SP: ${item.notes.trim()}`;
    }

    // Thêm dòng trống giữa các sản phẩm (trừ sản phẩm cuối)
    if (index < cartItems.length - 1) {
      result += "\n\n";
    }
  });

  return result;
}

/**
 * Thêm đơn hàng vào sheet
 */
function addOrderToSheet(sheet, orderData) {
  // Format chi tiết sản phẩm
  const productDetails = formatProductDetails(orderData.cart);
  
  // Tạo dòng dữ liệu mới
  const newRow = [
    orderData.orderId,
    new Date(orderData.orderDate),
    orderData.customer.name,
    orderData.customer.phone,
    orderData.customer.address,
    productDetails,
    orderData.total, // TỔNG KHÁCH PHẢI TRẢ
    getPaymentMethodText(orderData.paymentMethod),
    orderData.customer.notes || ""
  ];
  
  // Thêm vào sheet
  const newRowIndex = sheet.getLastRow() + 1;
  sheet.appendRow(newRow);
  
  // Format dòng mới
  formatNewOrderRow(sheet, newRowIndex);
  
  Logger.log(`✅ Đã thêm đơn hàng ${orderData.orderId} vào sheet`);
}

/**
 * Format dòng đơn hàng mới
 */
function formatNewOrderRow(sheet, rowIndex) {
  const range = sheet.getRange(rowIndex, 1, 1, HEADERS.length);
  
  // Format chung
  range
    .setVerticalAlignment("top")
    .setWrap(true)
    .setBorder(true, true, true, true, true, true);
  
  // Highlight cột tổng tiền
  const totalColumn = HEADERS.indexOf("💰 TỔNG KHÁCH PHẢI TRẢ") + 1;
  sheet.getRange(rowIndex, totalColumn)
    .setBackground("#FEF3C7") // Nền vàng nhạt
    .setFontWeight("bold")
    .setFontColor("#92400E"); // Chữ vàng đậm
}

/**
 * Chuyển đổi payment method thành text dễ đọc
 */
function getPaymentMethodText(paymentMethod) {
  switch(paymentMethod) {
    case 'cod':
      return "💰 COD (Thanh toán khi nhận)";
    case 'bank_transfer':
      return "🏦 Chuyển khoản ngân hàng";
    default:
      return paymentMethod || "Không xác định";
  }
}

/**
 * Tạo JSON response chuẩn
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== HÀM TIỆN ÍCH ====================

/**
 * Hàm test để kiểm tra script
 */
function testScript() {
  const testData = {
    orderId: "TEST-001",
    orderDate: new Date().toISOString(),
    customer: {
      name: "Nguyễn Thị Test",
      phone: "0123456789",
      address: "123 Test Street, Test City",
      notes: "Giao hàng buổi chiều"
    },
    cart: [
      {
        name: "Vòng Dâu Tằm Cao Cấp",
        quantity: 2,
        price: "150.000đ",
        weight: "18kg (+20k)",
        notes: "Làm cẩn thận"
      },
      {
        name: "Vòng Mix Bạc",
        quantity: 1,
        price: "200.000đ", 
        weight: "12kg",
        notes: ""
      }
    ],
    total: "520.000đ",
    paymentMethod: "cod"
  };
  
  try {
    const sheet = initializeSheet();
    addOrderToSheet(sheet, testData);
    Logger.log("✅ Test thành công!");
  } catch (error) {
    Logger.log(`❌ Test thất bại: ${error.message}`);
  }
}

/**
 * Gửi thông báo Telegram đơn hàng mới
 */
function sendTelegramNotification(orderData) {
  try {
    // Kiểm tra cấu hình
    if (TELEGRAM_BOT_TOKEN === "YOUR_BOT_TOKEN_HERE" || TELEGRAM_CHAT_ID === "YOUR_CHAT_ID_HERE") {
      Logger.log("⚠️ Chưa cấu hình Telegram Bot Token và Chat ID");
      return;
    }

    // Tạo nội dung tin nhắn
    const message = createTelegramMessage(orderData);

    // Gửi tin nhắn qua Telegram API
    const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      Logger.log(`� Đã gửi thông báo Telegram cho đơn hàng ${orderData.orderId}`);
    } else {
      Logger.log(`❌ Lỗi Telegram API: ${result.description}`);
    }

  } catch (error) {
    Logger.log(`❌ Lỗi gửi Telegram: ${error.message}`);
    // Không throw error để không ảnh hưởng đến việc lưu đơn hàng
  }
}

/**
 * Tạo nội dung tin nhắn Telegram
 */
function createTelegramMessage(orderData) {
  // Header
  let message = `🔔 <b>ĐƠN HÀNG MỚI</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Thông tin đơn hàng
  message += `📋 <b>THÔNG TIN ĐƠN HÀNG</b>\n`;
  message += `🆔 Mã đơn: <code>${orderData.orderId}</code>\n`;
  message += `📅 Thời gian: ${new Date(orderData.orderDate).toLocaleString('vi-VN')}\n`;
  message += `💰 <b>Tổng tiền: ${orderData.total}</b>\n`;
  message += `💳 Thanh toán: ${getPaymentMethodText(orderData.paymentMethod).replace(/🏦|💰/g, '')}\n\n`;

  // Thông tin khách hàng
  message += `👤 <b>KHÁCH HÀNG</b>\n`;
  message += `📝 Tên: ${orderData.customer.name}\n`;
  message += `📞 SĐT: <code>${orderData.customer.phone}</code>\n`;
  message += `📍 Địa chỉ: ${orderData.customer.address}\n`;
  if (orderData.customer.notes && orderData.customer.notes.trim()) {
    message += `💬 Ghi chú: <i>${orderData.customer.notes.trim()}</i>\n`;
  }
  message += `\n`;

  // Chi tiết sản phẩm
  message += `🛍️ <b>CHI TIẾT SẢN PHẨM</b>\n`;
  orderData.cart.forEach((item, index) => {
    message += `${index + 1}. <b>${item.name}</b>\n`;
    message += `   • SL: ${item.quantity}`;

    if (item.weight && item.weight !== 'Không có') {
      message += ` | Cân nặng: ${item.weight}`;
    }
    message += `\n`;

    if (item.notes && item.notes.trim()) {
      message += `   📝 <i>${item.notes.trim()}</i>\n`;
    }

    if (index < orderData.cart.length - 1) {
      message += `\n`;
    }
  });

  // Footer
  message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🏪 <i>Vòng Dâu Tằm An Nhiên</i>`;

  return message;
}

// ==================== TELEGRAM NOTIFICATION ONLY ====================

/**
 * Xử lý GET request - chỉ trả về status
 */
function doGet() {
  return ContentService.createTextOutput("VDT Order Notification Bot is running!");
}

/**
 * Gửi tin nhắn Telegram đơn giản (chỉ cho thông báo đơn hàng)
 */
function sendTelegramMessage(chatId, message) {
  try {
    UrlFetchApp.fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    Logger.log(`✅ Đã gửi thông báo đơn hàng`);
  } catch (error) {
    Logger.log(`❌ Lỗi gửi tin nhắn: ${error.message}`);
  }
}

// ==================== HÀM HỖ TRỢ CUỐI ====================

// Đã xóa tất cả hàm admin commands - chỉ giữ thông báo đơn hàng mới

// ==================== HÀM QUẢN LÝ WEBHOOK (CHỈ ĐỂ DEBUG) ====================

/**
 * Hàm xóa webhook để ngăn chặn spam (chạy thủ công khi cần)
 */
function deleteWebhook() {
  try {
    const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`);
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
      Logger.log('✅ Đã xóa webhook thành công');
      sendTelegramMessage(TELEGRAM_CHAT_ID, '🗑️ Đã xóa webhook - bot sẽ chỉ gửi thông báo đơn hàng');
    } else {
      Logger.log(`❌ Lỗi xóa webhook: ${result.description}`);
    }
  } catch (error) {
    Logger.log(`❌ Lỗi xóa webhook: ${error.message}`);
  }
}

/**
 * Kiểm tra và xóa tất cả triggers có thể gây spam
 */
function checkAndCleanTriggers() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    Logger.log(`🔍 Tìm thấy ${triggers.length} triggers:`);

    triggers.forEach((trigger, index) => {
      Logger.log(`${index + 1}. ${trigger.getHandlerFunction()} - ${trigger.getTriggerSource()} - ${trigger.getEventType()}`);

      // Xóa các trigger liên quan đến Telegram
      if (trigger.getHandlerFunction().includes('telegram') ||
          trigger.getHandlerFunction().includes('Help') ||
          trigger.getHandlerFunction().includes('send')) {
        Logger.log(`🗑️ Xóa trigger: ${trigger.getHandlerFunction()}`);
        ScriptApp.deleteTrigger(trigger);
      }
    });

    Logger.log('✅ Đã kiểm tra và dọn dẹp triggers');

  } catch (error) {
    Logger.log(`❌ Lỗi kiểm tra triggers: ${error.message}`);
  }
}

/**
 * Hàm khẩn cấp - tắt hoàn toàn bot để ngăn spam
 */
function emergencyStopBot() {
  try {
    // 1. Xóa webhook
    deleteWebhook();

    // 2. Xóa tất cả triggers
    checkAndCleanTriggers();

    // 3. Xóa tất cả properties
    const properties = PropertiesService.getScriptProperties();
    properties.deleteAllProperties();

    Logger.log('🚨 KHẨN CẤP: Đã tắt hoàn toàn bot');

  } catch (error) {
    Logger.log(`❌ Lỗi tắt bot: ${error.message}`);
  }
}
