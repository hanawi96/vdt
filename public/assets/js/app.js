document.addEventListener('alpine:init', () => {
    Alpine.data('shop', () => ({
        // --- CẤU HÌNH PHÍ SHIP (Thay đổi ở đây) ---
        SHIPPING_FEE: 0, // Đặt 0 = miễn phí, hoặc số tiền như 30000 = 30,000đ

        // --- STATE ---
        view: 'products', // 'categories', 'products', or 'cart'
        categories: [],
        products: [],
        shopInfo: { stats: {} }, // Add shopInfo with a default stats object
        cart: Alpine.$persist([]).as('shoppingCart'),
        currentCategory: { id: 'all', name: 'Tất cả sản phẩm', description: 'Khám phá tất cả sản phẩm độc đáo của An Nhiên.' },
        activeFilter: 'best_selling', // 'best_selling', 'newest', 'top_rated'
        visibleProductCount: 10, // Số sản phẩm hiển thị ban đầu
        productsPerLoad: 10, // Số sản phẩm tải thêm mỗi lần
        loading: true,
        error: null,
        isSubmitting: false,
        searchQuery: '', // Từ khóa đang gõ
        activeSearchQuery: '', // Từ khóa đã được áp dụng để lọc

        // --- MODAL STATES ---
        isImageModalOpen: false,
        currentImage: '',
        isAlertModalOpen: false,
        alertModalMessage: '',
        alertModalType: 'success', // 'success' or 'error'
        isConfirmModalOpen: false,
        isSuccessModalOpen: false,
        lastOrderId: '', // Lưu mã đơn hàng cuối cùng để hiển thị
        isBankTransferModalOpen: false,

        // --- SOCIAL PROOF NOTIFICATION ---
        notification: {
            visible: false,
            message: ''
        },

        // Discount properties
        discounts: [], // Danh sách mã giảm giá hợp lệ
        discountCode: '',
        appliedDiscountCode: '',
        discountAmount: 0,
        discountError: '',
        freeShipping: false, // Trạng thái miễn phí ship

        // --- CUSTOMER INFO & ADDRESS ---
        productNotes: Alpine.$persist({}).as('productNotes'), // Lưu ghi chú cho từng sản phẩm
        customer: Alpine.$persist({ name: '', phone: '', address: '', notes: '' }).as('customerInfo'),
        paymentMethod: 'cod', // 'cod' or 'bank_transfer'
        addressData: [],
        selectedProvince: Alpine.$persist('').as('selectedProvince'),
        selectedDistrict: Alpine.$persist('').as('selectedDistrict'),
        selectedWard: Alpine.$persist('').as('selectedWard'),
        streetAddress: Alpine.$persist('').as('streetAddress'),

        // --- LIFECYCLE ---
        init() {
            this.loadData();
            this.startNotificationLoop();

            this.$watch('selectedProvince', () => {
                this.selectedDistrict = '';
                this.selectedWard = '';
            });

            this.$watch('selectedDistrict', () => {
                this.selectedWard = '';
            });

            this.$watch('selectedWard', () => this.updateFullAddress());
            this.$watch('streetAddress', () => this.updateFullAddress());




            // Theo dõi sự thay đổi ghi chú trong giỏ hàng và lưu lại
            this.$watch('cart', (newCart) => {
                newCart.forEach(item => {
                    if (item.weight) { // Chỉ lưu nếu có ghi chú
                        this.productNotes[item.id] = item.weight;
                    }
                });
            }, { deep: true });

            // Xác thực dữ liệu giỏ hàng từ localStorage để xử lý dữ liệu cũ
            if (this.cart.length > 0) {
                const uniqueIds = new Set(this.cart.map(item => item.id));
                if (uniqueIds.size < this.cart.length) {
                    console.warn('Phát hiện dữ liệu giỏ hàng không hợp lệ (phiên bản cũ). Đang tự động xóa...');
                    this.cart = []; // Xóa giỏ hàng, $persist sẽ tự động cập nhật localStorage
                }
            }
        },

        // --- HELPERS ---
        generateOrderId() {
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let randomPart = '';
            for (let i = 0; i < 3; i++) {
                randomPart += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return `AN${year}${month}${day}${randomPart}`;
        },

        formatCurrency(value) {
            if (typeof value !== 'number') return value;
            return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        },

        // Hiển thị modal thông báo tùy chỉnh
        showAlert(message, type = 'success') {
            this.alertModalMessage = message;
            this.alertModalType = type;
            this.isAlertModalOpen = true;
            setTimeout(() => {
                this.isAlertModalOpen = false;
            }, 3000); // Tăng thời gian hiển thị một chút
        },

        // --- DATA FETCHING ---
        async loadData() {
            this.loading = true;
            this.error = null;
            try {
                const [catRes, prodRes, infoRes, addressRes, discountRes] = await Promise.all([
                    fetch('./data/categories.json'),
                    fetch('./data/products.json'),
                    fetch('./data/shop-info.json'),
                    fetch('./data/vietnamAddress.json'),
                    fetch('./data/discounts.json') // Tải file mã giảm giá
                ]);
                if (!catRes.ok) throw new Error('Không thể tải danh mục.');
                if (!prodRes.ok) throw new Error('Không thể tải sản phẩm.');
                if (!infoRes.ok) throw new Error('Không thể tải thông tin shop.');
                if (!addressRes.ok) throw new Error('Không thể tải dữ liệu địa chỉ.');
                if (!discountRes.ok) throw new Error('Không thể tải mã giảm giá.');

                const categoryData = await catRes.json();
                this.categories = [{ id: 'all', name: 'Tất cả' }, ...categoryData];
                this.products = await prodRes.json();
                this.shopInfo = await infoRes.json();
                this.addressData = await addressRes.json();
                this.discounts = await discountRes.json(); // Lưu mã giảm giá

                // --- TÍNH TOÁN CHỈ SỐ THỐNG KÊ ĐỘNG ---
                if (this.products.length > 0) {
                    const totalSales = this.products.reduce((sum, product) => sum + (product.purchases || 0), 0);
                    const totalRatingSum = this.products.reduce((sum, product) => sum + (product.rating || 0), 0);
                    const productsWithRating = this.products.filter(p => p.rating > 0).length;
                    const averageRating = productsWithRating > 0 ? (totalRatingSum / productsWithRating).toFixed(1) : 0;

                    // Gộp các chỉ số mới vào shopInfo.stats
                    this.shopInfo.stats = {
                        ...this.shopInfo.stats,
                        products: this.products.length, // Ghi đè số sản phẩm bằng số lượng thực tế
                        totalSales: totalSales,
                        averageRating: averageRating
                    };
                }

            } catch (error) {
                console.error('Lỗi tải dữ liệu:', error);
                this.error = error.message;
            } finally {
                this.loading = false;
            }
        },

        // --- COMPUTED ---
        _fullProductList() {
            if (!this.currentCategory) return [];

            let filteredByCategory = this.currentCategory.id === 'all'
                ? this.products
                : this.products.filter(p => p.category === this.currentCategory.id);

            // Lọc sản phẩm theo từ khóa tìm kiếm đã áp dụng
            let searchedProducts = filteredByCategory;
            if (this.activeSearchQuery !== '') {
                const lowerCaseQuery = this.activeSearchQuery.toLowerCase();
                searchedProducts = filteredByCategory.filter(p =>
                    p.name.toLowerCase().includes(lowerCaseQuery)
                );
            }

            // Tạo một bản sao để sắp xếp mà không ảnh hưởng đến mảng gốc
            let sortedProducts = [...searchedProducts];

            // Áp dụng logic sắp xếp dựa trên bộ lọc đang hoạt động
            switch (this.activeFilter) {
                case 'best_selling':
                    sortedProducts.sort((a, b) => b.purchases - a.purchases);
                    break;
                case 'newest':
                    // Giả định sản phẩm mới nhất được thêm vào cuối file JSON, nên chúng ta đảo ngược lại
                    sortedProducts.reverse();
                    break;
                case 'top_rated':
                    sortedProducts.sort((a, b) => b.rating - a.rating);
                    break;
            }

            return sortedProducts;
        },

        filteredProducts() {
            return this._fullProductList().slice(0, this.visibleProductCount);
        },

        canLoadMore() {
            return this.visibleProductCount < this._fullProductList().length;
        },

        // Đếm số sản phẩm trong một danh mục
        getProductCount(categoryId) {
            return this.products.filter(p => p.category === categoryId).length;
        },

        getCategoryPurchases(categoryId) {
            const productsToSum = categoryId === 'all'
                ? this.products
                : this.products.filter(p => p.category === categoryId);

            const totalPurchases = productsToSum.reduce((total, product) => total + (product.purchases || 0), 0);

            if (totalPurchases > 1000) {
                // Làm tròn đến 1 chữ số thập phân và thay dấu . bằng ,
                const thousands = (totalPurchases / 1000).toFixed(1);
                return thousands.includes('.0') ? `${Math.round(totalPurchases / 1000)}k` : thousands.replace('.', ',') + 'k';
            }
            return totalPurchases;
        },
        cartSubtotal() {
            return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        },
        shippingFee() {
            return this.freeShipping ? 0 : this.SHIPPING_FEE;
        },
        cartTotal() {
            const total = this.cartSubtotal() + this.shippingFee() - this.discountAmount;
            return total > 0 ? total : 0;
        },

        // --- ADDRESS COMPUTED PROPERTIES ---
        get provinces() {
            return this.addressData.map(p => ({ Id: p.Id, Name: p.Name }));
        },

        get districts() {
            if (!this.selectedProvince) return [];
            const province = this.addressData.find(p => p.Id === this.selectedProvince);
            return province ? province.Districts.map(d => ({ Id: d.Id, Name: d.Name })) : [];
        },

        get wards() {
            if (!this.selectedProvince || !this.selectedDistrict) return [];
            const province = this.addressData.find(p => p.Id === this.selectedProvince);
            if (!province) return [];
            const district = province.Districts.find(d => d.Id === this.selectedDistrict);
            return district ? district.Wards.map(w => ({ Id: w.Id, Name: w.Name })) : [];
        },

        // --- ADDRESS HELPER ---
        updateFullAddress() {
            if (this.selectedProvince && this.selectedDistrict && this.selectedWard) {
                const provinceName = this.provinces.find(p => p.Id === this.selectedProvince)?.Name || '';
                const districtName = this.districts.find(d => d.Id === this.selectedDistrict)?.Name || '';
                const wardName = this.wards.find(w => w.Id === this.selectedWard)?.Name || '';

                // Combine them, ensuring no empty parts create extra commas
                const fullAddress = [this.streetAddress, wardName, districtName, provinceName].filter(Boolean).join(', ');
                this.customer.address = fullAddress;
            } else {
                this.customer.address = ''; // Clear if not fully selected
            }
        },

        // --- VIEW LOGIC ---
        performSearch() {
            this.activeSearchQuery = this.searchQuery.trim();
            this.visibleProductCount = 10; // Reset lại danh sách sản phẩm

            // Chỉ cuộn khi có từ khóa được tìm
            if (this.activeSearchQuery) {
                this.$nextTick(() => {
                    const element = document.getElementById('product-list-anchor');
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            }
        },

        loadMoreProducts() {
            this.visibleProductCount += this.productsPerLoad;
        },

        selectCategory(category) {
            this.visibleProductCount = 10; // Reset lại khi chọn danh mục mới
            this.currentCategory = category;
            this.searchQuery = ''; // Xóa từ khóa đang gõ
            this.activeSearchQuery = ''; // Xóa từ khóa đã tìm
            this.view = 'products';
            window.scrollTo(0, 0);
        },

        backToCategories() {
            this.selectCategory({ id: 'all', name: 'Tất cả sản phẩm', description: 'Khám phá tất cả sản phẩm độc đáo của An Nhiên.' });
            this.view = 'products'; // Luôn ở view products
        },

        // --- IMAGE MODAL LOGIC ---
        openImageModal(imageUrl) {
            this.currentImage = imageUrl;
            this.isImageModalOpen = true;
            document.body.style.overflow = 'hidden';
        },

        closeImageModal() {
            this.isImageModalOpen = false;
            setTimeout(() => { this.currentImage = ''; }, 300);
            document.body.style.overflow = 'auto';
        },

        // --- CART LOGIC ---
        addToCart(product) {
            // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
            const existingItem = this.cart.find(item => item.id === product.id);
            if (existingItem) {
                // Nếu có, chỉ tăng số lượng
                existingItem.quantity++;
            } else {
                // Nếu chưa có, thêm mới và tự động điền ghi chú đã lưu
                const savedNote = this.productNotes[product.id] || '';
                this.cart.push({ ...product, quantity: 1, weight: savedNote });
            }
            this.showAlert('Đã thêm thành công sản phẩm vào giỏ hàng');
        },
        removeFromCart(productId) {
            this.cart = this.cart.filter(item => item.id !== productId);
            if (this.cart.length === 0) {
                this.resetDiscount();
            }
        },

        // Tăng giảm số lượng sản phẩm
        increaseQuantity(productId) {
            const item = this.cart.find(item => item.id === productId);
            if (item) item.quantity++;
        },
        decreaseQuantity(productId) {
            const item = this.cart.find(item => item.id === productId);
            if (item && item.quantity > 1) {
                item.quantity--;
            } else if (item) {
                this.removeFromCart(productId);
            }
        },
        increaseQuantity(productId) {
            const item = this.cart.find(item => item.id === productId);
            if (item) item.quantity++;
        },
        decreaseQuantity(productId) {
            const item = this.cart.find(item => item.id === productId);
            if (item && item.quantity > 1) {
                item.quantity--;
            } else if (item && item.quantity === 1) {
                // Optional: ask for confirmation before removing
                this.removeFromCart(productId);
            }
        },
        buyNow(product) {
            this.cart = [];
            this.resetDiscount();
            this.cart.push({ ...product, quantity: 1 });
            this.view = 'cart';
            window.scrollTo(0, 0);
        },

        applyDiscount() {
            this.resetDiscount(); // Reset trạng thái trước khi áp dụng mã mới
            const code = this.discountCode.trim().toUpperCase();

            if (!code) {
                this.discountError = 'Vui lòng nhập mã khuyến mãi.';
                return;
            }

            const discount = this.discounts.find(d => d.code.toUpperCase() === code);

            if (!discount || !discount.active) {
                this.discountError = 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.';
                return;
            }

            // Kiểm tra điều kiện giá trị đơn hàng tối thiểu
            if (discount.min_order_value && this.cartSubtotal() < discount.min_order_value) {
                this.discountError = `Mã này chỉ áp dụng cho đơn hàng từ ${this.formatCurrency(discount.min_order_value)}.`
                return;
            }

            // Áp dụng mã giảm giá dựa trên loại
            if (discount.type === 'free_shipping') {
                this.freeShipping = true;
            } else if (discount.type === 'fixed_amount') {
                this.discountAmount = discount.value;
                // Đảm bảo giảm giá không vượt quá tổng tiền hàng
                if (this.discountAmount > this.cartSubtotal()) {
                    this.discountAmount = this.cartSubtotal();
                }
            }

            this.appliedDiscountCode = code;
        },

        resetDiscount() {
            this.discountCode = '';
            this.appliedDiscountCode = '';
            this.discountAmount = 0;
            this.discountError = '';
            this.freeShipping = false;
        },

        // --- ACTIONS ---
        validateAndShowConfirmModal() {
            // --- VALIDATION ---
            if (this.cart.length === 0) {
                this.showAlert('Giỏ hàng của bạn đang trống.', 'error');
                return;
            }
            // Validate new address fields instead of the old one
            if (!this.customer.name || !this.customer.phone || !this.selectedProvince || !this.selectedDistrict || !this.selectedWard || !this.streetAddress) {
                this.showAlert('Vui lòng điền đầy đủ thông tin nhận hàng.', 'error');
                return;
            }

            // Validate phone number format
            const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
            if (!phoneRegex.test(this.customer.phone)) {
                this.showAlert('Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.', 'error');
                return;
            }
            const missingWeight = this.cart.some(item => !item.weight.trim());
            if (missingWeight) {
                this.showAlert('Vui lòng nhập cân nặng cho tất cả các sản phẩm trong giỏ hàng.', 'error');
                return;
            }

            // Validate payment method
            if (!this.paymentMethod) {
                this.showAlert('Vui lòng chọn phương thức thanh toán.', 'error');
                return;
            }

            this.isConfirmModalOpen = true;
        },

        async confirmAndSubmitOrder() {
            this.isSubmitting = true;

            this.updateFullAddress();

            const newOrderId = this.generateOrderId();
            this.lastOrderId = newOrderId;

            const orderDetails = {
                orderId: newOrderId,
                cart: this.cart.map(item => ({
                    name: item.name,
                    price: this.formatCurrency(item.price),
                    quantity: item.quantity,
                    weight: item.weight
                })),
                customer: {
                    name: this.customer.name,
                    phone: this.customer.phone,
                    address: this.customer.address,
                    notes: this.customer.notes
                },
                orderDate: new Date().toISOString(),
                subtotal: this.formatCurrency(this.cartSubtotal()),
                shipping: this.shippingFee() === 0 ? (this.freeShipping ? 'Miễn phí (FREESHIP)' : 'Miễn phí') : this.formatCurrency(this.shippingFee()),
                discount: this.discountAmount > 0 ? `-${this.formatCurrency(this.discountAmount)} (${this.appliedDiscountCode})` : 'Không có',
                total: this.formatCurrency(this.cartTotal()),
                paymentMethod: this.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'
            };

            const workerUrl = 'https://hidden-bonus-76d2.yendev96.workers.dev';

            try {
                const response = await fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderDetails)
                });

                if (!response.ok) {
                    const errorResult = await response.json();
                    throw new Error(errorResult.message || 'Có lỗi xảy ra khi gửi đơn hàng.');
                }

                this.isConfirmModalOpen = false;

                if (this.paymentMethod === 'bank_transfer') {
                    this.isBankTransferModalOpen = true;
                } else {
                    this.isSuccessModalOpen = true;
                }

            } catch (error) {
                console.error('Lỗi gửi đơn hàng:', error);
                this.showAlert(`Lỗi gửi đơn hàng: ${error.message}`, 'error');
            } finally {
                this.isSubmitting = false;
            }
        },

        cleanupAfterOrder() {
            // Chỉ xóa giỏ hàng và mã giảm giá. Thông tin khách hàng và địa chỉ được giữ lại.
            this.cart = [];
            this.resetDiscount();

            this.view = 'products';
            window.scrollTo(0, 0);
        },

        closeSuccessModal() {
            this.isSuccessModalOpen = false;
            setTimeout(() => this.cleanupAfterOrder(), 250);
        },

        closeBankTransferModal() {
            this.isBankTransferModalOpen = false;
            this.isSuccessModalOpen = true; // Hiển thị modal đặt hàng thành công
        },

        // --- SOCIAL PROOF LOGIC ---
        startNotificationLoop() {
            const names = [
                'Mai Anh', 'Thuỳ Linh', 'Bảo Ngọc', 'Khánh An', 'Minh Châu', 'Gia Hân',
                'Ngọc Diệp', 'Phương Vy', 'Thảo Nguyên', 'Hà My', 'Tú Anh', 'Quỳnh Chi',
                'Yến Nhi', 'Lan Hương', 'Thanh Trúc', 'Diệu Linh', 'Bích Phương', 'Hoài An',
                'Tường Vy', 'Kim Ngân'
            ];
            const actions = [
                'vừa đặt mua 1 sản phẩm', 'vừa hoàn tất đơn hàng', 'vừa mua 2 sản phẩm',
                'đã mua Vòng Dâu Tằm Hạt Gốc', 'đã mua Vòng Mix Bạc Cho Bé'
            ];

            const showRandomNotification = () => {
                const randomName = names[Math.floor(Math.random() * names.length)];
                const randomAction = actions[Math.floor(Math.random() * actions.length)];
                this.notification.message = `${randomName} ${randomAction}`;
                this.notification.visible = true;

                setTimeout(() => {
                    this.notification.visible = false;
                }, 4000); // Hiển thị trong 4 giây
            };

            // Hiển thị thông báo đầu tiên sau 5 giây, sau đó lặp lại mỗi 8-15 giây
            setTimeout(() => {
                showRandomNotification();
                setInterval(showRandomNotification, Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000);
            }, 5000);
        }
    }));
});
