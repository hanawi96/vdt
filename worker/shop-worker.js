// Cloudflare Worker API for Shop Order Management
// Using D1 Database (SQLite on Edge)

export default {
    async fetch(request, env, ctx) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 200,
                headers: corsHeaders,
            });
        }

        try {
            const url = new URL(request.url);
            const path = url.pathname;

            // Route handling
            if (request.method === 'POST' && path === '/api/order/create') {
                const data = await request.json();
                return await createOrder(data, env, corsHeaders);
            }

            // API lấy danh sách sản phẩm từ D1
            if (request.method === 'GET' && path === '/api/products') {
                return await getProducts(env, corsHeaders);
            }

            // API lấy danh sách mã giảm giá từ D1
            if (request.method === 'GET' && path === '/api/discounts') {
                return await getDiscounts(env, corsHeaders);
            }

            // API lấy cấu hình (shipping fee, tax rate, etc.)
            if (request.method === 'GET' && path === '/api/config') {
                return await getConfig(env, corsHeaders);
            }

            return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);

        } catch (error) {
            console.error('Worker error:', error);
            return jsonResponse({
                success: false,
                error: error.message
            }, 500, corsHeaders);
        }
    },
};

// ============================================
// ORDER FUNCTIONS
// ============================================

// Tạo đơn hàng mới - Lưu vào cả D1 và Google Sheets
async function createOrder(data, env, corsHeaders) {
    try {
        // Validate dữ liệu đơn hàng
        if (!data.orderId) {
            return jsonResponse({
                success: false,
                error: 'Thiếu mã đơn hàng'
            }, 400, corsHeaders);
        }

        if (!data.customer || !data.customer.name || !data.customer.phone) {
            return jsonResponse({
                success: false,
                error: 'Thiếu thông tin khách hàng'
            }, 400, corsHeaders);
        }

        if (!data.cart || data.cart.length === 0) {
            return jsonResponse({
                success: false,
                error: 'Giỏ hàng trống'
            }, 400, corsHeaders);
        }

        // Parse các giá trị từ data
        const orderDate = data.orderDate || new Date().toISOString();
        const createdAtUnix = Math.floor(new Date(orderDate).getTime() / 1000);

        // Parse subtotal (tổng tiền sản phẩm)
        const subtotalStr = data.subtotal || '0đ';
        const subtotal = typeof subtotalStr === 'string'
            ? parseInt(subtotalStr.replace(/[^\d]/g, ''))
            : subtotalStr;

        // Lấy chi phí từ bảng cost_config TRƯỚC để dùng cho các tính toán
        const costConfig = await getCostConfig(env);
        const customerShippingFee = costConfig.customer_shipping_fee; // Phí ship khách hàng trả
        const defaultShippingCost = costConfig.default_shipping_cost; // Chi phí ship thực tế của shop

        // Parse shipping fee từ frontend (chỉ để check miễn phí hay không)
        const shippingFeeStr = data.shipping || '0đ';
        const isFreeShipping = typeof shippingFeeStr === 'string' && shippingFeeStr.includes('Miễn phí');
        
        // Phí ship khách trả = customer_shipping_fee (trừ khi miễn phí)
        const shippingFee = isFreeShipping ? 0 : customerShippingFee;
        
        // Chi phí ship thực tế của shop (dùng cho tính toán lợi nhuận)
        const actualShippingCost = defaultShippingCost;

        // Parse discount code từ data.discount
        // Format: "-15.000đ (VDT15K)" hoặc "Không có"
        const discountStr = data.discount || 'Không có';
        let discountCode = null;
        let discountAmount = 0;
        
        if (discountStr && discountStr !== 'Không có' && discountStr.includes('(') && discountStr.includes(')')) {
            const match = discountStr.match(/\(([^)]+)\)/);
            if (match) {
                discountCode = match[1]; // Lấy mã trong ngoặc (VD: "VDT15K")
            }
        }
        
        // Nếu có discount code, lấy discount_value từ database (nguồn tin cậy duy nhất)
        if (discountCode) {
            try {
                const discountInfo = await env.DB.prepare(`
                    SELECT discount_value FROM discounts 
                    WHERE code = ? AND active = 1
                    LIMIT 1
                `).bind(discountCode).first();
                
                if (discountInfo) {
                    discountAmount = discountInfo.discount_value || 0;
                    console.log('✅ Discount from database:', {
                        code: discountCode,
                        amount: discountAmount
                    });
                } else {
                    console.warn('⚠️ Discount code not found or inactive:', discountCode);
                    discountCode = null; // Reset nếu không tìm thấy
                }
            } catch (error) {
                console.error('⚠️ Error fetching discount:', error);
                discountCode = null;
                discountAmount = 0;
            }
        }

        // Parse total amount (tổng cộng cuối cùng - SAU khi trừ discount)
        const totalAmount = data.totalAmount || 0;
        console.log('🔍 DEBUG totalAmount parsing - Step 1:', {
            totalAmount: totalAmount,
            totalAmountType: typeof totalAmount,
            rawValue: data.totalAmount
        });

        const totalAmountNumber = typeof totalAmount === 'string'
            ? parseInt(totalAmount.replace(/[^\d]/g, ''), 10)
            : totalAmount;

        console.log('🔍 DEBUG totalAmount parsing - Step 2:', {
            totalAmountNumber: totalAmountNumber,
            totalAmountNumberType: typeof totalAmountNumber
        });

        // Validate total_amount
        const calculatedTotal = subtotal + shippingFee - discountAmount;
        console.log('💰 Order amounts:', {
            subtotal: subtotal,
            subtotalType: typeof subtotal,
            shippingFee: shippingFee,
            shippingFeeType: typeof shippingFee,
            discount: discountAmount,
            discountType: typeof discountAmount,
            totalFromFrontend: totalAmountNumber,
            totalFromFrontendType: typeof totalAmountNumber,
            calculated: calculatedTotal,
            calculatedType: typeof calculatedTotal,
            difference: totalAmountNumber - calculatedTotal
        });

        // Nếu frontend gửi sai, sử dụng giá trị tính toán
        const finalTotalAmount = Math.abs(totalAmountNumber - calculatedTotal) > 100
            ? calculatedTotal
            : totalAmountNumber;

        console.log('🔍 DEBUG finalTotalAmount:', {
            finalTotalAmount: finalTotalAmount,
            finalTotalAmountType: typeof finalTotalAmount
        });

        // Lấy địa chỉ chi tiết từ frontend (ưu tiên ID từ frontend)
        const addressParts = {
            provinceId: data.customer.province_id || null,
            provinceName: null,
            districtId: data.customer.district_id || null,
            districtName: null,
            wardId: data.customer.ward_id || null,
            wardName: null,
            streetAddress: data.customer.street_address || null
        };
        
        // Nếu có ID, query database để lấy tên
        if (addressParts.provinceId || addressParts.districtId || addressParts.wardId) {
            // Parse từ full address string để lấy tên (fallback)
            const parsedAddress = parseAddress(data.customer.address || '');
            addressParts.provinceName = parsedAddress.provinceName;
            addressParts.districtName = parsedAddress.districtName;
            addressParts.wardName = parsedAddress.wardName;
            if (!addressParts.streetAddress) {
                addressParts.streetAddress = parsedAddress.streetAddress;
            }
        } else {
            // Fallback: parse từ string nếu không có ID
            const parsedAddress = parseAddress(data.customer.address || '');
            Object.assign(addressParts, parsedAddress);
        }

        // Thêm cost_price vào từng sản phẩm trong cart
        const cartWithCostPrice = await Promise.all(data.cart.map(async (item) => {
            // Bỏ qua sản phẩm quà tặng miễn phí
            if (item.price === 'Miễn phí' || item.price === 0) {
                return {
                    ...item,
                    cost_price: 0
                };
            }

            // Lấy cost_price từ database
            const productInfo = await getProductInfo(env, item.name);

            return {
                ...item,
                cost_price: productInfo?.cost_price || 0
            };
        }));

        // Format products thành JSON string (để tương thích với Google Sheets)
        const productsJson = JSON.stringify(cartWithCostPrice);

        // Parse payment method
        const paymentMethod = data.paymentMethod === 'Chuyển khoản ngân hàng' ? 'bank_transfer' : 'cod';

        // Parse referral info
        const referralCode = data.referralCode || null;
        const commission = data.referralCommission || 0;
        const ctvPhone = referralCode ? await getCtvPhone(env, referralCode) : null;

        // Tính toán các giá trị
        // subtotal = tổng tiền sản phẩm
        // shippingFee = phí ship khách trả
        // discountAmount = giảm giá
        // totalAmount = subtotal + shippingFee - discountAmount

        // Tính tổng số sản phẩm (không tính quà tặng miễn phí)
        const totalProducts = data.cart.reduce((sum, item) => {
            if (item.price === 'Miễn phí' || item.price === 0) return sum;
            // Parse quantity sang number để tránh string concatenation
            const quantity = typeof item.quantity === 'string'
                ? parseInt(item.quantity)
                : (item.quantity || 1);
            return sum + quantity;
        }, 0);

        // Tạo packaging_details JSON
        const packagingDetails = {
            per_product: {
                red_string: costConfig.red_string || 1000,
                labor_cost: costConfig.labor_cost || 8000
            },
            per_order: {
                bag_zip: costConfig.bag_zip || 200,
                bag_red: costConfig.bag_red || 850,
                box_shipping: costConfig.box_shipping || 950,
                thank_card: costConfig.thank_card || 1000,
                paper_print: costConfig.paper_print || 150
            },
            total_products: totalProducts,
            per_product_cost: (costConfig.red_string || 1000) + (costConfig.labor_cost || 8000), // Chi phí cho 1 sp
            per_order_cost: (costConfig.bag_zip || 200) +
                (costConfig.bag_red || 850) +
                (costConfig.box_shipping || 950) +
                (costConfig.thank_card || 1000) +
                (costConfig.paper_print || 150),
            total_cost: 0 // Sẽ tính sau
        };

        // Tính tổng chi phí đóng gói
        packagingDetails.total_cost = (packagingDetails.per_product_cost * totalProducts) + packagingDetails.per_order_cost;

        const packagingCost = packagingDetails.total_cost;
        const packagingDetailsJson = JSON.stringify(packagingDetails);

        // Tính thuế dựa trên doanh thu TRƯỚC khi trừ discount (subtotal + shipping)
        const taxRate = costConfig.tax_rate || 0.015; // Lấy từ cost_config, mặc định 1.5%
        const taxableAmount = subtotal + shippingFee; // Doanh thu chịu thuế (TRƯỚC discount)
        const taxAmount = Math.round(taxableAmount * taxRate); // Làm tròn thuế

        // 1. Lưu vào bảng orders
        const orderResult = await env.DB.prepare(`
            INSERT INTO orders (
                order_id, order_date, customer_name, customer_phone, 
                address, products, payment_method, status,
                referral_code, commission, ctv_phone, notes,
                shipping_fee, shipping_cost, packaging_cost, packaging_details,
                tax_amount, tax_rate, total_amount,
                created_at_unix, province_id, province_name, 
                district_id, district_name, ward_id, ward_name, street_address,
                discount_code, discount_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            data.orderId,
            orderDate,
            data.customer.name,
            data.customer.phone,
            data.customer.address || '',
            productsJson,
            paymentMethod,
            'Mới',
            referralCode,
            commission,
            ctvPhone,
            data.customer.notes || '',
            shippingFee, // Phí ship khách trả
            actualShippingCost, // Chi phí ship thực tế
            packagingCost, // Chi phí đóng gói
            packagingDetailsJson, // packaging_details JSON
            taxAmount, // tax_amount (thuế tính trên doanh thu TRƯỚC discount)
            taxRate, // tax_rate (lấy từ cost_config)
            finalTotalAmount, // Tổng tiền cuối cùng (SAU discount)
            createdAtUnix,
            addressParts.provinceId,
            addressParts.provinceName,
            addressParts.districtId,
            addressParts.districtName,
            addressParts.wardId,
            addressParts.wardName,
            addressParts.streetAddress,
            discountCode, // Mã giảm giá
            discountAmount // Số tiền giảm giá
        ).run();

        if (!orderResult.success) {
            throw new Error('Failed to insert order into D1');
        }

        // Lấy ID của order vừa tạo
        const orderIdResult = await env.DB.prepare(`
            SELECT id FROM orders WHERE order_id = ? LIMIT 1
        `).bind(data.orderId).first();

        if (!orderIdResult) {
            throw new Error('Failed to get order ID after insert');
        }

        const orderId = orderIdResult.id;

        // 2. Lưu chi tiết sản phẩm vào bảng order_items
        for (const item of data.cart) {
            // Bỏ qua sản phẩm quà tặng (miễn phí)
            if (item.price === 'Miễn phí' || item.price === 0) {
                continue;
            }

            // Parse giá từ string (nếu có format)
            const productPrice = typeof item.price === 'string'
                ? parseInt(item.price.replace(/[^\d]/g, ''))
                : (item.price || 0);

            // Lấy thông tin sản phẩm từ database để có product_id và cost_price
            const productInfo = await getProductInfo(env, item.name);

            // Nếu không tìm thấy trong database, log warning
            if (!productInfo) {
                console.warn(`⚠️ Product not found in database: ${item.name}`);
            }

            await env.DB.prepare(`
                INSERT INTO order_items (
                    order_id, product_id, product_name, product_price, 
                    product_cost, quantity, size, notes, created_at_unix
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                orderId,
                productInfo?.id || null,
                item.name,
                productPrice,
                productInfo?.cost_price || 0, // Giá vốn từ database
                item.quantity || 1,
                item.weight || null,
                item.notes || null,
                createdAtUnix
            ).run();
        }

        // 3. Lưu thông tin sử dụng mã giảm giá vào bảng discount_usage (nếu có)
        if (discountCode && discountAmount > 0) {
            try {
                // Lấy discount_id từ bảng discounts
                const discountInfo = await env.DB.prepare(`
                    SELECT id FROM discounts WHERE code = ? LIMIT 1
                `).bind(discountCode).first();

                if (discountInfo) {
                    // Debug TRƯỚC khi convert
                    console.log('🔍 DEBUG BEFORE conversion:', {
                        finalTotalAmount: finalTotalAmount,
                        finalTotalAmountType: typeof finalTotalAmount,
                        finalTotalAmountValue: JSON.stringify(finalTotalAmount),
                        discountAmount: discountAmount,
                        discountAmountType: typeof discountAmount,
                        discountAmountValue: JSON.stringify(discountAmount)
                    });

                    // Đảm bảo các giá trị là số nguyên
                    const finalTotalAmountNum = Number(finalTotalAmount);
                    const discountAmountNum = Number(discountAmount);

                    console.log('🔍 DEBUG AFTER Number() conversion:', {
                        finalTotalAmountNum: finalTotalAmountNum,
                        finalTotalAmountNumType: typeof finalTotalAmountNum,
                        discountAmountNum: discountAmountNum,
                        discountAmountNumType: typeof discountAmountNum
                    });

                    const orderAmountBeforeDiscount = finalTotalAmountNum + discountAmountNum;

                    console.log('🔍 DEBUG CALCULATION:', {
                        calculation: `${finalTotalAmountNum} + ${discountAmountNum} = ${orderAmountBeforeDiscount}`,
                        orderAmountBeforeDiscount: orderAmountBeforeDiscount,
                        orderAmountBeforeDiscountType: typeof orderAmountBeforeDiscount
                    });

                    // Debug logging
                    console.log('💳 Discount tracking - FINAL VALUES:', {
                        discountCode: discountCode,
                        orderAmountBeforeDiscount: orderAmountBeforeDiscount,
                        discountAmountNum: discountAmountNum
                    });

                    // Lưu vào bảng discount_usage
                    console.log('🔍 DEBUG VALUES BEING INSERTED:', {
                        discount_id: discountInfo.id,
                        discount_code: discountCode,
                        order_id: data.orderId,
                        customer_name: data.customer.name,
                        customer_phone: data.customer.phone,
                        order_amount: orderAmountBeforeDiscount,
                        order_amount_type: typeof orderAmountBeforeDiscount,
                        discount_amount: discountAmountNum,
                        discount_amount_type: typeof discountAmountNum
                    });

                    await env.DB.prepare(`
                        INSERT INTO discount_usage (
                            discount_id, discount_code, order_id, 
                            customer_name, customer_phone, 
                            order_amount, discount_amount, 
                            used_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    `).bind(
                        discountInfo.id,
                        discountCode,
                        data.orderId,
                        data.customer.name,
                        data.customer.phone,
                        orderAmountBeforeDiscount, // Order amount TRƯỚC khi giảm giá (đã convert sang số)
                        discountAmountNum // Discount amount (đã convert sang số)
                    ).run();

                    // Cập nhật usage_count và total_discount_amount trong bảng discounts
                    console.log('🔍 DEBUG UPDATE discounts:', {
                        discount_id: discountInfo.id,
                        discount_amount_to_add: discountAmountNum,
                        discount_amount_type: typeof discountAmountNum
                    });

                    await env.DB.prepare(`
                        UPDATE discounts 
                        SET usage_count = usage_count + 1,
                            total_discount_amount = total_discount_amount + ?
                        WHERE id = ?
                    `).bind(discountAmountNum, discountInfo.id).run();

                    console.log('✅ Saved discount usage:', discountCode, 'for order:', data.orderId);
                } else {
                    console.warn('⚠️ Discount code not found in database:', discountCode);
                }
            } catch (discountError) {
                console.error('⚠️ Error saving discount usage:', discountError);
                // Không throw error để không ảnh hưởng đến việc tạo đơn hàng
            }
        }

        console.log('✅ Saved order to D1:', data.orderId, 'with', data.cart.length, 'items');
        console.log('💰 Order financials:', {
            subtotal: subtotal,
            shippingFee: shippingFee,
            discount: discountAmount,
            discountCode: discountCode,
            total: totalAmountNumber,
            actualShippingCost: actualShippingCost,
            packagingCost: packagingCost,
            taxRate: taxRate,
            taxAmount: taxAmount,
            commission: commission,
            packagingDetails: packagingDetails
        });

        // 2. Lưu vào Google Sheets (gọi Google Apps Script)
        try {
            const googleScriptUrl = env.GOOGLE_APPS_SCRIPT_URL;

            if (googleScriptUrl) {
                // Chuẩn bị dữ liệu cho Google Sheets
                const sheetsData = {
                    orderId: data.orderId,
                    orderDate: data.orderDate || new Date().toISOString(),
                    customer: {
                        name: data.customer.name,
                        phone: data.customer.phone,
                        address: data.customer.address || '',
                        notes: data.customer.notes || ''
                    },
                    cart: data.cart,
                    total: data.total || `${totalAmountNumber.toLocaleString('vi-VN')}đ`,
                    paymentMethod: data.paymentMethod || 'cod',
                    telegramNotification: env.SECRET_KEY || 'VDT_SECRET_2025_ANHIEN'
                };

                console.log('📤 Sending to Google Sheets:', {
                    orderId: sheetsData.orderId
                });

                const sheetsResponse = await fetch(googleScriptUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(sheetsData)
                });

                const responseText = await sheetsResponse.text();
                console.log('📥 Google Sheets response:', responseText);

                if (sheetsResponse.ok) {
                    console.log('✅ Saved order to Google Sheets');
                } else {
                    console.warn('⚠️ Failed to save to Google Sheets:', sheetsResponse.status, responseText);
                }
            }
        } catch (sheetsError) {
            console.error('⚠️ Google Sheets error:', sheetsError);
            // Không throw error, vì D1 đã lưu thành công
        }

        return jsonResponse({
            success: true,
            message: 'Đơn hàng đã được tạo thành công',
            orderId: data.orderId,
            timestamp: new Date().toISOString()
        }, 200, corsHeaders);

    } catch (error) {
        console.error('Error creating order:', error);
        return jsonResponse({
            success: false,
            error: error.message
        }, 500, corsHeaders);
    }
}

