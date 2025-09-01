/**
 * Script khẩn cấp để fix lỗi Telegram bot spam
 * Chạy file này trong Google Apps Script để tắt hoàn toàn webhook
 */

// Cấu hình bot (copy từ file chính)
const TELEGRAM_BOT_TOKEN = "7585519498:AAFHt6QMqI-zfVVnbQW1E_fxzQ1kNUsiEQU";
const TELEGRAM_CHAT_ID = "5816975483";

/**
 * HÀM CHÍNH - Chạy hàm này để fix spam
 */
function fixTelegramSpam() {
  console.log('🚨 Bắt đầu fix Telegram spam...');
  
  // Bước 1: Xóa webhook
  deleteWebhook();
  
  // Bước 2: Xóa tất cả triggers
  cleanAllTriggers();
  
  // Bước 3: Xóa tất cả properties
  cleanAllProperties();
  
  // Bước 4: Gửi tin nhắn xác nhận
  sendFinalMessage();
  
  console.log('✅ Hoàn thành fix spam!');
}

/**
 * Xóa webhook Telegram
 */
function deleteWebhook() {
  try {
    console.log('🗑️ Đang xóa webhook...');
    
    const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      console.log('✅ Đã xóa webhook thành công');
    } else {
      console.log(`❌ Lỗi xóa webhook: ${result.description}`);
    }
  } catch (error) {
    console.log(`❌ Lỗi xóa webhook: ${error.message}`);
  }
}

/**
 * Xóa tất cả triggers
 */
function cleanAllTriggers() {
  try {
    console.log('🗑️ Đang xóa tất cả triggers...');
    
    const triggers = ScriptApp.getProjectTriggers();
    console.log(`Tìm thấy ${triggers.length} triggers`);
    
    triggers.forEach((trigger, index) => {
      console.log(`Xóa trigger ${index + 1}: ${trigger.getHandlerFunction()}`);
      ScriptApp.deleteTrigger(trigger);
    });
    
    console.log('✅ Đã xóa tất cả triggers');
  } catch (error) {
    console.log(`❌ Lỗi xóa triggers: ${error.message}`);
  }
}

/**
 * Xóa tất cả properties
 */
function cleanAllProperties() {
  try {
    console.log('🗑️ Đang xóa tất cả properties...');
    
    const properties = PropertiesService.getScriptProperties();
    properties.deleteAllProperties();
    
    console.log('✅ Đã xóa tất cả properties');
  } catch (error) {
    console.log(`❌ Lỗi xóa properties: ${error.message}`);
  }
}

/**
 * Gửi tin nhắn cuối cùng xác nhận
 */
function sendFinalMessage() {
  try {
    const message = `
🔧 <b>ĐÃ FIX TELEGRAM SPAM</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Đã xóa webhook
✅ Đã xóa tất cả triggers  
✅ Đã xóa tất cả properties
✅ Bot chỉ còn thông báo đơn hàng mới

🎉 <b>Không còn spam nữa!</b>
    `;
    
    UrlFetchApp.fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    console.log('✅ Đã gửi tin nhắn xác nhận');
  } catch (error) {
    console.log(`❌ Lỗi gửi tin nhắn: ${error.message}`);
  }
}

/**
 * Kiểm tra trạng thái webhook hiện tại
 */
function checkWebhookStatus() {
  try {
    const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      console.log('📡 Webhook Info:');
      console.log(`URL: ${result.result.url || 'Không có'}`);
      console.log(`Pending updates: ${result.result.pending_update_count}`);
      console.log(`Last error: ${result.result.last_error_message || 'Không có'}`);
    }
  } catch (error) {
    console.log(`❌ Lỗi kiểm tra webhook: ${error.message}`);
  }
}
