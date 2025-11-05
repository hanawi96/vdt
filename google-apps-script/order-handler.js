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

// Lưu trữ message ID đã xử lý để tránh duplicate
const PROCESSED_MESSAGES = new Set();

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
  "Ghi Chú",
  "Mã Referral",
  "Hoa Hồng"
];

// ==================== HÀM CHÍNH ====================

/**
 * Hàm chính xử lý POST request từ website và Telegram webhook
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);

    // Kiểm tra xem đây là webhook từ Telegram hay đơn hàng từ website
    if (requestData.message || requestData.update_id) {
      // Đây là webhook từ Telegram
      return handleTelegramWebhook(requestData);
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
  sheet.setColumnWidth(10, 120); // Mã Referral
  sheet.setColumnWidth(11, 120); // Hoa Hồng
  
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
  // Debug log để kiểm tra referral data
  Logger.log('🔍 REFERRAL DEBUG - Received order data:');
  Logger.log('- referralCode: ' + (orderData.referralCode || 'EMPTY'));
  Logger.log('- referralPartner: ' + (orderData.referralPartner || 'EMPTY'));
  Logger.log('- referralCommission: ' + (orderData.referralCommission || 'EMPTY'));
  Logger.log('- referralCommission type: ' + typeof orderData.referralCommission);

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
    orderData.customer.notes || "",
    orderData.referralCode || "", // Mã Referral
    (orderData.referralCommission && typeof orderData.referralCommission === 'number' && orderData.referralCommission > 0) 
      ? `${orderData.referralCommission.toLocaleString('vi-VN')}đ` 
      : "" // Hoa Hồng
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

  // Thông tin referral (nếu có)
  if (orderData.referralCode && orderData.referralPartner) {
    message += `\n🤝 <b>REFERRAL</b>\n`;
    message += `📋 Mã: <code>${orderData.referralCode}</code>\n`;
    message += `👤 Partner: ${orderData.referralPartner}\n`;
    if (orderData.referralCommission && typeof orderData.referralCommission === 'number' && orderData.referralCommission > 0) {
      message += `💰 Hoa hồng: <b>${orderData.referralCommission.toLocaleString('vi-VN')}đ</b>\n`;
    }
  }

  // Footer
  message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🏪 <i>Vòng Dâu Tằm An Nhiên</i>`;

  return message;
}

// ==================== TELEGRAM BOT ADMIN COMMANDS ====================

/**
 * Xử lý GET request (webhook từ Telegram)
 */
function doGet(e) {
  try {
    // Trả về response đơn giản cho GET request
    return ContentService.createTextOutput("Telegram Bot is running!");
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.message);
  }
}

/**
 * Xử lý tin nhắn từ Telegram
 */
function handleTelegramWebhook(update) {
  try {
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const from = update.message.from;
      const messageId = update.message.message_id;

      Logger.log(`📱 Nhận tin nhắn từ ${chatId}: ${text} (ID: ${messageId})`);

      // QUAN TRỌNG: Kiểm tra message đã xử lý chưa
      const messageKey = `${chatId}_${messageId}`;
      if (PROCESSED_MESSAGES.has(messageKey)) {
        Logger.log(`🔄 Message đã xử lý: ${messageKey}`);
        return ContentService.createTextOutput("OK");
      }

      // Thêm vào danh sách đã xử lý
      PROCESSED_MESSAGES.add(messageKey);

      // QUAN TRỌNG: Bỏ qua tin nhắn từ bot (tránh infinite loop)
      if (from.is_bot) {
        Logger.log(`🤖 Bỏ qua tin nhắn từ bot`);
        return ContentService.createTextOutput("OK");
      }

      // Bỏ qua tin nhắn không phải text hoặc không bắt đầu bằng /
      if (!text || !text.startsWith('/')) {
        Logger.log(`⚠️ Bỏ qua tin nhắn không phải lệnh: ${text}`);
        return ContentService.createTextOutput("OK");
      }

      // Chỉ xử lý tin nhắn từ admin (Chat ID của bạn)
      if (chatId.toString() === TELEGRAM_CHAT_ID) {
        handleAdminCommand(chatId, text);
      } else {
        // Tin nhắn từ người khác
        sendTelegramMessage(chatId, "❌ Bạn không có quyền sử dụng bot này.");
      }
    }

    return ContentService.createTextOutput("OK");
  } catch (error) {
    Logger.log(`❌ Lỗi webhook: ${error.message}`);
    return ContentService.createTextOutput("ERROR");
  }
}