// ============================================
// PRODUCT FUNCTIONS
// ============================================

// Lấy danh sách sản phẩm từ D1 database
async function getProducts(env, corsHeaders) {
    try {
        // Query tất cả sản phẩm đang active
        const result = await env.DB.prepare(`
            SELECT 
                id,
                name,
                price,
                sku,
                description,
                image_url,
                category_id,
                is_active,
                original_price,
                rating,
                purchases,
                stock_quantity,
                cost_price
            FROM products
            WHERE is_active = 1
            ORDER BY id ASC
        `).all();

        if (!result.success) {
            throw new Error('Failed to fetch products from D1');
        }

        // Map dữ liệu từ D1 sang format frontend
        const products = result.results.map(product => ({
            id: product.sku || `product_${product.id}`,
            name: product.name,
            category: getCategoryFromId(product.category_id),
            categories: [getCategoryFromId(product.category_id)],
            price: product.price || 0,
            original_price: product.original_price || null,
            image: product.image_url || './assets/images/product_img/default.webp',
            description: product.description || '',
            rating: product.rating || 0,
            purchases: product.purchases || 0,
            stock_quantity: product.stock_quantity || 0
        }));

        console.log(`✅ Loaded ${products.length} products from D1`);

        return jsonResponse({
            success: true,
            data: products,
            count: products.length
        }, 200, corsHeaders);

    } catch (error) {
        console.error('Error fetching products:', error);
        return jsonResponse({
            success: false,
            error: error.message
        }, 500, corsHeaders);
    }
}

