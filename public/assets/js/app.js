document.addEventListener('alpine:init', () => {
  Alpine.data('shop', () => ({
    /* ========= CẤU HÌNH ========= */
    SHIPPING_FEE: 21000,

    /* ========= STATE ========= */
    view: 'products',
    categories: [],
    products: [],
    shopInfo: { stats: {} },
    cart: Alpine.$persist([]).as('shoppingCart'),
    selectedCartItems: Alpine.$persist([]).as('selectedCartItems'),
    miniCartError: '',
    addonProducts: [
      {
        id: 'addon_tui_dau_tam',
        name: 'Túi Dâu Tằm Để Phòng',
        description: 'Khúc dâu tằm để phòng, trong túi nhung',
        price: 39000,
        original_price: 45000,
        image: './assets/images/demo.jpg',
        detailedInfo: {
          fullDescription:
            'Túi dâu tằm để phòng cao cấp được làm từ khúc cành dâu tằm tự nhiên, cắt nhỏ và đóng gói trong túi nhung sang trọng. Sản phẩm giúp bé ngủ ngon, giảm stress và tăng cường sức khỏe tự nhiên.',
          benefits: [
            '🌿 Giúp bé ngủ ngon và sâu giấc',
            '😌 Giảm căng thẳng, lo âu cho bé',
            '🛡️ Tăng cường hệ miễn dịch tự nhiên',
            '🌱 100% từ thiên nhiên, an toàn cho bé',
            '💝 Đóng gói trong túi nhung cao cấp'
          ],
          usage:
            'Đặt túi dâu tằm để phòng gần gối hoặc trong cũi của bé. Có thể bóp nhẹ để tỏa hương thơm tự nhiên. Thay thế sau 3-6 tháng sử dụng.',
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
          fullDescription:
            'Móc chìa khóa độc đáo được chế tác từ khúc dâu tằm tự nhiên, mang lại may mắn và bình an. Thiết kế nhỏ gọn, tiện lợi, phù hợp làm quà tặng hoặc vật phẩm phong thủy.',
          benefits: [
            '🍀 Mang lại may mắn và bình an',
            '🎨 Thiết kế độc đáo, không trùng lặp',
            '🌿 Chất liệu tự nhiên, thân thiện môi trường',
            '💼 Nhỏ gọn, tiện lợi mang theo',
            '🎁 Ý nghĩa làm quà tặng đặc biệt'
          ],
          usage:
            'Gắn vào chùm chìa khóa, túi xách hoặc balo. Có thể sử dụng làm vật phẩm trang trí hoặc quà lưu niệm.',
          materials: 'Khúc dâu tằm tự nhiên, dây móc inox không gỉ',
          origin: 'Thôn Đông Cao, Tráng Việt, Hà Nội'
        }
      }
    ],
    currentCategory: {
      id: 'all',
      name: 'Top bán chạy',
      description: 'Những sản phẩm được yêu thích và mua nhiều nhất.'
    },
    activeFilter: 'best_selling',
    visibleProductCount: 10,
    productsPerLoad: 10,
    loading: true,
    error: null,
    isSubmitting: false,
    searchQuery: '',
    activeSearchQuery: '',

    /* ========= MODALS ========= */
    isImageModalOpen: false,
    currentImage: '',
    isAlertModalOpen: false,
    alertModalMessage: '',
    alertModalType: 'success',
    isConfirmModalOpen: false,
    isSuccessModalOpen: false,
    isCheckoutModalOpen: false,
    isMiniCartOpen: false,
    checkoutOpenedFromConfirm: false,
    miniCartTimeout: null,
    lastOrderId: '',
    isBankTransferModalOpen: false,
    isDiscountModalOpen: false,
    isCartAnimating: false,
    isShowingBestSellers: false,
    preventMiniCartCloseOnClickOutside: false,
    isFaqModalOpen: false,
    isItemOptionsModalOpen: false,
    currentItemForOptions: null,
    itemOptions: { quantity: 1, note: '' },
    socialProofViewers: Math.floor(Math.random() * 5) + 1,
    socialProofInterval: null,

    /* ========= FAQ ========= */
    faqItems: [],
    openFaqIndex: null,

    /* ========= QUICK VIEW ========= */
    isQuickViewOpen: false,
    quickViewProduct: null,
    sharedDetails: {},

    /* ========= COUNTDOWN ========= */
    freeshipOfferEndTime: Alpine.$persist(0).as('freeshipOfferEndTime'),
    countdownTimer: { interval: null, display: '02 : 00 : 00' },

    /* ========= ADDON DETAIL ========= */
    isAddonDetailModalOpen: false,
    currentAddonDetail: null,
    addonDetailOpenedFrom: null,

    /* ========= SOCIAL PROOF ========= */
    notification: { visible: false, message: '' },
    socialProofCount: 0,

    /* ========= DISCOUNTS ========= */
    availableDiscounts: [],
    discountCode: Alpine.$persist('').as('discountCode'),
    appliedDiscountCode: Alpine.$persist('').as('appliedDiscountCode'),
    appliedGift: Alpine.$persist(null).as('appliedGift'),
    discountAmount: 0,
    discountError: '',

    /* ========= CUSTOMER & ADDRESS ========= */
    productNotes: Alpine.$persist({}).as('productNotes'),
    customer: Alpine.$persist({ name: '', phone: '', email: '', address: '', notes: '' }).as('customerInfo'),
    paymentMethod: 'cod',
    addressData: [],
    selectedProvince: Alpine.$persist('').as('selectedProvince'),
    selectedDistrict: Alpine.$persist('').as('selectedDistrict'),
    selectedWard: Alpine.$persist('').as('selectedWard'),
    streetAddress: Alpine.$persist('').as('streetAddress'),

    /* ========= FORM VALIDATION ========= */
    formErrors: {
      name: '',
      phone: '',
      email: '',
      province: '',
      district: '',
      ward: '',
      streetAddress: '',
      paymentMethod: ''
    },

    /* ========= PRIVATE/HELPERS ========= */
    _CURRENCY: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),

    /* ========= LIFECYCLE ========= */
    async init() {
      // Tải dữ liệu
      await this.loadData();
      this.revalidateAppliedDiscount(); // Re-apply discount on load
      this.startNotificationLoop();
      this.startFreeshipCountdown();
      this.startSocialProofLoop();

      // Validate address consistency sau khi load
      console.log('🔄 Calling validateAddressConsistency');
      this.validateAddressConsistency();

      // Watch địa chỉ
      this.$watch('selectedProvince', (newValue) => {
        this.selectedDistrict = '';
        this.selectedWard = '';
        if (!newValue) {
          this.customer.address = '';
        }
      });
      this.$watch('selectedDistrict', (newValue) => {
        this.selectedWard = '';
        if (!newValue) {
          this.customer.address = '';
        }
      });
      this.$watch('selectedWard', () => this.updateFullAddress());
      this.$watch('streetAddress', () => this.updateFullAddress());

      // Watch cart lưu ghi chú & vệ sinh selectedCartItems khi item bị xoá
      this.$watch('cart', (newCart) => {
        const idSet = new Set(newCart.map(i => i.id));
        // Lưu note nếu có
        newCart.forEach(item => { if (item.weight) this.productNotes[item.id] = item.weight; });
        // Loại bỏ ID không còn trong cart
        this.selectedCartItems = this.selectedCartItems.filter(id => idSet.has(id));
      }, { deep: true });

      // Real-time validation watchers
      this.$watch('customer.name', (newValue) => {
        if (newValue && newValue.trim()) {
          this.formErrors.name = '';
        }
      });

      this.$watch('customer.phone', (newValue) => {
        if (newValue && newValue.trim()) {
          const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
          if (phoneRegex.test(newValue)) {
            this.formErrors.phone = '';
          }
        }
      });

      this.$watch('selectedProvince', (newValue) => {
        if (newValue) {
          this.formErrors.province = '';
        }
      });

      this.$watch('selectedDistrict', (newValue) => {
        if (newValue) {
          this.formErrors.district = '';
        }
      });

      this.$watch('selectedWard', (newValue) => {
        if (newValue) {
          this.formErrors.ward = '';
        }
      });

      this.$watch('streetAddress', (newValue) => {
        if (newValue && newValue.trim()) {
          this.formErrors.streetAddress = '';
        }
      });

      this.$watch('paymentMethod', (newValue) => {
        if (newValue) {
          this.formErrors.paymentMethod = '';
        }
      });

      // Watch selected items để revalidate discount
      this.$watch('selectedCartItems', () => {
        this.revalidateAppliedDiscount();
      });

      // Dọn cart dữ liệu cũ trùng ID
      if (this.cart.length > 0) {
        const uniqueIds = new Set(this.cart.map(i => i.id));
        if (uniqueIds.size < this.cart.length) {
          console.warn('Phát hiện dữ liệu giỏ hàng cũ không hợp lệ. Đang tự động xóa…');
          this.cart = [];
        }
      }
    },

    /* ========= HELPERS ========= */
    generateOrderId() {
      const d = new Date();
      const y = d.getFullYear().toString().slice(-2);
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let r = '';
      for (let i = 0; i < 3; i++) r += chars[Math.floor(Math.random() * chars.length)];
      return `AN${y}${m}${day}${r}`;
    },
    formatCurrency(v) { return typeof v === 'number' ? this._CURRENCY.format(v) : v; },

    showAlert(message, type = 'success') {
      this.alertModalMessage = message;
      this.alertModalType = type;
      this.isAlertModalOpen = true;
      setTimeout(() => { this.isAlertModalOpen = false; }, 3000);
    },

    /* ========= DATA FETCH ========= */
    async loadData() {
      this.loading = true; this.error = null;
      try {
        const [catRes, prodRes, infoRes, addrRes, discountRes, sharedRes, faqRes] = await Promise.all([
          fetch('./data/categories.json'),
          fetch('./data/products.json'),
          fetch('./data/shop-info.json'),
          fetch('./data/vietnamAddress.json'),
          fetch('./data/discounts.json'),
          fetch('./data/shared-details.json'),
          fetch('./data/faq.json')
        ]);

        if (!catRes.ok) throw new Error('Không thể tải danh mục.');
        if (!prodRes.ok) throw new Error('Không thể tải sản phẩm.');
        if (!infoRes.ok) throw new Error('Không thể tải thông tin shop.');
        if (!addrRes.ok) throw new Error('Không thể tải dữ liệu địa chỉ.');
        if (!discountRes.ok) throw new Error('Không thể tải mã giảm giá.');
        if (!sharedRes.ok) throw new Error('Không thể tải thông tin chi tiết.');
        if (!faqRes.ok) throw new Error('Không thể tải dữ liệu FAQ.');

        const categoryData = await catRes.json();
        this.categories = [{ id: 'all', name: 'Tất cả' }, ...(Array.isArray(categoryData) ? categoryData : [])];

        this.products = await prodRes.json();
        this.shopInfo = await infoRes.json();
        this.addressData = await addrRes.json();

        // Force re-render dropdown để sync với model values
        this.$nextTick(() => {
          // Trigger Alpine reactivity bằng cách re-assign values
          const tempProvince = this.selectedProvince;
          const tempDistrict = this.selectedDistrict;
          const tempWard = this.selectedWard;

          this.selectedProvince = '';
          this.selectedDistrict = '';
          this.selectedWard = '';

          this.$nextTick(() => {
            this.selectedProvince = tempProvince;
            this.selectedDistrict = tempDistrict;
            this.selectedWard = tempWard;
          });
        });

        this.availableDiscounts = await discountRes.json();
        this.sharedDetails = await sharedRes.json();
        this.faqItems = await faqRes.json();

        // Tính stats động
        if (this.products?.length) {
          const totalSales = this.products.reduce((s, p) => s + (p.purchases || 0), 0);
          const totalRatingSum = this.products.reduce((s, p) => s + (p.rating || 0), 0);
          const rated = this.products.filter(p => (p.rating || 0) > 0).length;
          const averageRating = rated ? (totalRatingSum / rated).toFixed(1) : 0;

          this.shopInfo.stats = {
            ...this.shopInfo.stats,
            products: this.products.length,
            totalSales,
            averageRating
          };
        }
      } catch (e) {
        console.error('Lỗi tải dữ liệu:', e);
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    /* ========= COMPUTED ========= */
    _fullProductList() {
      if (!this.currentCategory) return [];
      const byCategory = this.currentCategory.id === 'all'
        ? this.products
        : this.products.filter(p => p.category === this.currentCategory.id);

      const q = this.activeSearchQuery.trim().toLowerCase();
      const searched = q ? byCategory.filter(p => p.name?.toLowerCase().includes(q)) : byCategory;

      const arr = [...searched];
      switch (this.activeFilter) {
        case 'best_selling': arr.sort((a, b) => (b.purchases || 0) - (a.purchases || 0)); break;
        case 'newest': arr.reverse(); break; // giả định “mới” nằm cuối file như cũ
        case 'top_rated': arr.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      }
      return arr;
    },
    filteredProducts() {
      const list = this._fullProductList();
      return this.isShowingBestSellers ? list.slice(0, 10) : list.slice(0, this.visibleProductCount);
    },
    canLoadMore() { return this.visibleProductCount < this._fullProductList().length; },
    getProductCount(categoryId) { return this.products.filter(p => p.category === categoryId).length; },

    getCategoryPurchases(categoryId) {
      const arr = categoryId === 'all' ? this.products : this.products.filter(p => p.category === categoryId);
      const total = arr.reduce((t, p) => t + (p.purchases || 0), 0);
      if (total > 1000) {
        const k = (total / 1000).toFixed(1);
        return k.includes('.0') ? `${Math.round(total / 1000)}k` : k.replace('.', ',') + 'k';
      }
      return total;
    },

    // Chỉ tính theo item đã chọn và bỏ qua quà tặng
    cartSubtotal() {
      return this.selectedCartProducts
        .filter(i => !i.isGift)
        .reduce((t, i) => t + (i.price * i.quantity), 0);
    },

    /* ========= LOGIC KHUYẾN MÃI ========= */
    get hasMainProductInCart() {
      // Có ít nhất 1 item đã chọn KHÔNG phải addon
      return this.selectedCartItems.some(id => !this.addonProducts.some(p => p.id === id));
    },
    get addonDiscount() {
      const hasKeychain = this.selectedCartItems.includes('addon_moc_chia_khoa');
      return (hasKeychain && this.hasMainProductInCart) ? 5000 : 0;
    },
    get tuiDauTamBonusDiscount() {
      const hasTui = this.selectedCartItems.includes('addon_tui_dau_tam');
      const freeshipByCode = this.isFreeshippingFromDiscount();
      return (hasTui && freeshipByCode && this.hasMainProductInCart) ? 8000 : 0;
    },

    get freeShipping() {
      // Freeship nếu mua Túi Dâu Tằm và có sản phẩm chính
      if (this.selectedCartItems.includes('addon_tui_dau_tam') && this.hasMainProductInCart) return true;
      // Freeship nếu có mã type=shipping
      const d = this.availableDiscounts.find(d => d.code?.toUpperCase() === this.appliedDiscountCode);
      return !!(d && d.type === 'shipping');
    },
    shippingFee() { return this.SHIPPING_FEE; },
    get shippingDiscount() { return this.freeShipping ? this.SHIPPING_FEE : 0; },

    cartTotal() {
      if (this.selectedCartItems.length === 0) return 0;
      const total = this.cartSubtotal()
        + this.shippingFee()
        - this.discountAmount
        - this.addonDiscount
        - this.shippingDiscount
        - this.tuiDauTamBonusDiscount;
      return total > 0 ? total : 0;
    },

    get totalSavings() {
      return this.shippingDiscount + this.discountAmount + this.addonDiscount + this.tuiDauTamBonusDiscount;
    },

    get totalCartQuantity() {
      return this.selectedCartProducts.reduce((t, i) => t + i.quantity, 0);
    },

    get trueTotalCartQuantity() {
      return this.cart.reduce((t, i) => t + i.quantity, 0);
    },

    /* ========= ADDRESS ========= */
    get provinces() { return this.addressData.map(p => ({ Id: p.Id, Name: p.Name })); },
    get districts() {
      if (!this.selectedProvince) return [];
      const p = this.addressData.find(p => p.Id === this.selectedProvince);
      return p ? p.Districts.map(d => ({ Id: d.Id, Name: d.Name })) : [];
    },
    get wards() {
      if (!this.selectedProvince || !this.selectedDistrict) return [];
      const p = this.addressData.find(p => p.Id === this.selectedProvince);
      const d = p?.Districts?.find(d => d.Id === this.selectedDistrict);
      return d ? d.Wards.map(w => ({ Id: w.Id, Name: w.Name })) : [];
    },
    get bestSellingProducts() {
      return [...this.products].sort((a, b) => (b.purchases || 0) - (a.purchases || 0)).slice(0, 10);
    },

    updateFullAddress() {
      if (this.selectedProvince && this.selectedDistrict && this.selectedWard) {
        const prov = this.provinces.find(p => p.Id === this.selectedProvince)?.Name || '';
        const dist = this.districts.find(d => d.Id === this.selectedDistrict)?.Name || '';
        const ward = this.wards.find(w => w.Id === this.selectedWard)?.Name || '';
        this.customer.address = [this.streetAddress, ward, dist, prov].filter(Boolean).join(', ');
      } else {
        // FORCE CLEAR address khi bất kỳ dropdown nào trống
        this.customer.address = '';
      }
    },

    /* ========= VIEW / SEARCH ========= */
    performSearch() {
      this.activeSearchQuery = this.searchQuery.trim();
      this.visibleProductCount = 10;
      if (this.activeSearchQuery) {
        this.$nextTick(() => {
          document.getElementById('product-list-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    },
    loadMoreProducts() { this.visibleProductCount += this.productsPerLoad; },
    selectCategory(category) {
      this.visibleProductCount = 10;
      this.currentCategory = category;
      this.searchQuery = ''; this.activeSearchQuery = '';
      this.view = 'products';
      this.$nextTick(() => {
        document.getElementById('product-list-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    triggerCartAnimation() {
      this.isCartAnimating = true;
      setTimeout(() => { this.isCartAnimating = false; }, 600);
    },
    backToCategories() {
      this.selectCategory({ id: 'all', name: 'Top bán chạy', description: 'Những sản phẩm được yêu thích và mua nhiều nhất.' });
      this.view = 'products';
    },

    showBestSellers() {
      this.isMiniCartOpen = false;
      this.currentCategory = { id: 'all', name: 'Top bán chạy' };
      this.activeFilter = 'best_selling';
      this.isShowingBestSellers = true;
      this.$nextTick(() => {
        document.getElementById('product-list-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },

    /* ========= IMAGE MODAL ========= */
    openImageModal(url) {
      this.currentImage = url;
      this.isImageModalOpen = true;
      document.body.style.overflow = 'hidden';
    },
    closeImageModal() {
      this.isImageModalOpen = false;
      setTimeout(() => { this.currentImage = ''; }, 300);
      document.body.style.overflow = 'auto';
    },

    /* ========= ADDON DETAIL MODAL ========= */
    openAddonDetail(addon) {
      if (this.isMiniCartOpen) this.preventMiniCartCloseOnClickOutside = true;
      this.currentAddonDetail = addon;
      this.isAddonDetailModalOpen = true;

      this.$nextTick(() => {
        const el = document.getElementById('addon-product-name');
        if (el && addon) el.textContent = addon.name;
      });

      document.body.style.overflow = 'hidden';
    },
    closeAddonDetail() {
      this.isAddonDetailModalOpen = false;
      setTimeout(() => { this.preventMiniCartCloseOnClickOutside = false; }, 100);
      if (!this.isMiniCartOpen) document.body.style.overflow = 'auto';
      setTimeout(() => { this.currentAddonDetail = null; }, 300);
    },

    /* ========= Item Options Modal Logic ========= */
    openItemOptionsModal(product) {
      this.currentItemForOptions = product;
      this.itemOptions = { quantity: 1, note: '' };
      this.isItemOptionsModalOpen = true;
      document.body.style.overflow = 'hidden';
    },

    closeItemOptionsModal() {
      this.isItemOptionsModalOpen = false;
      document.body.style.overflow = 'auto';
      setTimeout(() => {
        this.currentItemForOptions = null;
      }, 300);
    },

    addItemWithOptions() {
      if (!this.currentItemForOptions) return;
      const { id } = this.currentItemForOptions;
      const { quantity, note } = this.itemOptions;
      const cartId = `${id}-${Date.now()}`;
      this.addToCart({ ...this.currentItemForOptions, cartId: cartId, quantity: quantity, weight: note.trim() });
      this.closeItemOptionsModal();
    },

    /* ========= CART ========= */
    // product object can be a standard product or a pre-filled cart item from options modal
    addToCart(product) {
      // If it's a new item from the options modal, it will have a unique cartId
      if (product.cartId) {
        this.cart.push(product);
        this.selectedCartItems.push(product.cartId);
      } else {
        // Standard behavior: find by product ID and increment quantity
        const existingItem = this.cart.find(item => item.id === product.id && !item.weight); // Only merge if there's no note
        if (existingItem) {
          existingItem.quantity++;
        } else {
          const cartId = `${product.id}-${Date.now()}`;
          const newItem = { ...product, cartId: cartId, quantity: 1, weight: '' };
          this.cart.push(newItem);
          this.selectedCartItems.push(cartId);
        }
      }
      this.triggerCartAnimation();
      this.showAlert('Đã thêm sản phẩm vào giỏ hàng!', 'success');
    },
    toggleMiniCart() {
      this.isMiniCartOpen = !this.isMiniCartOpen;
      if (this.isMiniCartOpen) {
        this.miniCartError = '';
        this.selectedCartItems = this.cart.map(item => item.id);
        this.startSocialProofTimer();
      } else {
        this.stopSocialProofTimer();
      }
    },
    startSocialProofTimer() {
      // Dừng timer cũ nếu có
      this.stopSocialProofTimer();
      // Bắt đầu timer mới - thay đổi số lượng người xem sau mỗi 2 giây
      this.socialProofInterval = setInterval(() => {
        this.socialProofViewers = Math.floor(Math.random() * 5) + 1;
      }, 2000);
    },
    stopSocialProofTimer() {
      if (this.socialProofInterval) {
        clearInterval(this.socialProofInterval);
        this.socialProofInterval = null;
      }
    },
    toggleCartItemSelection(productId) {
      const idx = this.selectedCartItems.indexOf(productId);
      if (idx > -1) this.selectedCartItems.splice(idx, 1);
      else this.selectedCartItems.push(productId);
    },
    toggleSelectAll() {
      if (this.isAllSelected) this.selectedCartItems = [];
      else this.selectedCartItems = this.cart.map(i => i.id);
    },
    get isAllSelected() { return this.cart.length > 0 && this.selectedCartItems.length === this.cart.length; },
    checkoutSelected() {
      if (!this.selectedCartItems.length) { this.miniCartError = 'Vui lòng chọn 1 sản phẩm để mua hàng'; return; }
      this.miniCartError = ''; this.view = 'cart'; this.isMiniCartOpen = false;
    },
    get selectedCartProducts() { return this.cart.filter(i => this.selectedCartItems.includes(i.id)); },

    addAddonToCart(addon) {
      const ex = this.cart.find(i => i.id === addon.id);
      if (ex) { ex.quantity++; }
      else {
        this.cart.push({ ...addon, quantity: 1, weight: '' });
        this.selectedCartItems.push(addon.id);
      }
      this.triggerCartAnimation();
      this.showAlert(`Đã thêm ${addon.name} vào giỏ hàng! 🚚 Bạn được miễn phí ship!`, 'success');
    },
    isAddonInCart(addonId) { return this.cart.some(i => i.id === addonId); },
    isFreeshippingFromDiscount() {
      if (!this.appliedDiscountCode) return false;
      const d = this.availableDiscounts.find(d => d.code?.toUpperCase() === this.appliedDiscountCode);
      return !!(d && d.type === 'shipping');
    },
    removeFromCart(productId) {
      const isAddon = this.addonProducts.some(a => a.id === productId);
      const removed = this.cart.find(i => i.id === productId);

      this.cart = this.cart.filter(i => i.id !== productId);
      this.selectedCartItems = this.selectedCartItems.filter(id => id !== productId);
      this.revalidateAppliedDiscount();

      if (isAddon) {
        const hasOtherAddons = this.cart.some(i => this.addonProducts.some(a => a.id === i.id));
        if (!hasOtherAddons && !this.isFreeshippingFromDiscount()) {
          this.showAlert(`Đã xóa ${removed?.name || 'sản phẩm bán kèm'}. Phí vận chuyển có thể được áp dụng lại.`, 'info');
        } else {
          this.showAlert(`Đã xóa ${removed?.name || 'sản phẩm'} khỏi giỏ hàng.`, 'success');
        }
      } else {
        this.showAlert(`Đã xóa ${removed?.name || 'sản phẩm'} khỏi giỏ hàng.`, 'success');
      }

      if (this.cart.length === 0) this.resetDiscount();
    },
    increaseQuantity(productId) {
      const item = this.cart.find(i => i.id === productId);
      if (item) { item.quantity++; this.revalidateAppliedDiscount(); }
    },
    decreaseQuantity(productId) {
      const item = this.cart.find(i => i.id === productId);
      if (item && item.quantity > 1) { item.quantity--; this.revalidateAppliedDiscount(); }
      else if (item) { this.removeFromCart(productId); }
    },
    buyNow(product) {
      this.openItemOptionsModal(product);
      // Logic to proceed to checkout after adding will be handled by a flag if needed
      // For now, it just opens the modal for consistency.
    },
    clearCart() { this.cart = []; this.selectedCartItems = []; this.resetDiscount(); },
    backToShopping() {
      this.view = 'products';
      this.$nextTick(() => { document.getElementById('product-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    },

    /* ========= DISCOUNT ========= */
    // Chuẩn hoá discount record (tương thích dữ liệu cũ)
    _normalizeDiscount(d) {
      if (!d) return null;
      const code = (d.code || '').toUpperCase();
      let type = d.type;
      if (type === 'free_shipping') type = 'shipping';
      if (type === 'fixed_amount') type = 'fixed';
      return {
        code,
        type,                 // 'shipping' | 'fixed' | 'percentage' | 'gift'
        title: d.title ?? '',
        value: Number(d.value || 0),
        minOrder: Number(d.minOrder ?? d.min_order_value ?? 0),
        minItems: Number(d.minItems || 0),
        active: d.active !== false,
        visible: d.visible !== false
      };
    },

    applyDiscount() {
      // Đường cũ -> điều hướng sang đường chuẩn (giữ API để UI cũ không lỗi)
      this.applySelectedDiscount(false);
    },
    resetDiscount() {
      this.discountCode = '';
      this.appliedDiscountCode = '';
      this.appliedGift = null;
      this.discountAmount = 0;
      this.discountError = '';
    },
    openDiscountModal() {
      this.preventMiniCartCloseOnClickOutside = true;
      this.isDiscountModalOpen = true;
    },
    closeDiscountModal() {
      this.isDiscountModalOpen = false;
      this.discountError = '';
      // Đồng bộ lại code hiển thị với code đã áp dụng, xoá code lỗi
      this.discountCode = this.appliedDiscountCode;
      setTimeout(() => { this.preventMiniCartCloseOnClickOutside = false; }, 100);
    },
    selectDiscount(code) { this.discountCode = code; },

    applySelectedDiscount(andClose = false) {
      const code = this.discountCode.trim().toUpperCase();
      if (!code) { this.discountError = 'Vui lòng nhập hoặc chọn một mã khuyến mãi.'; return; }

      // Tìm trong danh sách khả dụng
      const raw = this.availableDiscounts.find(d => (d.code || '').toUpperCase() === code);
      const promotion = this._normalizeDiscount(raw);
      if (!promotion || !promotion.active) { this.discountError = 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.'; return; }

      // Điều kiện
      if (this.cartSubtotal() < promotion.minOrder) {
        this.discountError = `Ưu đãi này chỉ áp dụng cho đơn hàng từ ${this.formatCurrency(promotion.minOrder)}.`; return;
      }
      if (promotion.minItems && this.totalCartQuantity < promotion.minItems) {
        this.discountError = `Ưu đãi này chỉ áp dụng cho đơn hàng có từ ${promotion.minItems} sản phẩm trở lên.`; return;
      }

      // Kiểm tra và thông báo khi có mã bị ghi đè
      let replacementMessage = '';
      if (this.discountCode && this.discountCode !== code) {
        const currentPromotion = this.availableDiscounts.find(d => d.code?.toUpperCase() === this.discountCode.toUpperCase());
        const currentTitle = currentPromotion?.title || this.discountCode;
        replacementMessage = `Mã ${code} đã được áp dụng. Ưu đãi "${currentTitle}" đã được thay thế.`;
      }

      // Reset trước khi áp dụng mới
      this.resetDiscount();

      if (promotion.type === 'gift') {
        this.appliedGift = { title: promotion.title, value: promotion.value };
      } else {
        // Đặt appliedDiscountCode cho tất cả các loại mã (trừ gift)
        this.appliedDiscountCode = code;

        if (promotion.type === 'shipping') {
          // freeship được phản ánh qua getter freeShipping bằng appliedDiscountCode
          // appliedDiscountCode đã được đặt ở trên
        } else if (promotion.type === 'fixed') {
          this.discountAmount = promotion.value;
        } else if (promotion.type === 'percentage') {
          this.discountAmount = Math.floor(this.cartSubtotal() * promotion.value / 100);
        }
      }

      if (this.discountAmount > this.cartSubtotal()) this.discountAmount = this.cartSubtotal();
      this.discountCode = code; // giữ lại hiển thị
      if (replacementMessage) {
        this.showAlert(replacementMessage, 'success');
      } else {
        this.showAlert(`Đã áp dụng mã ${code}!`, 'success');
      }
      if (andClose) this.closeDiscountModal();
    },

    revalidateAppliedDiscount() {
      // Khi số lượng/tổng tiền thay đổi, đảm bảo mã hiện tại còn hợp lệ
      if (!this.appliedDiscountCode && !this.appliedGift && !this.discountAmount) return;

      if (this.appliedDiscountCode) {
        const raw = this.availableDiscounts.find(d => (d.code || '').toUpperCase() === this.appliedDiscountCode);
        const promotion = this._normalizeDiscount(raw);
        if (!promotion || !promotion.active) { this.resetDiscount(); return; }
        // Kiểm tra lại minOrder/minItems
        if (this.cartSubtotal() < promotion.minOrder || (promotion.minItems && this.totalCartQuantity < promotion.minItems)) {
          this.resetDiscount(); return;
        }
        // Nếu là % thì cập nhật lại giá trị
        if (promotion.type === 'percentage') {
          this.discountAmount = Math.floor(this.cartSubtotal() * promotion.value / 100);
        } else if (promotion.type === 'fixed') {
          this.discountAmount = promotion.value;
        } else if (promotion.type === 'shipping') {
          this.discountAmount = 0; // freeship thể hiện qua shippingDiscount
        }
        if (this.discountAmount > this.cartSubtotal()) this.discountAmount = this.cartSubtotal();
      }
      // Quà tặng: không phụ thuộc subtotal (giữ nguyên)
    },

    getDiscountAvailability(discount) {
      const d = this._normalizeDiscount(discount);

      // Chỉ tính sản phẩm chính (không phải addon) cho điều kiện áp mã
      const mainProducts = this.selectedCartProducts.filter(item =>
        !this.addonProducts.some(addon => addon.id === item.id) && !item.isGift
      );

      const mainSubtotal = mainProducts.reduce((total, item) => total + (item.price * item.quantity), 0);
      const mainQty = mainProducts.reduce((total, item) => total + item.quantity, 0);

      if (mainSubtotal < d.minOrder) return { available: false, reason: `Cần mua thêm ${this.formatCurrency(d.minOrder - mainSubtotal)} từ sản phẩm chính.` };
      if (d.minItems && mainQty < d.minItems) return { available: false, reason: `Cần thêm ${d.minItems - mainQty} sản phẩm chính.` };
      return { available: true, reason: '' };
    },
    getDiscountEffectiveValue(discount) {
      const p = this._normalizeDiscount(discount);
      switch (p.type) {
        case 'fixed':
        case 'addon_discount':
          return p.value;
        case 'percentage':
          return Math.floor(this.cartSubtotal() * p.value / 100);
        case 'shipping':
          return this.shippingFee();
        case 'gift':
          const giftProduct = this.products.find(prod => prod.sku === p.giftSku);
          return giftProduct ? giftProduct.price : 0;
        default: return 0;
      }
    },

    get sortedDiscounts() {
      const allVisible = this.availableDiscounts.filter(d => d.active && d.visible);

      const mapped = allVisible.map(d => ({
        ...d,
        availability: this.getDiscountAvailability(d),
        effectiveValue: this.getDiscountEffectiveValue(d)
      }));

      return mapped.sort((a, b) => {
        // Ưu tiên các mã có sẵn lên trên
        if (a.availability.available && !b.availability.available) return -1;
        if (!a.availability.available && b.availability.available) return 1;

        // Nếu cả hai đều có sẵn hoặc không, sắp xếp theo giá trị giảm dần
        return b.effectiveValue - a.effectiveValue;
      });
    },

    get isEligibleForAnyDiscount() {
      // Chỉ hiển thị nếu chưa có mã nào được áp dụng và có mã hợp lệ
      if (this.appliedDiscountCode || this.appliedGift) return false;
      return this.hasAnyApplicableDiscounts;
    },
    openCheckout() {
      // Không đóng miniCart để có thể quay lại (stack modal)
      this.preventMiniCartCloseOnClickOutside = true;
      this.socialProofViewers = Math.floor(Math.random() * 5) + 1;
      this.isCheckoutModalOpen = true;
      this.startSocialProofTimer();

      // Auto-focus vào field đầu tiên sau khi modal hiển thị
      this.$nextTick(() => {
        setTimeout(() => {
          const firstInput = this.$refs.firstInput;
          if (firstInput && !this.customer.name) {
            firstInput.focus();
          }
        }, 300); // Delay để đảm bảo animation hoàn thành
      });
    },


    /* ========= CHECKOUT ========= */
    validateAndShowConfirmModal() {
      // Clear previous errors
      this.clearFormErrors();

      // Validate form
      if (!this.validateForm()) {
        return; // Errors will be shown inline
      }

      // Giữ checkout modal mở để có thể quay lại (stack modal)
      // Chỉ mở confirm modal chồng lên trên
      this.isConfirmModalOpen = true;
    },

    clearFormErrors() {
      Object.keys(this.formErrors).forEach(key => {
        this.formErrors[key] = '';
      });
    },

    validateForm() {
      let isValid = true;

      // Validate cart
      if (!this.cart.length) {
        this.showAlert('Giỏ hàng của bạn đang trống.', 'error');
        return false;
      }

      // Validate name
      if (!this.customer.name.trim()) {
        this.formErrors.name = 'Vui lòng nhập họ và tên';
        isValid = false;
      }

      // Validate phone
      if (!this.customer.phone.trim()) {
        this.formErrors.phone = 'Vui lòng nhập số điện thoại';
        isValid = false;
      } else {
        const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
        if (!phoneRegex.test(this.customer.phone)) {
          this.formErrors.phone = 'Số điện thoại không hợp lệ';
          isValid = false;
        }
      }

      // Validate address
      if (!this.selectedProvince) {
        this.formErrors.province = 'Vui lòng chọn tỉnh/thành phố';
        isValid = false;
      }

      if (!this.selectedDistrict) {
        this.formErrors.district = 'Vui lòng chọn quận/huyện';
        isValid = false;
      }

      if (!this.selectedWard) {
        this.formErrors.ward = 'Vui lòng chọn phường/xã';
        isValid = false;
      }

      if (!this.streetAddress.trim()) {
        this.formErrors.streetAddress = 'Vui lòng nhập địa chỉ cụ thể';
        isValid = false;
      }

      // Validate payment method
      if (!this.paymentMethod) {
        this.formErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán';
        isValid = false;
      }

      return isValid;
    },

    async confirmAndSubmitOrder() {
      this.isSubmitting = true;
      this.updateFullAddress();

      const newOrderId = this.generateOrderId();
      this.lastOrderId = newOrderId;

      const orderDetails = {
        orderId: newOrderId,
        cart: (() => {
          const items = this.cart.map(i => ({
            name: i.name, price: this.formatCurrency(i.price), quantity: i.quantity, weight: i.weight
          }));
          if (this.appliedGift) items.push({ name: this.appliedGift.title, price: 'Miễn phí', quantity: 1, weight: 0 });
          return items;
        })(),
        customer: { name: this.customer.name, phone: this.customer.phone, email: this.customer.email, address: this.customer.address, notes: this.customer.notes },
        orderDate: new Date().toISOString(),
        subtotal: this.formatCurrency(this.cartSubtotal()),
        shipping: this.shippingFee() === 0 ? (this.freeShipping ? 'Miễn phí (FREESHIP)' : 'Miễn phí') : this.formatCurrency(this.shippingFee()),
        discount: this.discountAmount > 0 ? `-${this.formatCurrency(this.discountAmount)} (${this.appliedDiscountCode})` : 'Không có',
        total: this.formatCurrency(this.cartTotal()),
        paymentMethod: this.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'
      };

      const workerUrl = 'https://hidden-bonus-76d2.yendev96.workers.dev';

      try {
        const res = await fetch(workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderDetails)
        });
        if (!res.ok) {
          let msg = 'Có lỗi xảy ra khi gửi đơn hàng.';
          try { const er = await res.json(); msg = er.message || msg; } catch {}
          throw new Error(msg);
        }

        // Clear giỏ hàng ngay khi đặt hàng thành công
        this.cart = [];
        this.resetDiscount();

        // Không đóng confirm modal, để success modal hiển thị chồng lên
        this.$nextTick(() => {
            if (this.paymentMethod === 'bank_transfer') {
                this.isBankTransferModalOpen = true;
            } else {
                this.isSuccessModalOpen = true;
            }
        });

      } catch (e) {
        console.error('Lỗi gửi đơn hàng:', e);
        this.showAlert(`Lỗi gửi đơn hàng: ${e.message}`, 'error');
      } finally {
        this.isSubmitting = false;
      }
    },


    continueShoppingAndScroll() {
      // Tải lại trang để reset hoàn toàn
      window.location.reload();
    },
    cleanupAfterOrder() {
      this.cart = [];
      this.resetDiscount();
      this.view = 'products';
      window.scrollTo(0, 0);
    },
    closeSuccessModal() {
      // Tải lại trang để reset hoàn toàn
      window.location.reload();
    },
    closeBankTransferModal() {
      this.isBankTransferModalOpen = false;
      this.isSuccessModalOpen = true;
    },

    /* ========= SOCIAL PROOF ========= */
    startNotificationLoop() {
      const names = [
        'Mai Anh','Thuỳ Linh','Bảo Ngọc','Khánh An','Minh Châu','Gia Hân',
        'Ngọc Diệp','Phương Vy','Thảo Nguyên','Hà My','Tú Anh','Quỳnh Chi',
        'Yến Nhi','Lan Hương','Thanh Trúc','Diệu Linh','Bích Phương','Hoài An',
        'Tường Vy','Kim Ngân'
      ];
      const actions = [
        'vừa đặt mua 1 sản phẩm','vừa hoàn tất đơn hàng','vừa mua 2 sản phẩm',
        'đã mua Vòng Dâu Tằm Hạt Gốc','đã mua Vòng Mix Bạc Cho Bé'
      ];

      const showOnce = () => {
        if (this.isMiniCartOpen || this.isCheckoutModalOpen) return;
        const name = names[Math.floor(Math.random() * names.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        this.notification.message = `${name} ${action}`;
        this.notification.visible = true;
        setTimeout(() => { this.notification.visible = false; }, 4000);
      };

      setTimeout(() => {
        showOnce();
        const interval = Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;
        setInterval(showOnce, interval);
      }, 5000);
    },

    startSocialProofLoop() {
      const update = () => {
        this.socialProofCount = Math.floor(Math.random() * 4) + 2; // Random number between 2 and 5
        const randomInterval = Math.floor(Math.random() * (7000 - 3000 + 1)) + 3000; // between 3-7 seconds
        setTimeout(update, randomInterval);
      };
      setTimeout(update, 2500); // Initial delay
    },

    /* ========= COUNTDOWN ========= */
    startFreeshipCountdown() {
      if (!this.freeshipOfferEndTime || this.freeshipOfferEndTime < Date.now()) {
        this.freeshipOfferEndTime = Date.now() + 2 * 60 * 60 * 1000;
      }
      if (this.countdownTimer.interval) clearInterval(this.countdownTimer.interval);

      this.countdownTimer.interval = setInterval(() => {
        const remaining = this.freeshipOfferEndTime - Date.now();
        if (remaining <= 0) {
          this.countdownTimer.display = '00 : 00 : 00';
          this.freeshipOfferEndTime = Date.now() + 2 * 60 * 60 * 1000;
          return;
        }
        const hh = Math.floor((remaining / (1000 * 60 * 60)) % 24);
        const mm = Math.floor((remaining / 1000 / 60) % 60);
        const ss = Math.floor((remaining / 1000) % 60);
        this.countdownTimer.display =
          `${hh.toString().padStart(2, '0')} : ${mm.toString().padStart(2, '0')} : ${ss.toString().padStart(2, '0')}`;
      }, 1000);
    },

    /* ========= QUICK VIEW ========= */
    openQuickView(product) {
      this.quickViewProduct = product;
      this.isQuickViewOpen = true;
      document.body.style.overflow = 'hidden';
    },
    closeQuickView() {
      this.isQuickViewOpen = false;
      if (!this.isMiniCartOpen) document.body.style.overflow = 'auto';
      setTimeout(() => { this.quickViewProduct = null; }, 300);
    },

    /* ========= FAQ MODAL ========= */
    openFaqModal() {
      this.isFaqModalOpen = true;
      document.body.style.overflow = 'hidden';
    },
    closeFaqModal() {
      this.isFaqModalOpen = false;
      document.body.style.overflow = 'auto';
    },
    toggleFaq(index) {
      this.openFaqIndex = this.openFaqIndex === index ? null : index;
    },

    revalidateAppliedDiscount() {
      // Nếu không có mã nào đang được áp dụng, không làm gì cả
      if (!this.discountCode) return;

      // Tìm khuyến mãi tương ứng với mã đang áp dụng
      const promotion = this.availableDiscounts.find(d => d.code.toUpperCase() === this.discountCode.toUpperCase());

      // Nếu không tìm thấy (trường hợp lạ), reset cho an toàn
      if (!promotion) {
        this.resetDiscount();
        return;
      }

      // Kiểm tra xem giỏ hàng có còn đủ điều kiện không
      const availability = this.getDiscountAvailability(promotion);
      if (!availability.available) {
        const promotionTitle = promotion.title || promotion.code;
        this.resetDiscount();
        this.showAlert(`Ưu đãi "${promotionTitle}" đã được gỡ bỏ vì giỏ hàng không còn đủ điều kiện.`, 'info');
      } else {
        // Áp dụng lại giá trị giảm giá
        const p = this._normalizeDiscount(promotion);
        if (p.type === 'fixed') {
          this.discountAmount = p.value;
        } else if (p.type === 'percentage') {
          this.discountAmount = Math.floor(this.cartSubtotal() * p.value / 100);
        }
        if (this.discountAmount > this.cartSubtotal()) {
          this.discountAmount = this.cartSubtotal();
        }
      }
    },

    /* ========= ADDRESS CONSISTENCY ========= */
    validateAddressConsistency() {
      // Kiểm tra nếu có customer.address nhưng dropdown values bị mất
      if (this.customer.address && (!this.selectedProvince || !this.selectedDistrict || !this.selectedWard)) {
        this.customer.address = '';
      }

      // Ngược lại, nếu có đầy đủ dropdown values thì update address
      if (this.selectedProvince && this.selectedDistrict && this.selectedWard && this.streetAddress) {
        this.updateFullAddress();
      }
    }
  }));
});