/**
 * Xử lý các lệnh admin
 */
function handleAdminCommand(chatId, command) {
  try {
    // Log để debug
    Logger.log(`🔍 Xử lý lệnh: "${command}" từ chat ${chatId}`);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      sendTelegramMessage(chatId, "❌ Không tìm thấy sheet đơn hàng");
      return;
    }

    // Parse command - xử lý cẩn thận
    const trimmedCommand = command.trim();
    const parts = trimmedCommand.split(' ');
    const cmd = parts[0].toLowerCase();

    Logger.log(`🔍 Command parsed: "${cmd}"`);

    switch(cmd) {
      case '/start':
      case '/help':
        Logger.log(`✅ Executing help command`);
        sendHelpMessage(chatId);
        break;

      case '/today':
        Logger.log(`✅ Executing today command`);
        sendTodayOrders(chatId, sheet);
        break;

      case '/stats':
        Logger.log(`✅ Executing stats command`);
        sendStatistics(chatId, sheet);
        break;

      case '/find':
        if (parts[1]) {
          Logger.log(`✅ Executing find command for: ${parts[1]}`);
          findOrder(chatId, sheet, parts[1]);
        } else {
          sendTelegramMessage(chatId, "❌ Vui lòng nhập mã đơn hàng\nVí dụ: /find VDT001");
        }
        break;

      case '/customer':
        if (parts[1]) {
          Logger.log(`✅ Executing customer command for: ${parts[1]}`);
          findCustomerHistory(chatId, sheet, parts[1]);
        } else {
          sendTelegramMessage(chatId, "❌ Vui lòng nhập số điện thoại\nVí dụ: /customer 0123456789");
        }
        break;

      case '/pending':
        Logger.log(`✅ Executing pending command`);
        sendPendingOrders(chatId, sheet);
        break;

      case '/week':
        Logger.log(`✅ Executing week command`);
        sendWeeklyStats(chatId, sheet);
        break;

      case '/month':
        Logger.log(`✅ Executing month command`);
        sendMonthlyStats(chatId, sheet);
        break;

      case '/recent':
        Logger.log(`✅ Executing recent command`);
        sendRecentOrders(chatId, sheet);
        break;

      default:
        Logger.log(`❌ Unknown command: "${cmd}"`);
        sendTelegramMessage(chatId, `❌ Lệnh không hợp lệ: "${cmd}"\nGõ /help để xem danh sách lệnh.`);
    }

  } catch (error) {
    Logger.log(`❌ Lỗi xử lý lệnh: ${error.message}`);
    sendTelegramMessage(chatId, `❌ Lỗi: ${error.message}`);
  }
}

// ==================== CÁC HÀM XỬ LÝ ADMIN COMMANDS ====================

/**
 * Gửi tin nhắn Telegram đơn giản
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
  } catch (error) {
    Logger.log(`❌ Lỗi gửi tin nhắn: ${error.message}`);
  }
}

/**
 * Gửi tin nhắn hướng dẫn
 */
function sendHelpMessage(chatId) {
  const helpText = `
🤖 <b>LỆNH ADMIN - VÒNG DÂU TẰM AN NHIÊN</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 <b>XEM ĐƠN HÀNG:</b>
/today - Đơn hàng hôm nay
/week - Thống kê tuần này
/month - Thống kê tháng này
/recent - 10 đơn hàng gần nhất
/stats - Thống kê tổng quan

🔍 <b>TÌM KIẾM:</b>
/find VDT001 - Chi tiết đơn hàng
/customer 0123456789 - Lịch sử khách hàng

💡 <b>MẸO:</b> Gõ lệnh bất kỳ để quản lý shop nhanh chóng!
  `;

  sendTelegramMessage(chatId, helpText);
}

/**
 * Xem đơn hàng hôm nay
 */