// Helper function: Map category_id sang category string
function getCategoryFromId(categoryId) {
    const categoryMap = {
        8: 'vong_tron',
        9: 'mix_bi_bac',
        10: 'mix_charm_ran',
        11: 'vong_co_gian',
        12: 'mix_day_ngu_sac',
        13: 'mix_hat_bo_de',
        14: 'hat_dau_tam_mai_san',
        15: 'mix_charm_chuong',
        16: 'mix_ho_phach',
        17: 'mix_thanh_gia',
        18: 'mix_hoa_sen',
        19: 'mix_da_do_tu_nhien',
        20: 'mix_chi_mau_cac_loai',
        21: 'mix_the_ten_be',
        22: 'vong_nguoi_lon',
        23: 'san_pham_ban_kem',
        24: 'bi_charm_bac'
    };
    return categoryMap[categoryId] || 'all';
}

// Helper function: Lấy thông tin sản phẩm từ database
async function getProductInfo(env, productName) {
    try {
        const result = await env.DB.prepare(`
            SELECT id, cost_price FROM products 
            WHERE name = ? LIMIT 1
        `).bind(productName).first();

        return result;
    } catch (error) {
        console.error('Error getting product info:', error);
        return null;
    }
}

// Helper function: Lấy số điện thoại CTV từ referral code
async function getCtvPhone(env, referralCode) {
    try {
        const result = await env.DB.prepare(`
            SELECT phone FROM ctv 
            WHERE referral_code = ? LIMIT 1
        `).bind(referralCode).first();

        return result?.phone || null;
    } catch (error) {
        console.error('Error getting CTV phone:', error);
        return null;
    }
}

