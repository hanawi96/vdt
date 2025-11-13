-- Schema cho Cloudflare D1 Database
-- Database: vdt (19917e57-ced3-4fc3-adad-368a2e989ea7)

-- LƯU Ý: Bảng orders đã tồn tại, file này chỉ để tham khảo và tạo bảng ctv nếu chưa có

-- Bảng CTV (Cộng Tác Viên) - Tạo nếu chưa có
CREATE TABLE IF NOT EXISTS ctv (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT,
    age INTEGER,
    experience TEXT,
    motivation TEXT,
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Mới',
    commission_rate REAL DEFAULT 0.1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Orders đã tồn tại với schema:
-- CREATE TABLE orders (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     order_id TEXT UNIQUE NOT NULL,
--     order_date TEXT,
--     customer_name TEXT,
--     customer_phone TEXT,
--     address TEXT,
--     products TEXT,
--     total_amount REAL DEFAULT 0,
--     payment_method TEXT,
--     status TEXT,
--     referral_code TEXT,
--     commission REAL DEFAULT 0,
--     ctv_phone TEXT,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (referral_code) REFERENCES ctv(referral_code)
-- );

-- Index để tăng tốc truy vấn
CREATE INDEX IF NOT EXISTS idx_ctv_referral_code ON ctv(referral_code);
CREATE INDEX IF NOT EXISTS idx_ctv_phone ON ctv(phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON orders(referral_code);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_ctv_phone ON orders(ctv_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