function sendTodayOrders(chatId, sheet) {
  const today = new Date();
  const todayStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd/MM/yyyy');

  const data = sheet.getDataRange().getValues();
  const orders = data.slice(1);

  // Lọc đơn hàng hôm nay
  const todayOrders = orders.filter(row => {
    const orderDate = new Date(row[1]); // Cột "Ngày Đặt"
    const orderDateStr = Utilities.formatDate(orderDate, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    return orderDateStr === todayStr;
  });

  if (todayOrders.length === 0) {
    sendTelegramMessage(chatId, `📅 <b>HÔM NAY (${todayStr})</b>\n\n📦 Chưa có đơn hàng nào`);
    return;
  }

  // Tính tổng doanh thu
  let totalRevenue = 0;
  todayOrders.forEach(order => {
    const total = order[6]; // Cột "💰 TỔNG KHÁCH PHẢI TRẢ"
    const amount = parseInt(total.toString().replace(/[^\d]/g, ''));
    totalRevenue += amount;
  });

  let message = `📊 <b>ĐƠN HÀNG HÔM NAY (${todayStr})</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📦 Tổng: <b>${todayOrders.length} đơn hàng</b>\n`;
  message += `💰 Doanh thu: <b>${totalRevenue.toLocaleString('vi-VN')}đ</b>\n\n`;
  message += `📋 <b>DANH SÁCH:</b>\n`;

  todayOrders.slice(0, 10).forEach((order, index) => {
    const orderId = order[0];
    const customerName = order[2];
    const total = order[6];
    const payment = order[7];

    message += `${index + 1}. <code>${orderId}</code> - ${customerName}\n`;
    message += `   💰 ${total} - ${payment.replace(/🏦|💰/g, '')}\n\n`;
  });

  if (todayOrders.length > 10) {
    message += `... và ${todayOrders.length - 10} đơn hàng khác\n\n`;
  }

  message += `💡 Gõ <code>/find [mã đơn]</code> để xem chi tiết`;

  sendTelegramMessage(chatId, message);
}

/**
 * Gửi thống kê tổng quan
 */
function sendStatistics(chatId, sheet) {
  const data = sheet.getDataRange().getValues();
  const orders = data.slice(1);

  if (orders.length === 0) {
    sendTelegramMessage(chatId, "📊 Chưa có đơn hàng nào để thống kê");
    return;
  }

  // Thống kê theo ngày
  const today = new Date();
  const todayStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd/MM/yyyy');

  let todayCount = 0;
  let todayRevenue = 0;
  let totalRevenue = 0;

  orders.forEach(order => {
    const orderDate = new Date(order[1]);
    const orderDateStr = Utilities.formatDate(orderDate, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    const total = order[6];
    const amount = parseInt(total.toString().replace(/[^\d]/g, ''));

    totalRevenue += amount;

    if (orderDateStr === todayStr) {
      todayCount++;
      todayRevenue += amount;
    }
  });

  let message = `📊 <b>THỐNG KÊ TỔNG QUAN</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📅 <b>HÔM NAY (${todayStr}):</b>\n`;
  message += `📦 Đơn hàng: <b>${todayCount}</b>\n`;
  message += `💰 Doanh thu: <b>${todayRevenue.toLocaleString('vi-VN')}đ</b>\n\n`;
  message += `📈 <b>TỔNG CỘNG:</b>\n`;
  message += `📦 Tổng đơn hàng: <b>${orders.length}</b>\n`;
  message += `💰 Tổng doanh thu: <b>${totalRevenue.toLocaleString('vi-VN')}đ</b>\n\n`;
  message += `📊 Trung bình: <b>${Math.round(totalRevenue/orders.length).toLocaleString('vi-VN')}đ</b>/đơn`;

  sendTelegramMessage(chatId, message);
}

/**
 * Tìm đơn hàng cụ thể
 */
function findOrder(chatId, sheet, orderId) {
  const data = sheet.getDataRange().getValues();
  const orders = data.slice(1);

  const order = orders.find(row => row[0].toString().toLowerCase() === orderId.toLowerCase());

  if (!order) {
    sendTelegramMessage(chatId, `❌ Không tìm thấy đơn hàng <code>${orderId}</code>`);
    return;
  }

  const orderDate = new Date(order[1]);
  const dateStr = Utilities.formatDate(orderDate, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

  let message = `🔍 <b>CHI TIẾT ĐƠN HÀNG ${order[0]}</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `👤 <b>${order[2]}</b> - <code>${order[3]}</code>\n`;
  message += `📍 ${order[4]}\n`;
  message += `💰 <b>Tổng: ${order[6]}</b>\n`;
  message += `💳 ${order[7]}\n`;
  message += `📅 ${dateStr}\n\n`;
  message += `🛍️ <b>SẢN PHẨM:</b>\n`;
  message += `${order[5]}\n\n`; // Chi tiết sản phẩm

  if (order[8] && order[8].trim()) {
    message += `💬 <b>Ghi chú:</b> <i>${order[8]}</i>\n\n`;
  }

  message += `🔧 <b>HÀNH ĐỘNG:</b>\n`;
  message += `/customer ${order[3]} - Xem lịch sử khách này`;

  sendTelegramMessage(chatId, message);
}

/**
 * Xem lịch sử khách hàng
 */
function findCustomerHistory(chatId, sheet, phone) {
  const data = sheet.getDataRange().getValues();
  const orders = data.slice(1);

  const customerOrders = orders.filter(row => row[3].toString().includes(phone));

  if (customerOrders.length === 0) {
    sendTelegramMessage(chatId, `❌ Không tìm thấy đơn hàng nào của SĐT <code>${phone}</code>`);
    return;
  }

  // Tính tổng
  let totalSpent = 0;
  customerOrders.forEach(order => {
    const amount = parseInt(order[6].toString().replace(/[^\d]/g, ''));
    totalSpent += amount;
  });

  let message = `👤 <b>LỊCH SỬ KHÁCH HÀNG</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📞 SĐT: <code>${phone}</code>\n`;
  message += `👤 Tên: <b>${customerOrders[0][2]}</b>\n`;
  message += `📦 Tổng đơn hàng: <b>${customerOrders.length}</b>\n`;
  message += `💰 Tổng chi tiêu: <b>${totalSpent.toLocaleString('vi-VN')}đ</b>\n\n`;
  message += `📋 <b>DANH SÁCH ĐƠN HÀNG:</b>\n`;

  customerOrders.slice(0, 5).forEach((order, index) => {
    const orderDate = new Date(order[1]);
    const dateStr = Utilities.formatDate(orderDate, Session.getScriptTimeZone(), 'dd/MM');

    message += `${index + 1}. <code>${order[0]}</code> - ${order[6]} (${dateStr})\n`;
  });

  if (customerOrders.length > 5) {
    message += `... và ${customerOrders.length - 5} đơn hàng khác\n`;
  }

  // Đánh giá khách hàng
  if (customerOrders.length >= 3) {
    message += `\n🌟 <b>KHÁCH HÀNG VIP</b> - Đã mua ${customerOrders.length} lần!`;
  }

  sendTelegramMessage(chatId, message);
}

/**
 * Xem đơn hàng chờ xử lý - Cải tiến để hiển thị đơn hàng gần đây
 */
function sendPendingOrders(chatId, sheet) {
  const data = sheet.getDataRange().getValues();
  const orders = data.slice(1);

  if (orders.length === 0) {
    sendTelegramMessage(chatId, "📦 Chưa có đơn hàng nào");
    return;
  }

  // Lấy 10 đơn hàng gần nhất (sắp xếp theo ngày giảm dần)
  const recentOrders = orders
    .sort((a, b) => new Date(b[1]) - new Date(a[1]))
    .slice(0, 10);

  let message = `� <b>10 ĐƠN HÀNG GẦN NHẤT</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  recentOrders.forEach((order, index) => {
    const orderDate = new Date(order[1]);
    const dateStr = Utilities.formatDate(orderDate, Session.getScriptTimeZone(), 'dd/MM HH:mm');

    message += `${index + 1}. <code>${order[0]}</code>\n`;
    message += `   � ${order[2]} - � ${order[3]}\n`;
    message += `   � ${order[6]} - 📅 ${dateStr}\n\n`;
  });

  message += `� Gõ <code>/find [mã đơn]</code> để xem chi tiết`;
  sendTelegramMessage(chatId, message);
}

/**
 * Thống kê tuần này
 */
function sendWeeklyStats(chatId, sheet) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Chủ nhật đầu tuần

  const data = sheet.getDataRange().getValues();
  const orders = data.slice(1);

  // Lọc đơn hàng tuần này
  const weekOrders = orders.filter(row => {
    const orderDate = new Date(row[1]);
    return orderDate >= startOfWeek && orderDate <= today;
  });

  if (weekOrders.length === 0) {
    sendTelegramMessage(chatId, `📅 <b>TUẦN NÀY</b>\n\n📦 Chưa có đơn hàng nào`);
    return;
  }

  // Tính tổng doanh thu
  let totalRevenue = 0;
  weekOrders.forEach(order => {
    const amount = parseInt(order[6].toString().replace(/[^\d]/g, ''));
    totalRevenue += amount;
  });

  const startStr = Utilities.formatDate(startOfWeek, Session.getScriptTimeZone(), 'dd/MM');
  const endStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd/MM/yyyy');

  let message = `📊 <b>THỐNG KÊ TUẦN NÀY (${startStr} - ${endStr})</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📦 Tổng đơn hàng: <b>${weekOrders.length}</b>\n`;
  message += `💰 Doanh thu: <b>${totalRevenue.toLocaleString('vi-VN')}đ</b>\n`;
  message += `📊 Trung bình: <b>${Math.round(totalRevenue/weekOrders.length).toLocaleString('vi-VN')}đ</b>/đơn\n\n`;
  message += `💡 Gõ <code>/today</code> để xem chi tiết hôm nay`;

  sendTelegramMessage(chatId, message);
}

/**
 * Thống kê tháng này
 */
function sendMonthlyStats(chatId, sheet) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const data = sheet.getDataRange().getValues();
  const orders = data.slice(1);

  // Lọc đơn hàng tháng này
  const monthOrders = orders.filter(row => {
    const orderDate = new Date(row[1]);
    return orderDate >= startOfMonth && orderDate <= today;
  });

  if (monthOrders.length === 0) {
    const monthStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'MM/yyyy');
    sendTelegramMessage(chatId, `📅 <b>THÁNG ${monthStr}</b>\n\n📦 Chưa có đơn hàng nào`);
    return;
  }

  // Tính tổng doanh thu
  let totalRevenue = 0;
  monthOrders.forEach(order => {
    const amount = parseInt(order[6].toString().replace(/[^\d]/g, ''));
    totalRevenue += amount;
  });

  const monthStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'MM/yyyy');

  let message = `📊 <b>THỐNG KÊ THÁNG ${monthStr}</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📦 Tổng đơn hàng: <b>${monthOrders.length}</b>\n`;
  message += `💰 Doanh thu: <b>${totalRevenue.toLocaleString('vi-VN')}đ</b>\n`;
  message += `📊 Trung bình: <b>${Math.round(totalRevenue/monthOrders.length).toLocaleString('vi-VN')}đ</b>/đơn\n\n`;
  message += `💡 Gõ <code>/week</code> để xem thống kê tuần`;

  sendTelegramMessage(chatId, message);
}