// Helper function: Parse địa chỉ thành các phần
function parseAddress(fullAddress) {
    // Địa chỉ format: "Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
    // Ví dụ: "123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"

    const parts = fullAddress.split(',').map(p => p.trim());

    return {
        streetAddress: parts[0] || null,
        wardName: parts[1] || null,
        wardId: null, // Cần mapping table để lấy ID
        districtName: parts[2] || null,
        districtId: null, // Cần mapping table để lấy ID
        provinceName: parts[3] || null,
        provinceId: null // Cần mapping table để lấy ID
    };
}

// Helper function: Lấy cấu hình chi phí từ database
async function getCostConfig(env) {
    try {
        const result = await env.DB.prepare(`
            SELECT item_name, item_cost 
            FROM cost_config 
            WHERE is_default = 1
        `).all();

        if (!result.success) {
            console.error('Failed to fetch cost config');
            return getDefaultCostConfig();
        }

        // Convert array to object for easy access
        const config = {};
        result.results.forEach(row => {
            config[row.item_name] = row.item_cost;
        });

        return config;
    } catch (error) {
        console.error('Error getting cost config:', error);
        return getDefaultCostConfig();
    }
}

// Helper function: Trả về cấu hình chi phí mặc định (fallback)
function getDefaultCostConfig() {
    return {
        bag_zip: 200,
        paper_print: 150,
        bag_red: 850,
        box_shipping: 950,
        thank_card: 1000,
        default_shipping_cost: 25000,
        tax_rate: 0.015,
        red_string: 1000,
        labor_cost: 8000
    };
}

