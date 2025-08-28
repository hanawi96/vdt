document.addEventListener('alpine:init', () => {
    Alpine.data('shop', () => ({
        init() {
            // Tự động chọn tất cả sản phẩm mỗi khi giỏ hàng thay đổi
            this.$watch('cart', () => {
                this.selectedCartItems = this.cart.map(item => item.id);
            });

            // Khởi tạo trạng thái ban đầu (quan trọng khi tải lại trang với giỏ hàng đã có)
            this.selectedCartItems = this.cart.map(item => item.id);
        },


        // --- CẤU HÌNH PHÍ SHIP (Thay đổi ở đây) ---
        SHIPPING_FEE: 21000, // Phí vận chuyển mặc định 21,000đ

        // --- STATE ---
        view: 'products', // 'categories', 'products', or 'cart'
        categories: [],
        products: [],
        shopInfo: { stats: {} }, // Add shopInfo with a default stats object
        cart: Alpine.$persist([]).as('shoppingCart'),
        selectedCartItems: Alpine.$persist([]).as('selectedCartItems'), // Lưu ID sản phẩm được chọn
        miniCartError: '', // Thông báo lỗi trong mini cart

        // Sản phẩm bán kèm
        addonProducts: [
            {
                id: 'addon_tui_dau_tam',
                name: 'Túi Dâu Tằm',
                description: 'Khúc dâu tằm cắt nhỏ trong túi nhung',
                price: 39000,
                original_price: 45000,
                image: './assets/images/demo.jpg',
                detailedInfo: {
                    fullDescription: 'Túi dâu tằm cao cấp được làm từ khúc cành dâu tằm tự nhiên, cắt nhỏ và đóng gói trong túi nhung sang trọng. Sản phẩm giúp bé ngủ ngon, giảm stress và tăng cường sức khỏe tự nhiên.',
                    benefits: [
                        '🌿 Giúp bé ngủ ngon và sâu giấc',
                        '😌 Giảm căng thẳng, lo âu cho bé',
                        '🛡️ Tăng cường hệ miễn dịch tự nhiên',
                        '🌱 100% từ thiên nhiên, an toàn cho bé',
                        '💝 Đóng gói trong túi nhung cao cấp'
                    ],
                    usage: 'Đặt túi dâu tằm gần gối hoặc trong cũi của bé. Có thể bóp nhẹ để tỏa hương thơm tự nhiên. Thay thế sau 3-6 tháng sử dụng.',
                    materials: 'Cành dâu tằm tự nhiên, túi nhung cotton cao cấp',
                    origin: 'Thôn Đông Cao, Tráng Việt, Hà Nội'
                }
            },
            {
                id: 'addon_moc_chia_khoa',
                name: 'Móc Chìa Khóa Dâu Tằm',
                description: 'Móc chìa khóa từ khúc dâu tằm tự nhiên',
                price: 29000,
                original_price: 35000,
                image: './assets/images/demo.jpg',
                detailedInfo: {
                    fullDescription: 'Móc chìa khóa độc đáo được chế tác từ khúc dâu tằm tự nhiên, mang lại may mắn và bình an. Thiết kế nhỏ gọn, tiện lợi, phù hợp làm quà tặng hoặc vật phẩm phong thủy.',
                    benefits: [
                        '🍀 Mang lại may mắn và bình an',
                        '🎨 Thiết kế độc đáo, không trùng lặp',
                        '🌿 Chất liệu tự nhiên, thân thiện môi trường',
                        '💼 Nhỏ gọn, tiện lợi mang theo',
                        '🎁 Ý nghĩa làm quà tặng đặc biệt'
                    ],
                    usage: 'Gắn vào chùm chìa khóa, túi xách hoặc balo. Có thể sử dụng làm vật phẩm trang trí hoặc quà lưu niệm.',
                    materials: 'Khúc dâu tằm tự nhiên, dây móc inox không gỉ',
                    origin: 'Thôn Đông Cao, Tráng Việt, Hà Nội'
                }
            }
        ],
        currentCategory: { id: 'all', name: 'Top bán chạy', description: 'Những sản phẩm được yêu thích và mua nhiều nhất.' },
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
        isMiniCartOpen: false,
        miniCartTimeout: null,
        lastOrderId: '', // Lưu mã đơn hàng cuối cùng để hiển thị
        isBankTransferModalOpen: false,
        isDiscountModalOpen: false, // Modal mã giảm giá
        isCartAnimating: false, // Trạng thái cho hiệu ứng giỏ hàng
        isShowingBestSellers: false, // Cờ trạng thái cho chức năng xem sản phẩm bán chạy
        preventMiniCartCloseOnClickOutside: false, // Ngăn mini cart đóng khi modal khác mở

        // --- QUICK VIEW MODAL ---
        isQuickViewOpen: false,
        quickViewProduct: null,
        sharedDetails: {},

        // --- COUNTDOWN TIMER ---
        freeshipOfferEndTime: Alpine.$persist(0).as('freeshipOfferEndTime'),
        countdownTimer: {
            interval: null,
            display: '02 : 00 : 00'
        },

        // Addon detail modal states
        isAddonDetailModalOpen: false,
        currentAddonDetail: null,
        addonDetailOpenedFrom: null, // Ghi nhớ nơi mở modal chi tiết

        // --- SOCIAL PROOF NOTIFICATION ---
        notification: {
            visible: false,
            message: ''
        },

        // Discount properties
        availableDiscounts: [], // Danh sách mã giảm giá sẽ được tải từ file JSON
        discountCode: Alpine.$persist('').as('discountCode'),
        appliedDiscountCode: Alpine.$persist('').as('appliedDiscountCode'),
        appliedGift: Alpine.$persist(null).as('appliedGift'),
        discountAmount: 0,
        discountError: '',

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
            this.startFreeshipCountdown();

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
                const [catRes, prodRes, infoRes, addressRes, discountRes, sharedDetailsRes] = await Promise.all([
                    fetch('./data/categories.json'),
                    fetch('./data/products.json'),
                    fetch('./data/shop-info.json'),
                    fetch('./data/vietnamAddress.json'),
                    fetch('./data/discounts.json'),
                    fetch('./data/shared-details.json') // Tải thông tin mô tả chung
                ]);
                if (!catRes.ok) throw new Error('Không thể tải danh mục.');
                if (!prodRes.ok) throw new Error('Không thể tải sản phẩm.');
                if (!infoRes.ok) throw new Error('Không thể tải thông tin shop.');
                if (!addressRes.ok) throw new Error('Không thể tải dữ liệu địa chỉ.');
                if (!discountRes.ok) throw new Error('Không thể tải mã giảm giá.');
                if (!sharedDetailsRes.ok) throw new Error('Không thể tải thông tin chi tiết.');

                const categoryData = await catRes.json();
                this.categories = [{ id: 'all', name: 'Tất cả' }, ...categoryData];
                this.products = await prodRes.json();
                this.shopInfo = await infoRes.json();
                this.addressData = await addressRes.json();
                this.availableDiscounts = await discountRes.json(); // Tải mã giảm giá vào biến được sử dụng bởi modal
                this.sharedDetails = await sharedDetailsRes.json(); // Lưu thông tin mô tả chung

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
            const fullList = this._fullProductList();
            // Nếu đang ở chế độ xem 10 sản phẩm bán chạy, chỉ hiển thị 10 sản phẩm
            if (this.isShowingBestSellers) {
                return fullList.slice(0, 10);
            }
            return fullList.slice(0, this.visibleProductCount);
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
            // Luôn tính theo sản phẩm đã chọn và bỏ qua các sản phẩm quà tặng
            return this.selectedCartProducts
                .filter(item => !item.isGift)
                .reduce((total, item) => total + (item.price * item.quantity), 0);
        },


        // --- LOGIC KHUYẾN MÃI ---
        get addonDiscount() {
            // Giảm 5,000đ nếu chọn mua Móc Chìa Khóa
            const hasKeychain = this.selectedCartItems.includes('addon_moc_chia_khoa');
            return hasKeychain ? 5000 : 0;
        },

        get tuiDauTamBonusDiscount() {
            const hasTuiDauTam = this.selectedCartItems.includes('addon_tui_dau_tam');
            const isFreeshipAppliedByCode = this.isFreeshippingFromDiscount();

            // Giảm 8k nếu khách mua túi dâu tằm TRONG KHI đã được freeship bằng MÃ GIẢM GIÁ
            if (hasTuiDauTam && isFreeshipAppliedByCode) {
                return 8000;
            }
            return 0;
        },

        // --- KẾT THÚC LOGIC KHUYẾN MÃI ---

        get freeShipping() {
            // Freeship nếu mua "Túi Dâu Tằm"
            const hasTuiDauTam = this.selectedCartItems.includes('addon_tui_dau_tam');
            if (hasTuiDauTam) return true;

            // Freeship nếu có mã giảm giá vận chuyển
            const discount = this.availableDiscounts.find(d => d.code === this.appliedDiscountCode);
            if (discount && discount.type === 'shipping') return true;

            return false;
        },

        // Luôn trả về phí ship gốc để hiển thị
        shippingFee() {
            return this.SHIPPING_FEE;
        },

        // Tính toán tiền giảm giá ship
        get shippingDiscount() {
            return this.freeShipping ? this.SHIPPING_FEE : 0;
        },

        cartTotal() {
            const subtotal = this.cartSubtotal();
            const total = subtotal + this.shippingFee() - this.discountAmount - this.addonDiscount - this.shippingDiscount - this.tuiDauTamBonusDiscount;
            return total > 0 ? total : 0;
        },

        get totalCartQuantity() {
            // Tính tổng số lượng của tất cả các sản phẩm đã chọn
            return this.selectedCartProducts.reduce((total, item) => total + item.quantity, 0);
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

        // Lấy sản phẩm bán chạy nhất
        get bestSellingProducts() {
            return [...this.products]
                .sort((a, b) => (b.purchases || 0) - (a.purchases || 0))
                .slice(0, 10);
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

            // Cuộn xuống phần sản phẩm
            this.$nextTick(() => {
                const element = document.getElementById('product-list-anchor');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        },
        triggerCartAnimation() {
            this.isCartAnimating = true;
            // Reset the animation class after it finishes
            setTimeout(() => {
                this.isCartAnimating = false;
            }, 600); // Must match the animation duration in CSS
        },



        backToCategories() {
            this.selectCategory({ id: 'all', name: 'Top bán chạy', description: 'Những sản phẩm được yêu thích và mua nhiều nhất.' });
            this.view = 'products'; // Luôn ở view products
        },

        // --- UI ACTIONS ---
        showBestSellers() {
            this.isMiniCartOpen = false;
            this.currentCategory = { id: 'all', name: 'Top bán chạy' }; // Reset về category gốc
            this.activeFilter = 'best_selling'; // Kích hoạt bộ lọc bán chạy đã có
            this.isShowingBestSellers = true; // Bật cờ trạng thái đặc biệt

            // Cuộn đến phần sản phẩm một cách mượt mà
            this.$nextTick(() => {
                const productsSection = document.getElementById('product-list-anchor');
                if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        },

        // --- IMAGE MODAL LOGIC ---


        openImageModal(imageUrl) {
            console.log('openImageModal function called.');
            this.currentImage = imageUrl;
            this.isImageModalOpen = true;
            console.log('isImageModalOpen set to:', this.isImageModalOpen);
            document.body.style.overflow = 'hidden';
            console.log('Body overflow set to hidden.');
        },

        closeImageModal() {
            this.isImageModalOpen = false;
            setTimeout(() => { this.currentImage = ''; }, 300);
            document.body.style.overflow = 'auto';
        },

        // --- ADDON DETAIL MODAL LOGIC ---
        openAddonDetail(addon) {
            // Nếu mở từ mini cart, bật cờ ngăn không cho mini cart bị đóng
            if (this.isMiniCartOpen) {
                this.preventMiniCartCloseOnClickOutside = true;
            }
            this.currentAddonDetail = addon;
            this.isAddonDetailModalOpen = true;

            // Cập nhật tên sản phẩm trong banner freeship để hiển thị sản phẩm đang xem
            this.$nextTick(() => {
                const addonNameElement = document.getElementById('addon-product-name');
                if (addonNameElement && addon) {
                    addonNameElement.textContent = addon.name;
                }
            });

            document.body.style.overflow = 'hidden';
        },

        closeAddonDetail() {
            this.isAddonDetailModalOpen = false;

            // Tắt cờ ngăn đóng mini cart sau một khoảng trễ ngắn
            setTimeout(() => {
                this.preventMiniCartCloseOnClickOutside = false;
            }, 100);

            // Chỉ khôi phục scroll nếu không còn modal nào khác đang mở
            if (!this.isMiniCartOpen) {
                document.body.style.overflow = 'auto';
            }

            // Xóa dữ liệu addon sau khi hiệu ứng đóng hoàn tất
            setTimeout(() => {
                this.currentAddonDetail = null;
            }, 300);
        },

        // --- CART LOGIC ---
        addToCart(product) {
            const existingItem = this.cart.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                const savedNote = this.productNotes[product.id] || '';
                this.cart.push({ ...product, quantity: 1, weight: savedNote });
                // Tự động chọn sản phẩm mới thêm
                this.selectedCartItems.push(product.id);
            }

            // Kích hoạt hiệu ứng giỏ hàng và hiển thị thông báo
            this.triggerCartAnimation();
            this.showAlert('Đã thêm sản phẩm vào giỏ hàng!', 'success');
        },

        // Mở/đóng mini cart
        toggleMiniCart() {
            this.isMiniCartOpen = !this.isMiniCartOpen;
            // Xóa lỗi khi mở mini cart
            if (this.isMiniCartOpen) {
                this.miniCartError = '';
            }
        },

        // Toggle chọn sản phẩm trong mini cart
        toggleCartItemSelection(productId) {
            const index = this.selectedCartItems.indexOf(productId);
            if (index > -1) {
                this.selectedCartItems.splice(index, 1);
            } else {
                this.selectedCartItems.push(productId);
            }
        },

        // Toggle chọn tất cả sản phẩm
        toggleSelectAll() {
            if (this.isAllSelected) {
                this.selectedCartItems = [];
            } else {
                this.selectedCartItems = this.cart.map(item => item.id);
            }
        },

        // Kiểm tra có chọn tất cả không
        get isAllSelected() {
            return this.cart.length > 0 && this.selectedCartItems.length === this.cart.length;
        },

        // Chuyển đến trang thanh toán với sản phẩm đã chọn
        checkoutSelected() {
            if (this.selectedCartItems.length === 0) {
                this.miniCartError = 'Vui lòng chọn 1 sản phẩm để mua hàng';
                return;
            }
            this.miniCartError = '';
            this.view = 'cart';
            this.isMiniCartOpen = false;
        },

        // Lấy danh sách sản phẩm đã chọn để thanh toán
        get selectedCartProducts() {
            return this.cart.filter(item => this.selectedCartItems.includes(item.id));
        },

        // Thêm sản phẩm bán kèm vào giỏ hàng
        addAddonToCart(addonProduct) {
            const existingItem = this.cart.find(item => item.id === addonProduct.id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                this.cart.push({ ...addonProduct, quantity: 1, weight: '' });
                // Tự động chọn sản phẩm bán kèm
                this.selectedCartItems.push(addonProduct.id);
            }

                        // Kích hoạt hiệu ứng giỏ hàng
            this.triggerCartAnimation();
            this.showAlert(`Đã thêm ${addonProduct.name} vào giỏ hàng! 🚚 Bạn được miễn phí ship!`, 'success');
        },

        // Kiểm tra sản phẩm bán kèm đã có trong giỏ hàng chưa
        isAddonInCart(addonId) {
            return this.cart.some(item => item.id === addonId);
        },
        // Kiểm tra xem freeship có phải từ mã giảm giá không
        isFreeshippingFromDiscount() {
            if (!this.appliedDiscountCode) return false;
            const appliedDiscount = this.availableDiscounts.find(d => d.code === this.appliedDiscountCode);
            return appliedDiscount && appliedDiscount.type === 'shipping';
        },

        removeFromCart(productId) {
            // Kiểm tra xem sản phẩm bị xóa có phải là sản phẩm bán kèm không
            const isAddonProduct = this.addonProducts.some(addon => addon.id === productId);
            const removedProduct = this.cart.find(item => item.id === productId);

            this.cart = this.cart.filter(item => item.id !== productId);
            // Xóa khỏi danh sách đã chọn
            this.selectedCartItems = this.selectedCartItems.filter(id => id !== productId);

            // Nếu xóa sản phẩm bán kèm, kiểm tra xem còn sản phẩm bán kèm nào khác không
            if (isAddonProduct) {
                const hasOtherAddons = this.cart.some(item =>
                    this.addonProducts.some(addon => addon.id === item.id)
                );

                // Nếu không còn sản phẩm bán kèm nào và freeship không phải từ mã giảm giá
                if (!hasOtherAddons && !this.isFreeshippingFromDiscount()) {
                    this.showAlert(`Đã xóa ${removedProduct?.name || 'sản phẩm bán kèm'}. Phí vận chuyển có thể được áp dụng lại.`, 'info');
                } else {
                    this.showAlert(`Đã xóa ${removedProduct?.name || 'sản phẩm'} khỏi giỏ hàng.`, 'success');
                }
            } else {
                this.showAlert(`Đã xóa ${removedProduct?.name || 'sản phẩm'} khỏi giỏ hàng.`, 'success');
            }

            if (this.cart.length === 0) {
                this.resetDiscount();
            }
        },

        increaseQuantity(productId) {
            const item = this.cart.find(item => item.id === productId);
            if (item) {
                item.quantity++;
                this.revalidateAppliedDiscount();
            }
        },

        decreaseQuantity(productId) {
            const item = this.cart.find(item => item.id === productId);
            if (item && item.quantity > 1) {
                item.quantity--;
                this.revalidateAppliedDiscount();
            } else if (item) {
                this.removeFromCart(productId);
            }
        },

        buyNow(product) {
            const existingItem = this.cart.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                const savedNote = this.productNotes[product.id] || '';
                this.cart.push({ ...product, quantity: 1, weight: savedNote });
                this.selectedCartItems.push(product.id);
            }
            this.revalidateAppliedDiscount();
            this.view = 'cart';
            window.scrollTo(0, 0);
        },

        clearCart() {
            this.cart = [];
            this.selectedCartItems = [];
            this.resetDiscount();
        },

        backToShopping() {
            this.view = 'products';
            this.$nextTick(() => {
                const productList = document.getElementById('product-list');
                if (productList) {
                    productList.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        },

        applyDiscount() {
            // Lưu trạng thái freeship từ sản phẩm bán kèm trước khi reset
            const hasAddonProducts = this.cart.some(item =>
                this.addonProducts.some(addon => addon.id === item.id)
            );

            this.resetDiscount(); // Reset trạng thái trước khi áp dụng mã mới

            // Khôi phục freeship nếu có sản phẩm bán kèm
            if (hasAddonProducts) {
                this.freeShipping = true;
            }

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
            this.appliedGift = null;
            this.discountAmount = 0;
            this.discountError = '';
        },

        // --- DISCOUNT MODAL FUNCTIONS ---
        openDiscountModal() {
            this.preventMiniCartCloseOnClickOutside = true;
            this.isDiscountModalOpen = true;
        },

        closeDiscountModal() {
            this.isDiscountModalOpen = false;
            // Dùng timeout để đảm bảo sự kiện click được xử lý xong xuôi
            // trước khi kích hoạt lại việc đóng mini cart
            setTimeout(() => {
                this.preventMiniCartCloseOnClickOutside = false;
            }, 100);
        },

        selectDiscount(code) {
            this.discountCode = code;
        },

        applySelectedDiscount(andClose = false) {
            const code = this.discountCode.trim().toUpperCase();
            if (!code) {
                this.discountError = 'Vui lòng nhập hoặc chọn một mã khuyến mãi.';
                return;
            }

            const promotion = this.availableDiscounts.find(d => d.code.toUpperCase() === code);
            if (!promotion || !promotion.active) {
                this.discountError = 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.';
                return;
            }

            // Kiểm tra điều kiện
            if (this.cartSubtotal() < promotion.minOrder) {
                this.discountError = `Ưu đãi này chỉ áp dụng cho đơn hàng từ ${this.formatCurrency(promotion.minOrder)}.`;
                return;
            }
            if (promotion.minItems && this.totalCartQuantity < promotion.minItems) {
                this.discountError = `Ưu đãi này chỉ áp dụng cho đơn hàng có từ ${promotion.minItems} sản phẩm trở lên.`;
                return;
            }

            // Reset tất cả khuyến mãi trước khi áp dụng cái mới
            this.resetDiscount();

            // Áp dụng khuyến mãi mới
            if (promotion.type === 'gift') {
                this.appliedGift = { title: promotion.title, value: promotion.value };
            } else {
                // Xử lý các loại mã giảm giá khác
                if (promotion.type === 'shipping') {
                    this.freeShipping = true;
                } else if (promotion.type === 'fixed') {
                    this.discountAmount = promotion.value;
                } else if (promotion.type === 'percentage') {
                    this.discountAmount = Math.floor(this.cartSubtotal() * promotion.value / 100);
                }
                this.appliedDiscountCode = code;
            }

            // Đảm bảo giảm giá không vượt quá tổng tiền hàng (chỉ áp dụng cho mã giảm giá, không phải quà tặng)
            if (this.discountAmount > this.cartSubtotal()) {
                this.discountAmount = this.cartSubtotal();
            }

            this.discountCode = code; // Giữ mã trong input
            if (andClose) {
                this.closeDiscountModal();
            }
        },


        getDiscountAvailability(discount) {
            const subtotal = this.cartSubtotal();
            const quantity = this.totalCartQuantity;

            if (subtotal < discount.minOrder) {
                return {
                    available: false,
                    reason: `Cần mua thêm ${this.formatCurrency(discount.minOrder - subtotal)}.`
                };
            }

            if (discount.minItems && quantity < discount.minItems) {
                return {
                    available: false,
                    reason: `Cần thêm ${discount.minItems - quantity} sản phẩm.`
                };
            }

            return { available: true, reason: '' };
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
                cart: (() => {
                    let orderItems = this.cart.map(item => ({
                        name: item.name,
                        price: this.formatCurrency(item.price),
                        quantity: item.quantity,
                        weight: item.weight
                    }));
                    if (this.appliedGift) {
                        orderItems.push({
                            name: this.appliedGift.title,
                            price: 'Miễn phí',
                            quantity: 1,
                            weight: 0
                        });
                    }
                    return orderItems;
                })(),
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
        },

        // --- COUNTDOWN LOGIC ---
        startFreeshipCountdown() {
            if (!this.freeshipOfferEndTime || this.freeshipOfferEndTime < Date.now()) {
                // Đặt lại đếm ngược 2 giờ nếu chưa có hoặc đã hết hạn
                this.freeshipOfferEndTime = Date.now() + 2 * 60 * 60 * 1000;
            }

            this.countdownTimer.interval = setInterval(() => {
                const now = Date.now();
                const remaining = this.freeshipOfferEndTime - now;

                if (remaining <= 0) {
                    this.countdownTimer.display = '00 : 00 : 00';
                    // Tự động khởi động lại chu kỳ 2 giờ mới sau khi hết hạn
                    this.freeshipOfferEndTime = Date.now() + 2 * 60 * 60 * 1000;
                    return;
                }

                const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((remaining / 1000 / 60) % 60);
                const seconds = Math.floor((remaining / 1000) % 60);

                this.countdownTimer.display =
                    `${hours.toString().padStart(2, '0')} : ` +
                    `${minutes.toString().padStart(2, '0')} : ` +
                    `${seconds.toString().padStart(2, '0')}`;

            }, 1000);
        },

        // --- QUICK VIEW MODAL LOGIC ---
        openQuickView(product) {
            this.quickViewProduct = product;
            this.isQuickViewOpen = true;
            document.body.style.overflow = 'hidden';
        },

        closeQuickView() {
            this.isQuickViewOpen = false;
            // Chỉ khôi phục scroll nếu không còn modal nào khác đang mở
            if (!this.isMiniCartOpen) {
                 document.body.style.overflow = 'auto';
            }
            // Delay clearing the product to allow for closing animation
            setTimeout(() => {
                this.quickViewProduct = null;
            }, 300);
        }
    }));
});