/**
 * Xem đơn hàng gần đây (alias cho /pending)
 */
function sendRecentOrders(chatId, sheet) {
  const data = sheet.getDataRange().getValues();
  const orders = data.slice(1);

  if (orders.length === 0) {
    sendTelegramMessage(chatId, "📦 Chưa có đơn hàng nào");
    return;
  }

  // Lấy 5 đơn hàng gần nhất
  const recentOrders = orders
    .sort((a, b) => new Date(b[1]) - new Date(a[1]))
    .slice(0, 5);

  let message = `📋 <b>5 ĐƠN HÀNG GẦN NHẤT</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  recentOrders.forEach((order, index) => {
    const orderDate = new Date(order[1]);
    const dateStr = Utilities.formatDate(orderDate, Session.getScriptTimeZone(), 'dd/MM HH:mm');

    message += `${index + 1}. <code>${order[0]}</code>\n`;
    message += `   👤 ${order[2]}\n`;
    message += `   💰 ${order[6]} - 📅 ${dateStr}\n\n`;
  });

  message += `💡 Gõ <code>/find [mã đơn]</code> để xem chi tiết`;
  sendTelegramMessage(chatId, message);
}

/**
 * Hàm xóa tất cả dữ liệu (chỉ dùng khi test)
 */
function clearAllData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (sheet) {
    sheet.clear();
    setupSheetHeaders(sheet);
    Logger.log("🗑️ Đã xóa tất cả dữ liệu và tạo lại headers");
  }
}