// ============================================
// DISCOUNT FUNCTIONS
// ============================================

// Lấy danh sách mã giảm giá từ D1 database
async function getDiscounts(env, corsHeaders) {
    try {
        // Query tất cả mã giảm giá đang active và chưa hết hạn
        const result = await env.DB.prepare(`
            SELECT 
                id,
                code,
                title,
                description,
                type,
                discount_value,
                gift_product_id,
                gift_product_name,
                min_order_amount,
                min_items,
                active,
                visible,
                expiry_date
            FROM discounts
            WHERE active = 1 
            AND (expiry_date IS NULL OR expiry_date >= DATE('now'))
            ORDER BY priority DESC, id ASC
        `).all();

        if (!result.success) {
            throw new Error('Failed to fetch discounts from D1');
        }

        // Map dữ liệu từ D1 sang format frontend (tương thích với discounts.json cũ)
        const discounts = result.results.map(discount => {
            // Xử lý type mapping
            let mappedType = discount.type;
            if (mappedType === 'free_shipping') mappedType = 'shipping';
            if (mappedType === 'fixed_amount') mappedType = 'fixed';

            // Base discount object
            const discountObj = {
                code: discount.code,
                title: discount.title,
                description: discount.description || '',
                type: mappedType,
                minOrder: discount.min_order_amount || 0,
                minItems: discount.min_items || 0,
                expiry: discount.expiry_date ? formatExpiryDate(discount.expiry_date) : null,
                active: discount.active === 1,
                visible: discount.visible === 1
            };

            // Xử lý value dựa trên type
            if (discount.type === 'gift') {
                // Cho gift, value là object chứa thông tin quà tặng
                discountObj.value = {
                    id: discount.gift_product_id,
                    name: discount.gift_product_name
                };
            } else {
                // Cho fixed/percentage/shipping, value là số
                discountObj.value = discount.discount_value || 0;
            }

            return discountObj;
        });

        console.log(`✅ Loaded ${discounts.length} discounts from D1`);

        return jsonResponse({
            success: true,
            data: discounts,
            count: discounts.length
        }, 200, corsHeaders);

    } catch (error) {
        console.error('Error fetching discounts:', error);
        return jsonResponse({
            success: false,
            error: error.message
        }, 500, corsHeaders);
    }
}

// Helper function: Format expiry date từ YYYY-MM-DD sang DD/MM/YYYY
function formatExpiryDate(dateString) {
    if (!dateString) return null;

    try {
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateString;
    } catch (error) {
        return dateString;
    }
}

// ============================================
// CONFIG FUNCTIONS
// ============================================

// Lấy cấu hình hệ thống (shipping fee, tax rate, etc.)
async function getConfig(env, corsHeaders) {
    try {
        const costConfig = await getCostConfig(env);
        
        const config = {
            shipping_fee: costConfig.customer_shipping_fee || 28000,
            tax_rate: costConfig.tax_rate || 0.015,
            packaging: {
                bag_zip: costConfig.bag_zip || 200,
                paper_print: costConfig.paper_print || 150,
                bag_red: costConfig.bag_red || 850,
                box_shipping: costConfig.box_shipping || 950,
                thank_card: costConfig.thank_card || 1000,
                red_string: costConfig.red_string || 1000,
                labor_cost: costConfig.labor_cost || 8000
            }
        };

        console.log('✅ Config loaded:', config);

        return jsonResponse({
            success: true,
            data: config
        }, 200, corsHeaders);

    } catch (error) {
        console.error('Error fetching config:', error);
        return jsonResponse({
            success: false,
            error: error.message
        }, 500, corsHeaders);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function jsonResponse(data, status = 200, corsHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...corsHeaders
        }
    });
}
