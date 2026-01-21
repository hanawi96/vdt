document.addEventListener('alpine:init', () => {
  Alpine.data('shop', () => ({
    /* ========= CẤU HÌNH ========= */
    SHIPPING_FEE: 0, // Sẽ được load từ API khi init
    systemConfig: null, // Lưu config từ API

    // Helper: Lấy API URL dựa trên môi trường
    getApiUrl(endpoint) {
      // LUÔN LUÔN dùng Worker URL cho tất cả API calls
      // Worker có full access đến D1 database
      return `https://shop-order-api.yendev96.workers.dev${endpoint}`;
    },

    /* ========= STATE ========= */
    view: 'products',

    /* ========= REFERRAL SYSTEM ========= */
    referralCode: '',

    // Partners data - CHỈ DÙNG CHO HIỂN THỊ UI
    // Dữ liệu thực sự được lấy từ Cloudflare D1 database qua Worker API
    // Validation và tính hoa hồng thực tế được xử lý bởi Worker
    partners: {},

    /* ========= BABY NAME MODAL STATE ========= */
    isBabyNameModalOpen: false,
    babyNameInput: '',
    babyNameError: '',
    babyNameProductInfo: {},
    pendingBabyNameProduct: null,

    // Danh sách các sản phẩm cần khắc tên
    babyNameRequiredProducts: [
      'Thẻ hình rắn khắc tên bé mặt sau',
      'Thẻ 4 lá khắc tên bé (2 mặt)',
      'Thẻ tròn khắc tên bé (2 mặt)'
    ],

    categories: [
      { id: 'all', name: 'Tất cả sản phẩm', isPopular: true, image: './assets/images/product_img/tat-ca-mau.webp' },
      { id: 'vong_tron', name: 'Vòng trơn', isPopular: true, image: './assets/images/product_img/vong_tron_co_dien_day_do.webp' },
      { id: 'mix_bi_bac', name: 'Mix bi bạc', isPopular: true, image: './assets/images/product_img/Sole bac/vong_dau_tam_sole_bac_3ly_co_gian.webp' },
      { id: 'mix_charm_ran', name: 'Mix charm rắn', isPopular: true, image: './assets/images/product_img/charm ran/vong-dau-tam-tron-charm-ran.webp' },
      { id: 'vong_co_gian', name: 'Vòng co giãn', image: './assets/images/product_img/co gian/vong_tron_co_gian.webp' },
      { id: 'mix_day_ngu_sac', name: 'Mix dây ngũ sắc', image: './assets/images/product_img/vong-ngu-sac/ngu-sac-mix-1-hat-dau.webp' },
      { id: 'mix_hat_bo_de', name: 'Mix hạt bồ đề', image: './assets/images/product_img/bo de/vong_dau_tam_sole_9_hat_bo_de.webp' },
      { id: 'hat_dau_tam_mai_san', name: 'Hạt dâu tằm mài sẵn', image: './assets/images/product_img/hat_dau_tam.webp' },
      { id: 'mix_charm_chuong', name: 'Mix charm chuông', image: './assets/images/product_img/chuong/vong-tron-charm-chuong.webp' },
      { id: 'mix_ho_phach', name: 'Mix hổ phách', image: './assets/images/product_img/Sole ho phach/vong-mix-ho-phach.webp' },
      { id: 'mix_thanh_gia', name: 'Mix thánh giá', image: './assets/images/product_img/thanh-gia/sole-3ly-thanh-gia-co-gian.webp' },
      { id: 'mix_hoa_sen', name: 'Mix hoa sen', image: './assets/images/product_img/hoa-sen/sole-bac-3ly-hoa-sen-co-gian.webp' },
      { id: 'mix_da_do_tu_nhien', name: 'Mix đá đỏ tự nhiên', image: './assets/images/product_img/da do/vong_dau_tam_tron_da_do.webp' },
      { id: 'mix_chi_mau_cac_loai', name: 'Mix chỉ màu các loại', image: './assets/images/product_img/tat-ca-mau.webp' },
      { id: 'mix_the_ten_be', name: 'Mix thẻ tên bé', image: './assets/images/product_img/the-ten/vong-tron-mix-the-ten-tron.webp' },
      { id: 'vong_nguoi_lon', name: 'Vòng người lớn', image: './assets/images/product_img/nguoi-lon/vong-tron-nguoi-lon.webp' },
      { id: 'san_pham_ban_kem', name: 'Sản phẩm bán kèm', image: './assets/images/product_img/bo-dau-tam-de-phong.webp' },
      { id: 'bi_charm_bac', name: 'Bi, charm bạc', image: './assets/images/product_img/bi-bac/bi-bac-ta.webp' }
    ],



    products: [],
    shopInfo: { stats: {} },
    cart: Alpine.$persist([]).as('shoppingCart'),
    selectedCartItems: Alpine.$persist([]).as('selectedCartItems'),
    miniCartError: '',
    activeTab: 'combo', // Default active tab
    currentCategory: {
      id: 'all',
      name: 'Tất cả sản phẩm',
      description: 'Những sản phẩm được yêu thích và mua nhiều nhất.'
    },
    activeFilter: 'best_selling',
    sortBy: 'default', // 'default', 'price_asc', 'price_desc'
    visibleProductCount: 8,
    productsPerLoad: 8,
    loading: true,
    error: null,
    isSubmitting: false,
    searchQuery: '',
    activeSearchQuery: '',
    isShowingTopSelling: false,
    isComboImageModalOpen: false,
    isBuyingCombo: false,
    currentComboTitle: '',
    currentComboType: '',
    currentComboImages: {
      product1: { image: '', name: '', description: '', benefits: [] },
      product2: { image: '', name: '', description: '', benefits: [] },
      originalPrice: 0,
      shippingFee: 0,
      totalWithoutCombo: 0,
      comboPrice: 0,
      savings: 0
    },

    /* ========= MODALS ========= */
    // Z-index hierarchy: 9000 (base modals) -> 9400 (discount) -> 9500 (mini cart) -> 9600 (checkout) -> 9900 (quick buy) -> 9950 (quick buy transfer) -> 9990 (confirm) -> 9999 (success)
    // All modals use consistent backdrop: bg-black bg-opacity-60 backdrop-blur-sm
    // Success Modal stacks on top of Confirm Modal (both visible simultaneously)
    // Bank transfer info is now inline in checkout/quick buy modals (no separate modal)

    // Core modals (z-9000)
    isImageModalOpen: false,
    currentImage: '',
    isAlertModalOpen: false,
    alertModalMessage: '',
    alertModalType: 'success',

    // Order flow modals (z-9900+)
    isSuccessModalOpen: false,
    isConfirmModalOpen: false,
    lastOrderId: '',

    // Shopping modals (z-9500-9600)
    isCheckoutModalOpen: false,
    isMiniCartOpen: false,
    checkoutOpenedFromConfirm: false,
    miniCartTimeout: null,
    isDiscountModalOpen: false,
    isCartAnimating: false,
    isShowingBestSellers: false,
    preventMiniCartCloseOnClickOutside: false,


    isItemOptionsModalOpen: false,
    currentItemForOptions: null,
    itemOptions: { quantity: 1, note: '' },
    showSizeGuide: false,

    // Hand Size Modal state
    isHandSizeModalOpen: false,
    currentItemForHandSize: null,
    handSizeOptions: { quantity: 1, note: '', selectedSize: '' },
    showHandSizeGuide: false,

    // Bead Quantity Modal state
    isBeadQuantityModalOpen: false,
    currentBeadProduct: null,
    beadOptions: {
      quantity: 14, // Mặc định 14 hạt cho sơ sinh
      note: ''
    },


    // Weight Preset Modal state (for mix_day_ngu_sac)
    isWeightPresetModalOpen: false,
    currentWeightPresetProduct: null,
    weightPresetOptions: {
      quantity: 1,
      weight: 'Dưới 4kg', // Default value
      note: ''
    },


    // State for editing weight in cart
    isEditingWeightInCart: false,
    editingCartItemId: null,


    // State for editing hand size in cart
    isEditingHandSizeInCart: false,
    editingCartItemIdForHandSize: null,


    // State for editing default item options in cart
    isEditingOptionsInCart: false,
    editingCartItemIdForOptions: null,

    // Process Showcase Modal
    isProcessModalOpen: false,
    socialProofViewers: Math.floor(Math.random() * 5) + 1,
    socialProofInterval: null,

    // Copy success states
    quickBuyCopySuccess: false,
    checkoutCopySuccess: false,

    // Quick Buy state
    isQuickBuyModalOpen: false,
    isSizingGuideModalOpen: false,
    isSizingGuideModalOpen: false,
    isSizingGuideModalOpen: false,
    quickBuyProduct: null,
    quickBuyQuantity: 1,
    quickBuyWeight: '',
    quickBuyCustomWeight: '', // Biến để lưu cân nặng tùy chỉnh
    quickBuyBabyName: '', // Tên bé cần khắc cho sản phẩm mix thẻ tên bé
    quickBuyNotes: '',
    quickBuyPaymentMethod: 'cod', // Phương thức thanh toán cho quick buy
    isQuickBuySubmitting: false,
    isQuickBuyTransferConfirmed: false, // Flag để track đã xác nhận chuyển khoản ở quick buy
    isCheckoutTransferConfirmed: false, // Flag để track đã xác nhận chuyển khoản ở checkout
    isCheckoutConfirmTransferModalOpen: false, // Modal xác nhận chuyển khoản cho checkout
    isDiscountModalFromQuickBuy: false, // Flag để biết modal discount được mở từ đâu
    preventQuickBuyCloseOnEscape: false, // Flag để ngăn đóng Quick Buy khi có modal con
    quickBuySelectedAddons: [], // Addon được chọn trong Quick Buy

    // Addon Quantity Modal state
    isAddonQuantityModalOpen: false,
    currentAddonForQuantity: null,
    addonQuantityOptions: {
      quantity: 1
    },


    // FAQ Modal
    isFaqModalOpen: false,
    faqOpenItems: [], // Stores indices of open items


    isWeightSelectionModalOpen: false,
    weightSelectionProduct: null,
    selectedWeight: '',
    weightSelectionOptions: [],

    showWeightInQuickBuy: true, // Biến để kiểm soát hiển thị ô cân nặng
    isAdultInQuickBuy: false, // Biến để kiểm soát hiển thị size tay cho người lớn
    // Weight options từ 3kg đến 15kg (tăng 0.5kg) + option "Chưa sinh"
    get weightOptions() {
      // Tùy chọn cho danh mục 'mix_day_ngu_sac'
      if (this.quickBuyProduct?.category === 'mix_day_ngu_sac') {
        return [
          'Dưới 4kg',
          'Từ 4kg đến 8kg',
          'Từ 8kg đến 12kg',
          'Từ 12kg đến 20kg',
          'Từ 20kg đến 30kg',
          'Từ 30kg đến 40kg',
          'Từ 40kg đến 50kg',
          'Từ 50kg đến 60kg',
          'Từ 60kg đến 70kg',
          'Từ 70kg đến 90kg'
        ];
      }

      // Tùy chọn mặc định cho các sản phẩm khác
      const options = ['🤱 Chưa sinh'];
      for (let weight = 3; weight <= 15; weight += 0.5) {
        options.push(`${weight}kg`);
      }
      for (let weight = 16; weight <= 19; weight++) {
        options.push(`${weight}kg (+20k)`);
      }
      options.push('✏️ Nhập cân nặng > 20kg');
      return options;
    },

    // Size tay options cho vòng người lớn
    get handSizeList() {
      return ['13cm', '14cm', '15cm', '16cm', '17cm', '18cm', '19cm', '20cm'];
    },

    // Kiểm tra xem sản phẩm có phải là vòng người lớn không
    isAdultProduct(product) {
      if (!product) return false;
      return product.category === 'vong_nguoi_lon' ||
        (product.categories && product.categories.includes('vong_nguoi_lon'));
    },

    /* ========= Hand Size Modal Logic ========= */
    openHandSizeModal(product) {
      this.currentItemForHandSize = product;
      this.handSizeOptions = {
        quantity: 1,
        note: '',
        selectedSize: '',
        customSize: ''
      };
      this.showHandSizeGuide = false; // Reset size guide when opening modal
      this.isHandSizeModalOpen = true;
      document.body.style.overflow = 'hidden';
    },

    closeHandSizeModal() {
      this.isHandSizeModalOpen = false;
      this.showHandSizeGuide = false;
      this.currentItemForHandSize = null;
      this.handSizeOptions = {
        quantity: 1,
        note: '',
        selectedSize: ''
      };
      document.body.style.overflow = '';

      // Reset editing state
      this.isEditingHandSizeInCart = false;
      this.editingCartItemIdForHandSize = null;
    },

    selectHandSize(size) {
      this.handSizeOptions.selectedSize = size;
    },

    /* ========= Weight Preset Modal Logic ========= */
    openWeightPresetModal(product) {
      this.currentWeightPresetProduct = product;
      this.weightPresetOptions = {
        weight: 'Dưới 4kg' // Default value
      };
      this.isWeightPresetModalOpen = true;
      document.body.style.overflow = 'hidden';
    },

    closeWeightPresetModal() {
      this.isWeightPresetModalOpen = false;
      this.currentWeightPresetProduct = null;
      document.body.style.overflow = '';

      // Reset editing state
      this.isEditingWeightInCart = false;
      this.editingCartItemId = null;
    },

    selectWeightPreset(weight) {
      this.weightPresetOptions.weight = weight;
    },

    /* ========= Addon Quantity Modal Logic ========= */
    openAddonQuantityModal(addon) {
      this.currentAddonForQuantity = addon;
      this.addonQuantityOptions = {
        quantity: addon.quantity || 1
      };
      this.isAddonQuantityModalOpen = true;
      this.preventQuickBuyCloseOnEscape = true; // Ngăn đóng Quick Buy modal
      document.body.style.overflow = 'hidden';
    },

    closeAddonQuantityModal() {
      this.isAddonQuantityModalOpen = false;
      this.currentAddonForQuantity = null;
      this.addonQuantityOptions = {
        quantity: 1
      };
      this.preventQuickBuyCloseOnEscape = false; // Cho phép đóng Quick Buy modal trở lại
      document.body.style.overflow = 'hidden'; // Giữ overflow hidden vì Quick Buy modal vẫn mở
    },

    selectAddonQuantity(quantity) {
      this.addonQuantityOptions.quantity = quantity;
    },

    updateAddonQuantity() {
      if (!this.currentAddonForQuantity) return;

      // Tìm addon trong quickBuySelectedAddons và cập nhật số lượng
      const addonIndex = this.quickBuySelectedAddons.findIndex(addon => addon.id === this.currentAddonForQuantity.id);
      if (addonIndex !== -1) {
        this.quickBuySelectedAddons[addonIndex].quantity = this.addonQuantityOptions.quantity;
        this.showAlert(`Đã cập nhật số lượng ${this.currentAddonForQuantity.name} thành ${this.addonQuantityOptions.quantity}`, 'success');

        // Revalidate discount khi thay đổi số lượng addon
        this.revalidateQuickBuyDiscount();
      }

      this.closeAddonQuantityModal();
    },

    // Scroll to quantity dropdown in Quick Buy modal
    scrollToQuantityDropdown() {
      this.$nextTick(() => {
        const quantitySection = document.getElementById('quick-buy-quantity-section');
        if (quantitySection) {
          quantitySection.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Focus vào dropdown sau khi scroll
          setTimeout(() => {
            const selectElement = quantitySection.querySelector('select');
            if (selectElement) {
              selectElement.focus();
            }
          }, 500);
        }
      });
    },

    addWeightPresetProductToCart() {
      if (this.isEditingWeightInCart) {
        // Logic to update existing item in cart
        const itemToUpdate = this.cart.find(item => item.cartId === this.editingCartItemId);
        if (itemToUpdate) {
          itemToUpdate.selectedWeight = this.weightPresetOptions.weight;
          this.showAlert(`Đã cập nhật cân nặng cho ${itemToUpdate.name}.`, 'success');
        } else {
          this.showAlert('Không tìm thấy sản phẩm để cập nhật.', 'error');
        }
      } else {
        // Logic to add new item to cart
        if (!this.currentWeightPresetProduct) return;

        const itemToAdd = {
          ...this.currentWeightPresetProduct,
          cartId: `${this.currentWeightPresetProduct.id}-${Date.now()}`,
          quantity: 1,
          note: '',
          weight: this.weightPresetOptions.weight,
          selectedWeight: this.weightPresetOptions.weight,
          basePrice: this.currentWeightPresetProduct.price,
          finalPrice: this.currentWeightPresetProduct.price
        };

        this.addToCart(itemToAdd);
        this.showAlert(`Đã thêm ${itemToAdd.name} vào giỏ hàng!`, 'success');
        if (this.isProductDetailOpen) {
          this.closeProductDetail();
        }
      }

      this.closeWeightPresetModal();
    },

    openWeightModalForEdit(item) {
      this.isEditingWeightInCart = true;
      this.editingCartItemId = item.cartId;

      const productInfo = this.products.find(p => p.id === item.id);
      if (!productInfo) {
        this.showAlert('Không tìm thấy thông tin sản phẩm để chỉnh sửa.', 'error');
        return;
      }

      this.currentWeightPresetProduct = productInfo;
      this.weightPresetOptions = {
        weight: item.selectedWeight || 'Dưới 4kg'
      };

      this.isWeightPresetModalOpen = true;
      document.body.style.overflow = 'hidden';
    },

    addItemWithHandSize() {
      if (this.isEditingHandSizeInCart) {
        // Logic to update existing item in cart
        const itemToUpdate = this.cart.find(item => item.cartId === this.editingCartItemIdForHandSize);
        if (itemToUpdate) {
          if (!this.handSizeOptions.selectedSize) {
            this.showAlert('Vui lòng chọn size tay', 'error');
            return;
          }
          itemToUpdate.selectedSize = this.handSizeOptions.selectedSize;
          itemToUpdate.handSize = this.handSizeOptions.selectedSize;
          itemToUpdate.selectedWeight = this.handSizeOptions.selectedSize; // for compatibility
          this.showAlert(`Đã cập nhật size tay cho ${itemToUpdate.name}.`, 'success');
        } else {
          this.showAlert('Không tìm thấy sản phẩm để cập nhật.', 'error');
        }
      } else {
        // Logic to add new item to cart
        if (!this.currentItemForHandSize) return;
        if (!this.handSizeOptions.selectedSize) {
          this.showAlert('Vui lòng chọn size tay', 'error');
          return;
        }
        const { id } = this.currentItemForHandSize;
        const finalSize = this.handSizeOptions.selectedSize;
        const cartId = `${id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const itemToAdd = {
          ...this.currentItemForHandSize,
          cartId: cartId,
          quantity: this.handSizeOptions.quantity,
          note: this.handSizeOptions.note,
          selectedSize: this.handSizeOptions.selectedSize,
          handSize: finalSize,
          weight: finalSize, // Use size as weight for compatibility
          selectedWeight: this.handSizeOptions.selectedSize, // For compatibility
          basePrice: this.currentItemForHandSize.price,
          finalPrice: this.currentItemForHandSize.price,
          customWeight: '',
          surcharge: 0,
          hasSurcharge: false
        };
        const productName = this.currentItemForHandSize.name;
        this.addToCart(itemToAdd);
        if (this.isProductDetailOpen) {
          this.closeProductDetail();
        }
        this.showAlert(`Đã thêm ${productName} (${finalSize}) vào giỏ hàng!`, 'success');
      }

      this.closeHandSizeModal();
    },

    openHandSizeModalForEdit(item) {
      this.isEditingHandSizeInCart = true;
      this.editingCartItemIdForHandSize = item.cartId;

      const productInfo = this.products.find(p => p.id === item.id);
      if (!productInfo) {
        this.showAlert('Không tìm thấy thông tin sản phẩm để chỉnh sửa.', 'error');
        return;
      }

      this.currentItemForHandSize = productInfo;
      this.handSizeOptions = {
        quantity: item.quantity,
        note: item.note,
        selectedSize: item.selectedSize || '',
        customSize: ''
      };

      this.showHandSizeGuide = false;
      this.isHandSizeModalOpen = true;
      document.body.style.overflow = 'hidden';
    },

    // Kiểm tra xem sản phẩm có phải là sản phẩm bán kèm không
    isAddonProduct(product) {
      if (!product) return false;
      return product.isAddon === true ||
        product.category === 'san_pham_ban_kem' ||
        product.category === 'bi_charm_bac' ||
        (product.categories && product.categories.includes('san_pham_ban_kem')) ||
        (product.categories && product.categories.includes('bi_charm_bac'));
    },

    // Kiểm tra xem sản phẩm có chứa bạc thật không
    hasRealSilver(product) {
      return product && product.hasSilver === true;
    },

    // Lấy loại bạc của sản phẩm
    getSilverType(product) {
      if (!product || !product.hasSilver) return null;

      // Sử dụng trường silverType nếu có, mặc định là S999
      return product.silverType ? product.silverType.toUpperCase() : 'S999';
    },

    // Tạo HTML cho badge "Bạc thật"
    createSilverBadge() {
      return `
        <div class="real-silver-badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Bạc thật
        </div>
      `;
    },

    // Kiểm tra xem có nên hiển thị lưu ý về "Sinh Lão Bệnh Tử" không
    shouldShowBeadCountNote(product) {
      if (!product) return false;

      // Ẩn lưu ý đối với các danh mục không phù hợp
      const hideNoteCategories = ['san_pham_ban_kem', 'bi_charm_bac'];

      // Kiểm tra category trực tiếp
      if (hideNoteCategories.includes(product.category)) {
        return false;
      }

      // Kiểm tra trong mảng categories (nếu có)
      if (product.categories && product.categories.some(cat => hideNoteCategories.includes(cat))) {
        return false;
      }

      // Kiểm tra các sản phẩm addon cụ thể
      if (product.isAddon === true ||
        product.id === 'addon_moc_chia_khoa' ||
        product.id === 'addon_tui_dau_tam') {
        return false;
      }

      // Hiển thị lưu ý cho tất cả các sản phẩm khác (vòng dâu và hạt dâu tằm)
      return true;
    },

    // Kiểm tra xem sản phẩm có phải là hạt dâu tằm mài sẵn không
    isBeadProduct(product) {
      if (!product) return false;
      return product.category === 'hat_dau_tam_mai_san' ||
        (product.categories && product.categories.includes('hat_dau_tam_mai_san'));
    },

    // Kiểm tra xem sản phẩm có cần chọn cân nặng (dây ngũ sắc) không
    isWeightSelectProduct(product) {
      if (!product) return false;
      return product.category === 'mix_day_ngu_sac' ||
        (product.categories && product.categories.includes('mix_day_ngu_sac'));
    },

    // Dynamic Pricing Configuration
    pricingConfig: {
      standardMaxWeight: 15, // Từ 16kg trở lên mới tính phụ thu (15kg vẫn là giá chuẩn)
      largeSizeSurcharge: 20000,
      description: {
        standard: "Size tiêu chuẩn",
        large: "Size lớn (phụ thu 20k)"
      }
    },

    // Quick Buy calculations - tính riêng cho mua ngay với dynamic pricing
    get isEngravingProductInQuickBuy() {
      return this.quickBuyProduct && this.requiresBabyName(this.quickBuyProduct);
    },

    get quickBuySubtotal() {
      if (!this.quickBuyProduct) return 0;

      // Determine actual weight for calculation
      let actualWeight = this.quickBuyWeight;
      if (this.quickBuyWeight === '✏️ Nhập cân nặng > 20kg' && this.quickBuyCustomWeight) {
        actualWeight = this.quickBuyCustomWeight + 'kg';
      }

      // Calculate dynamic price based on selected weight (giống như cart)
      const priceData = this.calculateDynamicPrice(this.quickBuyProduct, actualWeight);
      const finalPrice = priceData.finalPrice || this.quickBuyProduct.price || 0;

      // CHỈ tính sản phẩm chính, KHÔNG bao gồm addon (addon được tính riêng trong quickBuyTotal)
      const mainProductTotal = finalPrice * (this.quickBuyQuantity || 1);

      return mainProductTotal;
    },

    // Tổng giá trị đơn hàng (sản phẩm chính + addon) - dùng để tính discount
    get quickBuyOrderValue() {
      const mainProductTotal = this.quickBuySubtotal;
      const addonTotal = this.quickBuySelectedAddons.reduce((total, addon) => total + ((addon.price || 0) * (addon.quantity || 1)), 0);
      return mainProductTotal + addonTotal;
    },

    // Get addon products in cart for Quick Buy
    get quickBuyAddons() {
      // Luôn hiển thị addon được chọn trong Quick Buy (độc lập với giỏ hàng)
      return this.quickBuySelectedAddons;
    },

    // Get filtered addon products (exclude túi dâu tằm when buying combo)
    get filteredAddonProducts() {
      let filtered = this.addonProducts;

      if (this.isBuyingCombo) {
        // Khi đang mua combo, chỉ hiển thị móc chìa khóa
        filtered = filtered.filter(addon => addon.id === 'addon_moc_chia_khoa');
      }

      // Nếu đang ở modal chi tiết sản phẩm, KHÔNG ẩn addon (chỉ đổi button)
      if (this.isProductDetailOpen) {
        return filtered; // Trả về tất cả addon, không filter
      }

      // Nếu ở modal giỏ hàng hoặc context khác, ẩn addon đã có trong giỏ hàng
      filtered = filtered.filter(addon => {
        const isInCart = this.cart.some(item => {
          // Kiểm tra ID trực tiếp
          if (item.id === addon.id) return true;

          // Kiểm tra cartId bắt đầu bằng addon.id
          if (item.cartId && item.cartId.startsWith(addon.id + '-')) return true;

          // Kiểm tra tên sản phẩm (fallback)
          if (item.name === addon.name) return true;

          return false;
        });

        return !isInCart;
      });

      return filtered;
    },

    // Get filtered addon products for Quick Buy (hide already selected)
    get filteredAddonProductsForQuickBuy() {
      let filtered = this.addonProducts;

      if (this.isBuyingCombo) {
        // Khi đang mua combo, chỉ hiển thị móc chìa khóa
        filtered = filtered.filter(addon => addon.id === 'addon_moc_chia_khoa');
      }

      // Ẩn các addon đã được chọn trong Quick Buy
      filtered = filtered.filter(addon => !this.quickBuySelectedAddons.some(selected => selected.id === addon.id));

      return filtered;
    },

    // Get filtered addon products for Product Detail (exclude already selected)
    get filteredAddonProductsForProductDetail() {
      let filtered = this.addonProducts;

      if (this.isBuyingCombo) {
        // Khi đang mua combo, chỉ hiển thị móc chìa khóa
        filtered = filtered.filter(addon => addon.id === 'addon_moc_chia_khoa');
      }

      // KHÔNG ẩn các addon đã được chọn - chỉ thay đổi button từ "Thêm" thành "Xóa"
      // filtered = filtered.filter(addon => !this.productDetailSelectedAddons.some(selected => selected.id === addon.id));

      return filtered;
    },

    // Check if addon is in cart (modified for modal context)
    isAddonInCartForDisplay(addonId) {
      // Khi trong Quick Buy modal, kiểm tra quickBuySelectedAddons
      if (this.isQuickBuyModalOpen) {
        return this.quickBuySelectedAddons.some(addon => addon.id === addonId);
      }

      // Khi trong Product Detail modal, kiểm tra productDetailSelectedAddons
      if (this.isProductDetailOpen) {
        return this.productDetailSelectedAddons.some(addon => addon.id === addonId);
      }

      // Bình thường kiểm tra giỏ hàng
      return this.cart.some(i => i.id === addonId);
    },

    // Check if has addon discount for Quick Buy
    get quickBuyAddonDiscount() {
      // Luôn kiểm tra addon được chọn trong Quick Buy
      const hasKeychain = this.quickBuySelectedAddons.some(addon => addon.id === 'addon_moc_chia_khoa');
      return hasKeychain ? 5000 : 0;
    },

    get quickBuyAvailableDiscounts() {
      return this.availableDiscounts.map(discount => {
        const promotion = this._normalizeDiscount(discount);
        if (!promotion || !promotion.active) {
          return { ...discount, availability: { available: false, reason: 'Mã không hợp lệ' } };
        }

        // Tính theo Quick Buy order value (bao gồm cả addon) thay vì chỉ subtotal
        const available = this.quickBuyOrderValue >= promotion.minOrder &&
          (!promotion.minItems || this.quickBuyQuantity >= promotion.minItems);

        const reason = !available
          ? (this.quickBuyOrderValue < promotion.minOrder
            ? `Cần mua thêm ${this.formatCurrency(promotion.minOrder - this.quickBuyOrderValue)}`
            : `Cần thêm ${promotion.minItems - this.quickBuyQuantity} sản phẩm`)
          : '';

        return {
          ...discount,
          availability: { available, reason },
          effectiveValue: available ? this.calculateQuickBuyDiscountValue(promotion) : 0
        };
      });
    },

    calculateQuickBuyDiscountValue(promotion) {
      if (promotion.type === 'shipping') return this.SHIPPING_FEE;
      if (promotion.type === 'fixed') return Math.min(promotion.value, this.quickBuyOrderValue);
      if (promotion.type === 'percentage') return Math.floor(this.quickBuyOrderValue * promotion.value / 100);
      return 0;
    },

    // Quick Buy shipping logic - riêng biệt với cart
    get quickBuyFreeShipping() {
      // Freeship từ mã giảm giá
      const discountFreeship = this.availableDiscounts.find(d => d.code?.toUpperCase() === this.appliedDiscountCode && d.type === 'shipping');

      // Freeship từ addon túi dâu tằm được chọn trong Quick Buy
      const addonFreeship = this.quickBuySelectedAddons.some(addon =>
        addon.id === 'addon_tui_dau_tam' ||
        addon.id === 'addon_bo_dau_tam_7_canh' ||
        addon.id === 'addon_bo_dau_tam_9_canh'
      );

      return !!(discountFreeship || addonFreeship);
    },

    get quickBuyShippingFee() {
      return this.quickBuyFreeShipping ? 0 : this.SHIPPING_FEE;
    },

    get quickBuyShippingDiscount() {
      return this.quickBuyFreeShipping ? this.SHIPPING_FEE : 0;
    },

    get quickBuyTotal() {
      const subtotal = this.quickBuySubtotal; // Chỉ sản phẩm chính
      const addonTotal = this.quickBuySelectedAddons.reduce((total, addon) => total + ((addon.price || 0) * (addon.quantity || 1)), 0); // Tổng addon
      const shipping = this.SHIPPING_FEE; // Luôn cộng phí ship đầy đủ
      const shippingDiscount = this.quickBuyShippingDiscount; // Rồi trừ freeship nếu có
      const comboShippingDiscount = (this.quickBuyProduct && this.quickBuyProduct.freeShipping) ? this.SHIPPING_FEE : 0; // Freeship cho combo
      const discount = this.discountAmount;
      const addonDiscount = this.quickBuyAddonDiscount; // Giảm giá từ addon
      const total = subtotal + addonTotal + shipping - shippingDiscount - comboShippingDiscount - discount - addonDiscount;
      return total > 0 ? total : 0;
    },

    // Get addon products from products.json - tối ưu hóa để tránh trùng lặp dữ liệu
    get addonProducts() {
      if (!this.products || this.products.length === 0) return [];

      // Mapping ID để đảm bảo tính nhất quán với hệ thống hiện tại
      const idMapping = {
        'san_pham_ban_kem_001': 'addon_tui_dau_tam',
        'san_pham_ban_kem_002': 'addon_moc_chia_khoa',
        'san_pham_ban_kem_004': 'addon_bo_dau_tam_7_canh',
        'san_pham_ban_kem_005': 'addon_bo_dau_tam_9_canh'
      };

      // Lấy các sản phẩm addon từ products.json
      return this.products.filter(product =>
        product.category === 'san_pham_ban_kem' ||
        (product.categories && product.categories.includes('san_pham_ban_kem'))
      ).map(product => ({
        ...product,
        // Sử dụng ID mapping để tương thích với hệ thống hiện tại
        id: idMapping[product.id] || product.id,
        originalId: product.id, // Giữ lại ID gốc để tham chiếu
        // Thêm thông tin chi tiết cho addon nếu cần
        detailedInfo: this.getAddonDetailedInfo(product.id)
      }));
    },



    /* ========= QUICK VIEW ========= */
    isQuickViewOpen: false,
    quickViewProduct: null,

    /* ========= PRODUCT DETAIL MODAL ========= */
    isProductDetailOpen: false,
    sharedDetails: null,
    productDetailContent: null,
    currentProductDetail: null,
    productDetailQuantity: 1,
    productDetailViewers: Math.floor(Math.random() * 5) + 1, // 1-5 người đang xem
    productDetailViewersTimer: null,
    productDetailSelectedAddons: [], // Addon được chọn trong ProductDetail modal

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
    giftCode: Alpine.$persist('').as('giftCode'), // Mã quà tặng riêng biệt
    appliedDiscountCode: Alpine.$persist('').as('appliedDiscountCode'),
    appliedGift: Alpine.$persist(null).as('appliedGift'),
    discountAmount: 0,
    discountError: '',

    /* ========= CUSTOMER & ADDRESS ========= */
    productNotes: Alpine.$persist({}).as('productNotes'),
    customer: Alpine.$persist({ name: '', phone: '', email: '', address: '', notes: '' }).as('customerInfo'),
    paymentMethod: 'cod',
    addressData: {}, // Đổi từ Array sang Object để phù hợp với tree.json
    isAddressLoading: false,
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
      paymentMethod: '',
      weight: '',
      quickBuyNotes: ''
    },

    // Weight validation errors for cart items (key: item.id, value: error message)
    weightErrors: {},

    /* ========= PRIVATE/HELPERS ========= */
    _CURRENCY: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),

    // Helper function để lấy tên quà tặng từ appliedGift
    getGiftName(gift) {
      if (!gift) return 'Quà tặng';

      // Debug log để kiểm tra cấu trúc

      const name = gift.name || gift.value?.name || gift.title || 'Quà tặng';

      return name;
    },

    // Helper function để lấy ID quà tặng từ appliedGift
    getGiftId(gift) {
      if (!gift) return null;
      return gift.id || gift.value?.id;
    },

    // Helper function để cung cấp thông tin chi tiết cho addon products
    getAddonDetailedInfo(productId) {
      const detailedInfoMap = {
        'san_pham_ban_kem_001': {
          fullDescription: 'Túi Dâu Tằm Để Giường cao cấp được làm từ khúc cành dâu tằm tự nhiên, cắt nhỏ và đóng gói trong túi nhung sang trọng. Sản phẩm giúp bé ngủ ngon, giảm stress và tăng cường sức khỏe tự nhiên.',
          benefits: [
            '🌿 Giúp bé ngủ ngon và sâu giấc',
            '😌 Giảm căng thẳng, lo âu cho bé',
            '🛡️ Tăng cường hệ miễn dịch tự nhiên',
            '🌱 100% từ thiên nhiên, an toàn cho bé',
            '💝 Đóng gói trong túi nhung cao cấp'
          ],
          usage: 'Đặt Túi Dâu Tằm Để Giường gần gối hoặc trong cũi của bé. Có thể bóp nhẹ để tỏa hương thơm tự nhiên. Thay thế sau 3-6 tháng sử dụng.',
          materials: 'Cành dâu tằm tự nhiên, túi nhung cotton cao cấp',
          origin: 'Thôn Đông Cao, Tráng Việt, Hà Nội'
        },
        'san_pham_ban_kem_002': {
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
      };

      return detailedInfoMap[productId] || {
        fullDescription: 'Sản phẩm chất lượng cao từ dâu tằm tự nhiên.',
        benefits: ['🌿 An toàn tự nhiên', '💝 Chất lượng cao'],
        usage: 'Sử dụng theo hướng dẫn.',
        materials: 'Dâu tằm tự nhiên',
        origin: 'Thôn Đông Cao, Tráng Việt, Hà Nội'
      };
    },

    /* ========= LIFECYCLE ========= */
    async init() {
      // Xử lý referral code từ URL trước khi tải dữ liệu
      this.handleReferralFromURL();

      // Tải dữ liệu
      await this.loadData();

      // Revalidate referral sau khi partners data đã được load
      this.revalidateReferralAfterLoad();

      this.revalidateAppliedDiscount(); // Re-apply discount on load
      this.startNotificationLoop();
      this.startFreeshipCountdown();
      this.startSocialProofLoop();

      // Xử lý deep link cho modal sản phẩm và combo
      const hash = window.location.hash;
      if (hash.startsWith('#product=')) {
        const productId = hash.substring(9); // '#product='.length
        // Chờ một chút để UI render xong xuôi
        this.$nextTick(() => {
          const product = this.products.find(p => p.id === productId);
          if (product) {
            this.openProductDetail(product);
          }
        });
      } else if (hash.startsWith('#combo=')) {
        const comboType = hash.substring(7); // '#combo='.length
        // Danh sách các combo hợp lệ
        const validCombos = ['vong_tron_tui', 'vong_tron_bo_sua', 'vong_tron_goi', 'vong_tron_khan'];
        // Chờ một chút để UI render xong xuôi
        this.$nextTick(() => {
          if (validCombos.includes(comboType)) {
            this.openComboImageModal(comboType);
          }
        });
      } else if (hash.startsWith('#search=')) {
        const searchQuery = decodeURIComponent(hash.substring(8)); // '#search='.length
        this.$nextTick(() => {
          this.searchQuery = searchQuery;
          this.performSearch();
        });
      } else if (hash.startsWith('#category=')) {
        const categoryId = hash.substring(10); // '#category='.length
        this.$nextTick(() => {
          const category = this.categories.find(c => c.id === categoryId);
          if (category) {
            this.selectCategory(category);
          }
        });
      }

      // Validate address consistency sau khi load
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
        const cartIdSet = new Set(newCart.map(i => i.cartId || i.id));
        // Lưu note nếu có
        newCart.forEach(item => { if (item.weight) this.productNotes[item.id] = item.weight; });
        // Loại bỏ cartId/id không còn trong cart
        this.selectedCartItems = this.selectedCartItems.filter(id => cartIdSet.has(id));
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
          // Reset trạng thái xác nhận chuyển khoản khi thay đổi phương thức thanh toán
          this.isCheckoutTransferConfirmed = false;
        }
      });

      // Watch selected items để revalidate discount (chỉ khi có discount được áp dụng)
      this.$watch('selectedCartItems', () => {
        if (this.appliedDiscountCode || this.appliedGift || this.discountAmount > 0) {
          this.revalidateAppliedDiscount();
        }
      });

      // Watch Quick Buy quantity để revalidate discount
      this.$watch('quickBuyQuantity', () => {
        this.revalidateQuickBuyDiscount();
      });

      // Watch quickBuyPaymentMethod để reset trạng thái xác nhận chuyển khoản
      this.$watch('quickBuyPaymentMethod', (newValue) => {
        if (newValue) {
          // Clear payment method error
          this.formErrors.paymentMethod = '';
          // Reset trạng thái xác nhận chuyển khoản khi thay đổi phương thức thanh toán
          this.isQuickBuyTransferConfirmed = false;
        }
      });

      // Watch quickBuyWeight để clear weight error
      this.$watch('quickBuyWeight', (newValue) => {
        if (newValue && newValue !== '- Chọn cân nặng -' && newValue !== '-- Chọn size tay --') {
          this.formErrors.weight = '';
        }
      });

      // Watch modal states to restore overflow
      this.$watch('isMiniCartOpen', (newValue, oldValue) => {
        // Khi mini cart đóng, kiểm tra có cần restore overflow không
        if (oldValue === true && newValue === false) {
          // Chỉ restore khi không có modal nào khác đang mở
          if (!this.isCheckoutModalOpen && !this.isConfirmModalOpen && !this.isAddonDetailModalOpen &&
            !this.isQuickBuyModalOpen && !this.isProductDetailOpen && !this.isDiscountModalOpen) {
            document.body.style.overflow = 'auto';
          }
        }
      });


      // Dọn cart dữ liệu cũ trùng ID
      if (this.cart.length > 0) {
        const uniqueIds = new Set(this.cart.map(i => i.id));
        if (uniqueIds.size < this.cart.length) {
          this.cart = [];
        }
      }

      // Check if process modal should be shown
      // TEMP: Always show modal for testing - remove this when ready for production
      // DISABLED: Modal quy trình thủ công đã được tắt tạm thời
      // this.openProcessModal(); // Show immediately

      // PRODUCTION CODE (commented out for testing):
      // const processModalData = JSON.parse(localStorage.getItem('processModalViewed'));
      // if (!processModalData || new Date().getTime() > processModalData.expiry) {
      //   setTimeout(() => {
      //     this.openProcessModal();
      //   }, 2000);
      // }

    },

    /* ========= Process Showcase Modal Logic ========= */
    openProcessModal() {
      this.isProcessModalOpen = true;
      document.body.style.overflow = 'hidden';
    },

    closeProcessModal() {
      this.isProcessModalOpen = false;
      document.body.style.overflow = 'auto';
      // Save the timestamp to localStorage with a 3-day expiry
      const expiry = new Date().getTime() + (3 * 24 * 60 * 60 * 1000);
      localStorage.setItem('processModalViewed', JSON.stringify({ expiry: expiry }));
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
      return `DH${y}${m}${day}${r}`;
    },


    formatCurrency(v) { return typeof v === 'number' ? this._CURRENCY.format(v) : v; },

    // Format currency ngắn gọn (ví dụ: 180000 -> "180k")
    formatCurrencyShort(v) {
      if (typeof v !== 'number') return v;
      if (v >= 1000000) {
        const millions = v / 1000000;
        return `${millions % 1 === 0 ? millions : millions.toFixed(1)}tr`;
      }
      if (v >= 1000) {
        const thousands = v / 1000;
        return `${thousands % 1 === 0 ? thousands : thousands.toFixed(0)}k`;
      }
      return `${v}đ`;
    },

    // Get surcharge amount for a cart item
    getSurcharge(item) {
      if (!item) return 0;
      return item.surcharge || 0;
    },

    // Copy bank account number to clipboard
    async copyBankAccount() {
      const accountNumber = '0968969012';
      try {
        await navigator.clipboard.writeText(accountNumber);
        this.showAlert('Đã sao chép số tài khoản: ' + accountNumber, 'success');
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = accountNumber;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showAlert('Đã sao chép số tài khoản: ' + accountNumber, 'success');
      }
    },

    showAlert(message, type = 'success') {
      this.alertModalMessage = message;
      this.alertModalType = type;
      this.isAlertModalOpen = true;
      setTimeout(() => { this.isAlertModalOpen = false; }, 3000);
    },

    /* ========= DATA FETCH ========= */
    async getAddressData() {
      // Chỉ tải nếu dữ liệu chưa có và không đang trong quá trình tải
      if (Object.keys(this.addressData).length === 0 && !this.isAddressLoading) {
        this.isAddressLoading = true;
        try {
          const response = await fetch('./data/tree.json');
          if (!response.ok) throw new Error('Không thể tải dữ liệu địa chỉ.');
          this.addressData = await response.json();
        } catch (error) {
          console.error('Lỗi tải địa chỉ:', error);
          this.formErrors.province = 'Lỗi tải dữ liệu địa chỉ.';
        } finally {
          this.isAddressLoading = false;
        }
      }
    },

    async loadData() {
      this.loading = true; this.error = null;
      try {
        // Load sản phẩm, mã giảm giá và config từ D1 database qua Worker API
        const productsApiUrl = this.getApiUrl('/api/products');
        const discountsApiUrl = this.getApiUrl('/api/discounts');
        const configApiUrl = this.getApiUrl('/api/config');
        
        const [prodRes, infoRes, discountRes, sharedRes, configRes] = await Promise.all([
          fetch(productsApiUrl),
          fetch('./data/shop-info.json'),
          fetch(discountsApiUrl),
          fetch('./data/shared-details.json'),
          fetch(configApiUrl)
        ]);

        // Load address data ngay từ đầu để tránh timing issue
        await this.getAddressData();

        if (!prodRes.ok) throw new Error('Không thể tải sản phẩm từ database.');
        if (!infoRes.ok) throw new Error('Không thể tải thông tin shop.');
        if (!discountRes.ok) throw new Error('Không thể tải mã giảm giá từ database.');
        if (!sharedRes.ok) throw new Error('Không thể tải thông tin chi tiết.');
        if (!configRes.ok) throw new Error('Không thể tải cấu hình hệ thống.');

        // Parse response từ API
        const productsData = await prodRes.json();
        if (!productsData.success) {
          throw new Error(productsData.error || 'Lỗi tải sản phẩm từ database');
        }

        const discountsData = await discountRes.json();
        if (!discountsData.success) {
          throw new Error(discountsData.error || 'Lỗi tải mã giảm giá từ database');
        }

        const configData = await configRes.json();
        if (!configData.success) {
          throw new Error(configData.error || 'Lỗi tải cấu hình hệ thống');
        }

        // Lưu config và cập nhật SHIPPING_FEE
        this.systemConfig = configData.data;
        this.SHIPPING_FEE = this.systemConfig.shipping_fee;
        console.log('✅ System config loaded:', {
          shipping_fee: this.SHIPPING_FEE,
          tax_rate: this.systemConfig.tax_rate
        });

        // Categories đã được khởi tạo tĩnh ở trên
        this.products = productsData.data;
        this.shopInfo = await infoRes.json();


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

        this.availableDiscounts = discountsData.data;
        this.sharedDetails = await sharedRes.json();

        // Partners data đã được hardcode ở trên, không cần load từ file



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

    /* ========= MULTI-CATEGORY SUPPORT ========= */
    // Kiểm tra sản phẩm có thuộc category không (hỗ trợ multi-category)
    isProductInCategory(product, categoryId) {
      // Primary category check (fast path)
      if (product.category === categoryId) return true;

      // Multi-category check (fallback)
      if (product.categories && Array.isArray(product.categories)) {
        return product.categories.includes(categoryId);
      }

      return false;
    },

    /* ========= COMPUTED ========= */
    _fullProductList() {
      if (!this.currentCategory) return [];
      const byCategory = this.currentCategory.id === 'all'
        ? this.products
        : this.products.filter(p => this.isProductInCategory(p, this.currentCategory.id));

      const q = this.activeSearchQuery.trim().toLowerCase();
      const searched = q ? byCategory.filter(p => p.name?.toLowerCase().includes(q)) : byCategory;

      const arr = [...searched];
      switch (this.activeFilter) {
        case 'best_selling': arr.sort((a, b) => (b.purchases || 0) - (a.purchases || 0)); break;
        case 'newest': arr.reverse(); break; // giả định “mới” nằm cuối file như cũ
        case 'top_rated': arr.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      }

      // Sắp xếp theo giá sau khi đã lọc
      switch (this.sortBy) {
        case 'price_asc': arr.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
        case 'price_desc': arr.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
        // 'default' không làm gì thêm, giữ nguyên thứ tự từ activeFilter
      }

      return arr;
    },
    filteredProducts() {
      const list = this._fullProductList();
      return this.isShowingBestSellers ? list.slice(0, 8) : list.slice(0, this.visibleProductCount);
    },
    canLoadMore() { return this.visibleProductCount < this._fullProductList().length; },
    getProductCount(categoryId) { return this.products.filter(p => this.isProductInCategory(p, categoryId)).length; },

    // Function để lấy top 5 sản phẩm bán chạy nhất
    topSellingProductIds() {
      return [...this.products]
        .sort((a, b) => (b.purchases || 0) - (a.purchases || 0))
        .slice(0, 5)
        .map(p => p.id);
    },

    // Function để lấy sản phẩm bán chạy nhất (TOP 1)
    topSellingProductId() {
      const sorted = [...this.products]
        .sort((a, b) => (b.purchases || 0) - (a.purchases || 0));
      return sorted.length > 0 ? sorted[0].id : null;
    },

    // Function để hiển thị top 8 sản phẩm bán chạy
    showTopSellingProducts() {
      // Đặt category về "Tất cả" để hiển thị tất cả sản phẩm
      this.currentCategory = this.categories.find(cat => cat.id === 'all') || this.categories[0];

      // Đặt filter về best_selling và bật flag hiển thị top 8
      this.activeFilter = 'best_selling';
      this.isShowingBestSellers = true;
      this.visibleProductCount = 8;

      // Reset search
      this.searchQuery = '';
      this.activeSearchQuery = '';

      // Xóa hash tìm kiếm khi hiển thị sản phẩm bán chạy
      if (window.location.hash.startsWith('#search=')) {
        history.pushState(null, null, ' ');
      }

      // Cuộn xuống phần sản phẩm với smooth scroll
      setTimeout(() => {
        const productsSection = document.querySelector('#products-section');
        if (productsSection) {
          productsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    },

    // Function để mua combo
    buyCombo(comboId, comboName, comboPrice) {
      // Đánh dấu đang mua combo
      this.isBuyingCombo = true;

      // Lấy ảnh combo phù hợp dựa trên comboType
      const getComboImage = (type) => {
        const comboImages = {
          'vong_tron_tui': './assets/images/product_img/combo/combo-tron-tui-dau.webp',
          'vong_co_gian_tui': './assets/images/product_img/combo/combo-tron-co-gian-tui-dau.webp',
          'vong_7_bi_bac_tui': './assets/images/product_img/combo/combo-7-bi-bac-tui-dau.webp',
          'vong_9_bi_bac_tui': './assets/images/product_img/combo/combo-9-bi-bac-tui-dau.webp'
        };
        return comboImages[type] || './assets/images/product_img/vong_tron_co_dien_day_do.webp';
      };

      // Tạo object combo giống như sản phẩm
      const comboProduct = {
        id: comboId,
        name: comboName,
        price: comboPrice,
        image: getComboImage(comboId),
        description: `Combo đặc biệt: ${comboName}`,
        category: 'combo',
        isCombo: true,
        freeShipping: true, // Đánh dấu miễn phí ship
        specialOffer: true,
        momFriendly: true
      };

      // Gọi function buyNow với combo product
      this.buyNow(comboProduct);
    },

    // Function để mở modal xem ảnh combo - Enhanced for Mom-Friendly Experience
    openComboImageModal(comboType) {
      const comboData = {
        'vong_tron_tui': {
          title: 'Combo Vòng Trơn + Túi Dâu Tằm Để Giường',
          originalPrice: 128000,
          shippingFee: 28000,
          totalWithoutCombo: 156000,
          comboPrice: 120000,
          savings: 36000,
          customerCount: 689,
          product1: {
            image: './assets/images/product_img/vong_tron_co_dien_day_do.webp',
            name: 'Vòng Dâu Tằm Trơn',
            description: 'Vòng dâu tằm trơn đơn giản, thanh lịch, phù hợp cho mọi lứa tuổi. An toàn cho bé, không gây dị ứng.',
            price: 89000,
            benefits: ['An toàn cho bé', 'Không gây dị ứng', 'Dễ vệ sinh']
          },
          product2: {
            image: './assets/images/product_img/tui_dau_tam.webp',
            name: 'Túi Dâu Tằm Để Giường',
            description: 'Khúc dâu tằm để phòng, trong túi nhung cao cấp. Giúp bé ngủ ngon, giảm stress.',
            price: 39000,
            benefits: ['Giúp bé ngủ ngon', 'Giảm căng thẳng', 'An toàn tự nhiên']
          }
        },
        'vong_7_bi_bac_tui': {
          title: 'Combo 7 Bi Bạc + Túi Dâu Tằm Để Giường',
          originalPrice: 258000,
          shippingFee: 28000,
          totalWithoutCombo: 286000,
          comboPrice: 230000,
          savings: 56000,
          customerCount: 423,
          product1: {
            image: './assets/images/product_img/Sole bac/vong_dau_tam_7_bi_bac.webp',
            name: 'Vòng 7 Bi Bạc',
            description: 'Vòng dâu tằm với 7 viên bi bạc thật, sang trọng và phong thủy, mang lại may mắn cho bé.',
            price: 219000,
            benefits: ['Bi bạc thật 100%', 'Phong thủy tốt', 'Sang trọng, đẳng cấp']
          },
          product2: {
            image: './assets/images/product_img/tui_dau_tam.webp',
            name: 'Túi Dâu Tằm Để Giường',
            description: 'Khúc dâu tằm để phòng, trong túi nhung cao cấp. Giúp bé ngủ ngon, giảm stress.',
            price: 39000,
            benefits: ['Giúp bé ngủ ngon', 'Giảm căng thẳng', 'An toàn tự nhiên']
          }
        },
        'vong_9_bi_bac_tui': {
          title: 'Combo 9 Bi Bạc + Túi Dâu Tằm Để Giường',
          originalPrice: 328000,
          shippingFee: 28000,
          totalWithoutCombo: 356000,
          comboPrice: 290000,
          savings: 66000,
          customerCount: 312,
          product1: {
            image: './assets/images/product_img/Sole bac/vong_dau_tam_9_bi_bac.webp',
            name: 'Vòng 9 Bi Bạc',
            description: 'Vòng dâu tằm với 9 viên bi bạc thật, cao cấp nhất cho bé yêu, mang ý nghĩa trường thọ.',
            price: 289000,
            benefits: ['Bi bạc thật 100%', 'Ý nghĩa trường thọ', 'Cao cấp nhất']
          },
          product2: {
            image: './assets/images/product_img/tui_dau_tam.webp',
            name: 'Túi Dâu Tằm Để Giường',
            description: 'Khúc dâu tằm để phòng, trong túi nhung cao cấp. Giúp bé ngủ ngon, giảm stress.',
            price: 39000,
            benefits: ['Giúp bé ngủ ngon', 'Giảm căng thẳng', 'An toàn tự nhiên']
          }
        },
        'vong_co_gian_tui': {
          title: 'Vòng dâu tằm trơn co giãn + Túi dâu tằm để giường',
          originalPrice: 128000,
          shippingFee: 28000,
          totalWithoutCombo: 156000,
          comboPrice: 109000,
          savings: 47000,
          customerCount: 578,
          product1: {
            image: './assets/images/product_img/co gian/vong_tron_co_gian.webp',
            name: 'Vòng dâu tằm trơn co giãn',
            description: 'Vòng dâu tằm trơn với dây co giãn mềm mại, đơn giản nhưng tiện lợi, tự động vừa vặn.',
            price: 89000,
            benefits: ['Co giãn tiện lợi', 'An toàn cho bé', 'Thoải mái cả ngày']
          },
          product2: {
            image: './assets/images/product_img/tui_dau_tam.webp',
            name: 'Túi Dâu Tằm Để Giường',
            description: 'Khúc dâu tằm để giường, trong túi nhung cao cấp. Giúp bé ngủ ngon, giảm stress.',
            price: 39000,
            benefits: ['Giúp bé ngủ ngon', 'Giảm căng thẳng', 'An toàn tự nhiên']
          }
        }
      };

      const combo = comboData[comboType];
      if (combo) {
        this.currentComboTitle = combo.title;
        this.currentComboImages = combo;
        this.currentComboType = comboType;
        this.isComboImageModalOpen = true;
        // Thêm hash vào URL cho deep linking
        history.pushState(null, null, '#combo=' + comboType);
        document.body.style.overflow = 'hidden';
      }
    },

    // Function để đóng modal xem ảnh combo - Enhanced
    closeComboImageModal() {
      this.isComboImageModalOpen = false;
      // Xóa hash khỏi URL
      if (history.state === null) {
        history.pushState(null, null, ' ');
      }
      document.body.style.overflow = 'auto';
    },

    // Function để mua combo với thông tin chi tiết hơn
    buyComboEnhanced(comboType, comboTitle, comboPrice) {
      // Đánh dấu đang mua combo
      this.isBuyingCombo = true;

      // Lấy ảnh combo phù hợp dựa trên comboType
      const getComboImage = (type) => {
        const comboImages = {
          'vong_tron_tui': './assets/images/product_img/combo/combo-tron-tui-dau.webp',
          'vong_co_gian_tui': './assets/images/product_img/combo/combo-tron-co-gian-tui-dau.webp',
          'vong_7_bi_bac_tui': './assets/images/product_img/combo/combo-7-bi-bac-tui-dau.webp',
          'vong_9_bi_bac_tui': './assets/images/product_img/combo/combo-9-bi-bac-tui-dau.webp'
        };
        return comboImages[type] || './assets/images/product_img/vong_tron_co_dien_day_do.webp';
      };

      // Tạo object combo với thông tin chi tiết
      const comboProduct = {
        id: comboType,
        name: comboTitle,
        price: comboPrice,
        image: getComboImage(comboType),
        description: `Combo đặc biệt dành cho mẹ bỉm: ${comboTitle}`,
        category: 'combo',
        isCombo: true,
        freeShipping: true,
        specialOffer: true,
        momFriendly: true
      };

      // Gọi function buyNow với combo product
      this.buyNow(comboProduct);

      // KHÔNG đóng modal combo detail để modal mua ngay hiển thị chồng lên
      // this.closeComboImageModal();

      // Hiển thị thông báo thành công
      this.showAlert('success', '🎉 Đã thêm combo vào giỏ hàng! Cảm ơn mẹ đã tin tưởng lựa chọn.');
    },

    // Function để hiển thị điều kiện mã giảm giá rõ ràng
    getDiscountCondition(discount) {
      const minItems = discount.minItems || 0;
      const minOrder = discount.minOrder || 0;

      if (discount.type === 'shipping') {
        if (minItems > 0 && minOrder > 0) {
          return `Mua từ ${minItems} SP, tổng đơn trên ${this.formatCurrencyShort(minOrder)}`;
        }
        if (minItems > 0) {
          return `Mua từ ${minItems} SP`;
        }
        return `Freeship cho đơn hàng trên ${this.formatCurrencyShort(minOrder)}`;
      }

      if (discount.type === 'gift') {
        // Chỉ hiển thị điều kiện (tên sản phẩm đã hiển thị ở trên)
        if (minItems > 0 && minOrder > 0) {
          return `Khi mua từ ${minItems} SP, đơn từ ${this.formatCurrencyShort(minOrder)}`;
        }
        if (minItems > 0) {
          return `Khi mua từ ${minItems} SP`;
        }
        return `Cho đơn hàng trên ${this.formatCurrencyShort(minOrder)}`;
      }

      if (discount.type === 'percentage' || discount.type === 'fixed') {
        if (minItems > 0 && minOrder > 0) {
          return `Mua từ ${minItems} SP, tổng đơn trên ${this.formatCurrencyShort(minOrder)}`;
        }
        if (minItems > 0) {
          return `Mua từ ${minItems} SP`;
        }
        return `Giảm giá cho đơn hàng trên ${this.formatCurrencyShort(minOrder)}`;
      }

      return discount.description || '';
    },

    // Function để hiển thị hướng dẫn cụ thể
    getDiscountGuidance(discount) {
      if (discount.availability.available) return '';

      const currentSubtotal = this.isDiscountModalFromQuickBuy ? this.quickBuyOrderValue : this.cartSubtotal();
      const currentQuantity = this.isDiscountModalFromQuickBuy ? this.quickBuyQuantity : this.totalCartQuantity;

      const minItems = discount.minItems || 0;
      const minOrder = discount.minOrder || 0;

      const needMoreMoney = Math.max(0, minOrder - currentSubtotal);
      const needMoreItems = Math.max(0, minItems - currentQuantity);

      // Nếu chỉ cần 1 sản phẩm (minItems <= 1) và thiếu tiền, hiển thị số tiền còn thiếu
      if (minItems <= 1 && needMoreMoney > 0) {
        return `Bạn cần mua thêm ${this.formatCurrency(needMoreMoney)} nữa`;
      }

      if (needMoreItems > 0 && needMoreMoney > 0) {
        const avgPrice = Math.ceil(needMoreMoney / needMoreItems);
        return `Cần mua thêm ${needMoreItems} sản phẩm giá từ ${this.formatCurrency(avgPrice)} trở lên`;
      }

      if (needMoreItems > 0) {
        return `Cần mua thêm ${needMoreItems} sản phẩm`;
      }

      if (needMoreMoney > 0) {
        return `Bạn cần mua thêm ${this.formatCurrency(needMoreMoney)} nữa`;
      }

      return discount.availability.reason || '';
    },

    // Helper function để tính phần trăm giảm giá
    getDiscountPercentage(product) {
      if (!product.original_price || product.original_price <= product.price) return 0;
      const discount = Math.round((1 - product.price / product.original_price) * 100);
      return discount >= 1 ? discount : 0;
    },

    getCategoryPurchases(categoryId) {
      const arr = categoryId === 'all' ? this.products : this.products.filter(p => this.isProductInCategory(p, categoryId));
      const total = arr.reduce((t, p) => t + (p.purchases || 0), 0);
      if (total > 1000) {
        const k = (total / 1000).toFixed(1);
        return k.includes('.0') ? `${Math.round(total / 1000)}k` : k.replace('.', ',') + 'k';
      }
      return total;
    },

    // Get selected cart products including gifts
    get selectedCartProducts() {
      // Lấy các sản phẩm đã chọn từ cart
      const selectedProducts = this.cart.filter(item =>
        this.selectedCartItems.includes(item.cartId || item.id)
      );

      // Thêm quà tặng nếu có
      if (this.appliedGift) {
        // Lấy thông tin quà tặng sử dụng helper functions
        const giftId = this.getGiftId(this.appliedGift);
        const giftName = this.getGiftName(this.appliedGift);

        // Tìm thông tin chi tiết của quà tặng từ products hoặc addonProducts
        let giftDetails = this.products.find(p => p.id === giftId);
        if (!giftDetails) {
          giftDetails = this.addonProducts.find(p => p.id === giftId);
        }

        const giftProduct = {
          id: giftId,
          name: giftName,
          image: giftDetails?.image || './assets/images/product_img/default.webp',
          isGift: true,
          quantity: 1,
          price: 0, // Quà tặng có giá 0
          cartId: `gift-${giftId}`,
          displayName: `🎁 ${giftName} (Quà tặng)`
        };
        selectedProducts.push(giftProduct);
      }

      return selectedProducts;
    },

    // Chỉ tính theo item đã chọn và bỏ qua quà tặng - sử dụng finalPrice cho dynamic pricing
    cartSubtotal() {
      return this.selectedCartProducts
        .filter(i => !i.isGift)
        .reduce((t, i) => t + ((i.finalPrice || i.price) * (i.beadQuantity || i.quantity)), 0);
    },

    /* ========= LOGIC KHUYẾN MÃI ========= */
    get hasMainProductInCart() {
      // Có ít nhất 1 item đã chọn KHÔNG phải addon
      return this.selectedCartItems.some(id => !this.addonProducts.some(p => p.id === id));
    },
    get addonDiscount() {
      const hasKeychain = this.cart.some(i => i.id === 'addon_moc_chia_khoa');
      return hasKeychain ? 5000 : 0;
    },
    get tuiDauTamBonusDiscount() {
      const hasTui = this.selectedCartItems.includes('addon_tui_dau_tam');
      const freeshipByCode = this.isFreeshippingFromDiscount();
      return (hasTui && freeshipByCode && this.hasMainProductInCart) ? 8000 : 0;
    },

    get freeShipping() {
      // Miễn phí ship nếu trong giỏ có 1 trong các sản phẩm freeship
      const hasFreeShipAddon = this.cart.some(i =>
        i.id === 'addon_tui_dau_tam' ||
        i.id === 'addon_bo_dau_tam_7_canh' ||
        i.id === 'addon_bo_dau_tam_9_canh'
      );
      if (hasFreeShipAddon) return true;
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
    get provinces() { 
      return Object.entries(this.addressData).map(([code, data]) => ({ 
        Id: code, 
        Name: data.name_with_type 
      })); 
    },
    get districts() {
      if (!this.selectedProvince) return [];
      const province = this.addressData[this.selectedProvince];
      if (!province || !province['quan-huyen']) return [];
      return Object.entries(province['quan-huyen']).map(([code, data]) => ({ 
        Id: code, 
        Name: data.name_with_type 
      }));
    },
    get wards() {
      if (!this.selectedProvince || !this.selectedDistrict) return [];
      const province = this.addressData[this.selectedProvince];
      const district = province?.['quan-huyen']?.[this.selectedDistrict];
      if (!district || !district['xa-phuong']) return [];
      return Object.entries(district['xa-phuong']).map(([code, data]) => ({ 
        Id: code, 
        Name: data.name_with_type 
      }));
    },
    get bestSellingProducts() {
      return [...this.products].sort((a, b) => (b.purchases || 0) - (a.purchases || 0)).slice(0, 8);
    },

    updateFullAddress() {
      if (this.selectedProvince && this.selectedDistrict && this.selectedWard) {
        const province = this.addressData[this.selectedProvince];
        const district = province?.['quan-huyen']?.[this.selectedDistrict];
        const ward = district?.['xa-phuong']?.[this.selectedWard];
        
        const prov = province?.name_with_type || '';
        const dist = district?.name_with_type || '';
        const wardName = ward?.name_with_type || '';
        
        this.customer.address = [this.streetAddress, wardName, dist, prov].filter(Boolean).join(', ');
      } else {
        // FORCE CLEAR address khi bất kỳ dropdown nào trống
        this.customer.address = '';
      }
    },

    /* ========= VIEW / SEARCH ========= */
    performSearch() {
      this.activeSearchQuery = this.searchQuery.trim();
      this.visibleProductCount = 8;

      // Cập nhật URL với từ khóa tìm kiếm
      if (this.activeSearchQuery) {
        history.pushState(null, null, '#search=' + encodeURIComponent(this.activeSearchQuery));
        this.$nextTick(() => {
          document.getElementById('product-list-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } else {
        // Xóa hash khi không có từ khóa tìm kiếm
        if (window.location.hash.startsWith('#search=')) {
          history.pushState(null, null, ' ');
        }
      }
    },
    loadMoreProducts() { this.visibleProductCount += this.productsPerLoad; },
    selectCategory(category) {
      this.visibleProductCount = 8;
      this.currentCategory = category;
      this.searchQuery = ''; this.activeSearchQuery = '';
      this.isShowingBestSellers = false; // Reset top selling mode
      this.view = 'products';

      // Cập nhật URL hash cho danh mục
      if (category && category.id !== 'all') {
        history.pushState(null, null, '#category=' + category.id);
      } else {
        // Xóa hash nếu chọn 'Tất cả sản phẩm' hoặc hash cũ là của category/search
        if (window.location.hash.startsWith('#category=') || window.location.hash.startsWith('#search=')) {
          history.pushState(null, null, ' ');
        }
      }

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

    // Scroll to categories section
    scrollToCategories() {
      // Đóng tất cả modal nếu có
      this.closeAllModals();

      // Đảm bảo đang ở view products
      this.view = 'products';

      // Scroll đến phần "Khu Vườn Sản Phẩm"
      this.$nextTick(() => {
        // Tìm bằng text content
        const allH2 = document.querySelectorAll('h2');
        const targetH2 = Array.from(allH2).find(h2 => h2.textContent.includes('Khu Vườn Sản Phẩm'));
        if (targetH2) {
          targetH2.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          // Fallback: scroll to categories grid
          const categoriesSection = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-3');
          if (categoriesSection) {
            categoriesSection.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      });
    },

    // Scroll to combo section
    scrollToCombo() {
      // Đóng tất cả modal nếu có
      this.closeAllModals();

      // Đảm bảo đang ở view products
      this.view = 'products';

      // Scroll đến phần sản phẩm (phía trên "Khu Vườn Sản Phẩm")
      setTimeout(() => {
        // Tìm phần products view
        const productsView = document.querySelector('[x-show="!loading && !error && view === \'products\'"]');
        if (productsView) {
          productsView.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          // Fallback: scroll to top of products section
          const productSection = document.querySelector('.mb-6.sm\\:mb-8');
          if (productSection) {
            productSection.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }, 100);
    },

    // Scroll to top products section
    scrollToTopProducts() {
      // Đóng tất cả modal nếu có
      this.closeAllModals();

      // Đảm bảo đang ở view products
      this.view = 'products';

      // Scroll đến phần "🔥 Bán chạy" (sorting filters)
      setTimeout(() => {
        // Tìm button có text "🔥 Bán chạy" hoặc "Bán chạy"
        const allButtons = document.querySelectorAll('button');
        const targetButton = Array.from(allButtons).find(button => {
          return button.textContent.includes('🔥 Bán chạy') ||
            button.textContent.includes('Bán chạy') && button.textContent.includes('🔥');
        });

        if (targetButton) {
          targetButton.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          // Fallback: tìm sorting filters section
          const sortingSection = document.querySelector('.flex.items-center.justify-center.flex-wrap.gap-2.mb-8');
          if (sortingSection) {
            sortingSection.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          } else {
            // Final fallback: scroll to products section
            const productSection = document.querySelector('.mb-6.sm\\:mb-8');
            if (productSection) {
              productSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            } else {
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
              });
            }
          }
        }
      }, 100); // Delay 100ms để đảm bảo DOM đã render
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

    /* ========= FAQ MODAL ========= */
    openFaqModal() {
      this.isFaqModalOpen = true;
      document.body.style.overflow = 'hidden';
    },
    closeFaqModal() {
      this.isFaqModalOpen = false;
      document.body.style.overflow = 'auto';
    },
    toggleFaqItem(itemIndex) {
      if (this.faqOpenItems.includes(itemIndex)) {
        this.faqOpenItems = this.faqOpenItems.filter(i => i !== itemIndex);
      } else {
        // Optional: close other items for a classic accordion behavior
        // this.faqOpenItems = [itemIndex];
        this.faqOpenItems.push(itemIndex);
      }
    },

    /* ========= ADDON DETAIL MODAL ========= */
    openAddonDetail(addon) {

      if (this.isMiniCartOpen) this.preventMiniCartCloseOnClickOutside = true;

      // Lưu trạng thái modal nào đang mở để restore đúng
      this.addonDetailOpenedFrom = this.isMiniCartOpen ? 'miniCart' :
        this.isCheckoutModalOpen ? 'checkout' :
          this.isQuickBuyModalOpen ? 'quickBuy' :
            this.isProductDetailOpen ? 'productDetail' : 'homepage';


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

      // Restore overflow dựa trên nơi modal được mở
      if (this.addonDetailOpenedFrom === 'homepage') {
        document.body.style.overflow = 'auto';
      } else {
        if (!this.isMiniCartOpen && !this.isCheckoutModalOpen && !this.isQuickBuyModalOpen && !this.isProductDetailOpen) {
          document.body.style.overflow = 'auto';
        } else {
        }
      }


      setTimeout(() => {
        this.currentAddonDetail = null;
        this.addonDetailOpenedFrom = null;
      }, 300);
    },

    /* ========= Bead Quantity Modal Logic ========= */
    openBeadQuantityModal(product) {
      this.currentBeadProduct = product;
      this.beadOptions = {
        quantity: 14, // Mặc định 14 hạt cho sơ sinh
        note: ''
      };
      this.isBeadQuantityModalOpen = true;
      document.body.style.overflow = 'hidden';
    },

    closeBeadQuantityModal() {
      this.isBeadQuantityModalOpen = false;
      // Only restore overflow if no other modals are open
      if (!this.isMiniCartOpen && !this.isCheckoutModalOpen && !this.isQuickBuyModalOpen &&
        !this.isProductDetailOpen && !this.isDiscountModalOpen && !this.isAddonDetailModalOpen &&
        !this.isItemOptionsModalOpen && !this.isHandSizeModalOpen) {
        document.body.style.overflow = 'auto';
      }
      setTimeout(() => {
        this.currentBeadProduct = null;
        this.beadOptions = {
          quantity: 14,
          note: ''
        };
      }, 300);
    },

    addBeadWithQuantity() {
      if (!this.currentBeadProduct) return;

      if (!this.beadOptions.quantity || this.beadOptions.quantity < 1) {
        this.showAlert('Vui lòng chọn số lượng hạt dâu trước khi thêm vào giỏ hàng', 'error');
        return;
      }

      const { id } = this.currentBeadProduct;
      const notes = this.beadOptions.note.trim();

      // Tìm sản phẩm bead cùng loại và cùng ghi chú để gộp lại
      const existingItem = this.cart.find(item =>
        item.id === id &&
        item.beadQuantity &&
        (item.notes || '') === notes
      );

      if (existingItem) {
        // Gộp số lượng hạt vào item hiện có
        existingItem.beadQuantity += this.beadOptions.quantity;
        // Đảm bảo item được select
        const itemId = existingItem.cartId || existingItem.id;
        if (!this.selectedCartItems.includes(itemId)) {
          this.selectedCartItems.push(itemId);
        }
        this.triggerCartAnimation();
        this.showAlert(`Đã thêm ${this.beadOptions.quantity} hạt vào ${this.currentBeadProduct.name}! Tổng: ${existingItem.beadQuantity} hạt`, 'success');
      } else {
        // Tạo item mới
        const cartId = `${id}-${Date.now()}`;
        const itemToAdd = {
          ...this.currentBeadProduct,
          cartId: cartId,
          quantity: 1, // Luôn là 1 sản phẩm
          beadQuantity: this.beadOptions.quantity, // Số lượng hạt
          notes: notes,
          // Giá không thay đổi theo số lượng hạt
          basePrice: this.currentBeadProduct.price,
          finalPrice: this.currentBeadProduct.price
        };

        this.addToCart(itemToAdd);
        this.showAlert(`Đã thêm ${this.currentBeadProduct.name} (${this.beadOptions.quantity} hạt) vào giỏ hàng!`, 'success');
      }

      this.closeBeadQuantityModal();
      if (this.isProductDetailOpen) {
        this.closeProductDetail();
      }
    },

    // Alias function for HTML compatibility
    addBeadProductToCart() {
      this.addBeadWithQuantity();
    },

    /* ========= Item Options Modal Logic ========= */
    openItemOptionsModal(product) {
      this.currentItemForOptions = product;
      this.itemOptions = {
        quantity: 1,
        note: '',
        selectedWeight: '',
        customWeight: '',
        babyName: ''
      };
      this.showSizeGuide = false; // Reset size guide when opening modal
      this.isItemOptionsModalOpen = true;
      document.body.style.overflow = 'hidden';
    },

    openItemOptionsModalForEdit(item) {
      this.isEditingOptionsInCart = true;
      this.editingCartItemIdForOptions = item.cartId;

      const productInfo = this.products.find(p => p.id === item.id);
      if (!productInfo) {
        this.showAlert('Không tìm thấy thông tin sản phẩm để chỉnh sửa.', 'error');
        return;
      }

      this.currentItemForOptions = productInfo;
      this.itemOptions = {
        quantity: item.quantity,
        note: item.note || '',
        selectedWeight: item.selectedWeight || '',
        customWeight: item.customWeight || '',
        babyName: item.babyName || ''
      };

      this.isItemOptionsModalOpen = true;
      document.body.style.overflow = 'hidden';
    },

    closeItemOptionsModal() {
      this.isItemOptionsModalOpen = false;
      this.showSizeGuide = false; // Reset size guide when closing modal
      document.body.style.overflow = 'auto';

      // Reset editing state
      this.isEditingOptionsInCart = false;
      this.editingCartItemIdForOptions = null;

      setTimeout(() => {
        this.currentItemForOptions = null;
        this.itemOptions = {
          quantity: 1,
          note: '',
          selectedWeight: '',
          customWeight: '',
          babyName: ''
        };
      }, 300);
    },

    toggleSizeGuide() {
      this.showSizeGuide = !this.showSizeGuide;
    },

    addItemWithOptions() {
      if (!this.currentItemForOptions) return;

      const isAdult = this.isAdultProduct(this.currentItemForOptions);

      if (!this.itemOptions.selectedWeight) {
        this.showAlert(isAdult ? 'Vui lòng chọn size tay' : 'Vui lòng chọn cân nặng của bé', 'error');
        return;
      }

      if (!isAdult && this.itemOptions.selectedWeight === 'custom' && !this.itemOptions.customWeight) {
        this.showAlert('Vui lòng nhập cân nặng cụ thể', 'error');
        return;
      }

      if (this.currentItemForOptions?.category === 'mix_the_ten_be' && !this.itemOptions.babyName?.trim()) {
        this.showAlert('Vui lòng nhập tên của bé', 'error');
        return;
      }

      let finalWeight = this.itemOptions.selectedWeight;
      if (this.itemOptions.selectedWeight === 'custom') {
        finalWeight = `${this.itemOptions.customWeight}kg`;
      }

      if (this.isEditingOptionsInCart) {
        const itemToUpdate = this.cart.find(item => item.cartId === this.editingCartItemIdForOptions);
        if (itemToUpdate) {
          itemToUpdate.quantity = this.itemOptions.quantity;
          itemToUpdate.notes = this.itemOptions.note.trim();
          itemToUpdate.selectedWeight = this.itemOptions.selectedWeight;
          itemToUpdate.customWeight = this.itemOptions.customWeight;
          itemToUpdate.babyName = this.itemOptions.babyName ? this.itemOptions.babyName.trim() : '';
          itemToUpdate.weight = finalWeight;

          const priceData = this.calculateDynamicPrice(itemToUpdate, finalWeight);
          itemToUpdate.finalPrice = priceData.finalPrice;
          itemToUpdate.surcharge = priceData.surcharge;
          itemToUpdate.hasSurcharge = priceData.hasSurcharge;

          this.showAlert(`Đã cập nhật ${itemToUpdate.name}.`, 'success');
        } else {
          this.showAlert('Không tìm thấy sản phẩm để cập nhật.', 'error');
        }
      } else {
        const { id } = this.currentItemForOptions;
        const cartId = `${id}-${Date.now()}`;
        const priceData = this.calculateDynamicPrice(this.currentItemForOptions, finalWeight);

        const itemToAdd = {
          ...this.currentItemForOptions,
          cartId: cartId,
          quantity: 1, // Always 1 for this modal
          weight: finalWeight,
          selectedWeight: this.itemOptions.selectedWeight,
          customWeight: this.itemOptions.customWeight,
          babyName: this.itemOptions.babyName ? this.itemOptions.babyName.trim() : '',
          notes: this.itemOptions.note.trim(),
          basePrice: this.currentItemForOptions.price,
          finalPrice: priceData.finalPrice,
          surcharge: priceData.surcharge,
          hasSurcharge: priceData.hasSurcharge
        };

        this.addToCart(itemToAdd);
        // this.showAlert(`Đã thêm ${itemToAdd.name} vào giỏ hàng!`, 'success');
        if (this.isProductDetailOpen) {
          this.closeProductDetail();
        }
      }

      this.closeItemOptionsModal();
    },


    handleProductClick(product) {
      // Kiểm tra xem sản phẩm có cần khắc tên không
      if (this.requiresBabyName(product)) {
        this.openBabyNameModal(product);
        return;
      }

      if (this.isWeightSelectProduct(product)) {
        // Mở modal chọn cân nặng dạng preset cho vòng tay chỉ ngũ sắc
        this.openWeightPresetModal(product);
      } else if (this.isBeadProduct(product)) {
        // Mở modal chọn số lượng hạt dâu cho sản phẩm hạt dâu mài sẵn
        this.openBeadQuantityModal(product);
      } else if (this.isAddonProduct(product)) {
        // Thêm weight mặc định cho các sản phẩm bán kèm không cần chọn cân nặng
        const productWithWeight = {
          ...product,
          weight: 'N/A', // Đánh dấu không cần cân nặng
          selectedWeight: 'N/A',
          cartId: `${product.id}-${Date.now()}`,
          quantity: 1,
          basePrice: product.price,
          finalPrice: product.price
        };
        this.addToCart(productWithWeight);
        this.showAlert(`Đã thêm ${product.name} vào giỏ hàng!`, 'success');
      } else if (this.isAdultProduct(product)) {
        // Mở modal chọn size tay cho sản phẩm người lớn
        this.openHandSizeModal(product);
      } else {
        // Mở modal chọn cân nặng cho sản phẩm trẻ em
        this.openItemOptionsModal(product);
      }
    },

    /* ========= CART ========= */
    // product object can be a standard product or a pre-filled cart item from options modal
    addToCart(product) {

      // First, check for stock
      if (product.stock_quantity === 0) {
        this.showAlert('Sản phẩm này đã hết hàng!', 'error');
        return;
      }

      // Helper function to check if two items are identical
      const areItemsIdentical = (item1, item2) => {
        return item1.id === item2.id &&
          (item1.selectedWeight || item1.weight || '') === (item2.selectedWeight || item2.weight || '') &&
          (item1.babyName || '') === (item2.babyName || '') &&
          (item1.beadQuantity || '') === (item2.beadQuantity || '') &&
          (item1.handSize || '') === (item2.handSize || '');
      };

      // Check if an identical item already exists in the cart
      const existingItem = this.cart.find(item => areItemsIdentical(item, product));

      if (existingItem) {
        // If identical item found, increase quantity
        existingItem.quantity += (product.quantity || 1);
        this.showAlert(`Đã cập nhật số lượng ${existingItem.name}!`, 'success');
      } else {
        // If no identical item found, add as new item
        let itemToAdd;

        if (product.cartId) {
          // Item from options modal - already has cartId and all properties
          itemToAdd = { ...product };

          // For Mix thẻ tên bé products, automatically add baby name to notes
          if (product.category === 'mix_the_ten_be' && product.babyName && product.babyName.trim()) {
            const babyNameNote = `Tên bé: ${product.babyName.trim()}`;
            if (product.notes && product.notes.trim()) {
              itemToAdd.notes = `${babyNameNote} | ${product.notes.trim()}`;
            } else {
              itemToAdd.notes = babyNameNote;
            }
          }
        } else {
          // Standard product - create new cart item
          const cartId = `${product.id}-${Date.now()}`;
          itemToAdd = {
            ...product,
            cartId: cartId,
            quantity: product.quantity || 1,
            weight: product.weight || '',
            selectedWeight: product.selectedWeight || '',
            customWeight: product.customWeight || '',
            notes: product.notes || '',
            babyName: product.babyName || '',
            beadQuantity: product.beadQuantity || '',
            handSize: product.handSize || '',
            // Dynamic pricing fields
            basePrice: product.basePrice || product.price,
            finalPrice: product.finalPrice || product.price,
            surcharge: product.surcharge || 0,
            hasSurcharge: product.hasSurcharge || false
          };
        }

        this.cart.push(itemToAdd);
        this.selectedCartItems.push(itemToAdd.cartId);
        this.showAlert('Đã thêm sản phẩm vào giỏ hàng!', 'success');
      }

      this.triggerCartAnimation();
    },
    toggleMiniCart() {
      this.isMiniCartOpen = !this.isMiniCartOpen;
      if (this.isMiniCartOpen) {
        this.miniCartError = '';
        this.selectedCartItems = this.cart.map(item => item.cartId || item.id);
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
    toggleCartItemSelection(cartId) {
      const idx = this.selectedCartItems.indexOf(cartId);
      if (idx > -1) this.selectedCartItems.splice(idx, 1);
      else this.selectedCartItems.push(cartId);
    },
    toggleSelectAll() {
      if (this.isAllSelected) this.selectedCartItems = [];
      else this.selectedCartItems = this.cart.map(i => i.cartId || i.id);
    },
    get isAllSelected() {
      if (this.cart.length === 0) return false;
      // Kiểm tra xem tất cả items trong cart có được select không
      return this.cart.every(item => this.selectedCartItems.includes(item.cartId || item.id));
    },

    // Computed property để kiểm tra có thể đặt hàng không (checkout)
    get canPlaceOrder() {
      // Nếu chọn COD thì luôn có thể đặt hàng
      if (this.paymentMethod === 'cod') return true;

      // Nếu chọn chuyển khoản thì phải xác nhận chuyển khoản trước
      if (this.paymentMethod === 'bank_transfer') {
        return this.isCheckoutTransferConfirmed;
      }

      return true;
    },

    // Computed property để kiểm tra có thể đặt hàng không (quick buy)
    get canPlaceQuickBuyOrder() {
      // Nếu chọn COD thì luôn có thể đặt hàng
      if (this.quickBuyPaymentMethod === 'cod') return true;

      // Nếu chọn chuyển khoản thì phải xác nhận chuyển khoản trước
      if (this.quickBuyPaymentMethod === 'bank_transfer') {
        return this.isQuickBuyTransferConfirmed;
      }

      return true;
    },
    checkoutSelected() {
      if (!this.selectedCartItems.length) { this.miniCartError = 'Vui lòng chọn 1 sản phẩm để mua hàng'; return; }
      this.miniCartError = ''; this.view = 'cart'; this.isMiniCartOpen = false;
    },
    get selectedCartProducts() { return this.cart.filter(i => this.selectedCartItems.includes(i.cartId || i.id)); },

    addAddonToCart(addon) {

      // Khi modal Quick Buy đang mở, thêm vào Quick Buy thay vì giỏ hàng
      if (this.isQuickBuyModalOpen) {
        this.addAddonToQuickBuy(addon);
        return;
      }

      // Khi modal Product Detail đang mở, thêm vào Product Detail thay vì giỏ hàng
      if (this.isProductDetailOpen) {
        this.addAddonToProductDetail(addon);
        return;
      }

      const ex = this.cart.find(i => i.id === addon.id);
      if (ex) {
        ex.quantity++;
        // Đảm bảo item được select nếu chưa có trong selectedCartItems
        const itemId = ex.cartId || ex.id;
        if (!this.selectedCartItems.includes(itemId)) {
          this.selectedCartItems.push(itemId);
        }
      }
      else {
        const cartId = `${addon.id}-${Date.now()}`;
        const newItem = { ...addon, cartId: cartId, quantity: 1, weight: '', isAddon: true };
        this.cart.push(newItem);
        this.selectedCartItems.push(cartId);
      }
      this.triggerCartAnimation();

      // Thông báo khác nhau tùy theo addon
      if (addon.id === 'addon_tui_dau_tam') {
        this.showAlert(`Đã thêm ${addon.name}! 🚚 Bạn được miễn phí ship!`, 'success');
      } else if (addon.id === 'addon_bo_dau_tam_7_canh') {
        this.showAlert(`Đã thêm ${addon.name}! 🚚 Bạn được miễn phí ship!`, 'success');
      } else if (addon.id === 'addon_bo_dau_tam_9_canh') {
        this.showAlert(`Đã thêm ${addon.name}! 🚚 Bạn được miễn phí ship!`, 'success');
      } else if (addon.id === 'addon_moc_chia_khoa') {
        this.showAlert(`Đã thêm ${addon.name}! 💰 Giảm 5K!`, 'success');
      } else {
        this.showAlert(`Đã thêm ${addon.name} vào giỏ hàng!`, 'success');
      }
    },

    // Thêm addon vào Quick Buy (cho combo)
    addAddonToQuickBuy(addon) {

      const existing = this.quickBuySelectedAddons.find(a => a.id === addon.id);

      if (!existing) {
        // Thêm vào quickbuy
        this.quickBuySelectedAddons.push({ ...addon, quantity: 1 });

        // Đồng thời thêm vào giỏ hàng
        const ex = this.cart.find(i => i.id === addon.id);

        if (ex) {
          ex.quantity++;
          // Đảm bảo item được select nếu chưa có trong selectedCartItems
          const itemId = ex.cartId || ex.id;
          if (!this.selectedCartItems.includes(itemId)) {
            this.selectedCartItems.push(itemId);
          }
        } else {
          const cartId = `${addon.id}-${Date.now()}`;
          const newItem = { ...addon, cartId: cartId, quantity: 1, weight: '', isAddon: true };
          this.cart.push(newItem);
          this.selectedCartItems.push(cartId);
        }
        this.triggerCartAnimation();

        this.showAlert(`Đã thêm ${addon.name}! 💰 Giảm 5K!`, 'success');
      } else {
      }
    },

    // Xóa addon khỏi Quick Buy (cho combo)
    removeAddonFromQuickBuy(addonId) {
      // Xóa khỏi quickbuy
      this.quickBuySelectedAddons = this.quickBuySelectedAddons.filter(a => a.id !== addonId);

      // Đồng thời xóa khỏi giỏ hàng
      const cartItem = this.cart.find(i => i.id === addonId && i.isAddon);
      if (cartItem) {
        const itemId = cartItem.cartId || cartItem.id;
        this.cart = this.cart.filter(i => i !== cartItem);
        this.selectedCartItems = this.selectedCartItems.filter(id => id !== itemId);
      }

      const addon = this.addonProducts.find(a => a.id === addonId);
      this.showAlert(`Đã xóa ${addon?.name || 'addon'}!`, 'success');
    },

    // Thêm addon vào Product Detail (tách biệt với giỏ hàng)
    addAddonToProductDetail(addon) {

      const existing = this.productDetailSelectedAddons.find(a => a.id === addon.id);

      if (!existing) {
        // Thêm vào product detail selected addons
        this.productDetailSelectedAddons.push({ ...addon, quantity: 1 });

        // Đồng thời thêm vào giỏ hàng
        const ex = this.cart.find(i => i.id === addon.id);

        if (ex) {
          ex.quantity++;
          // Đảm bảo item được select nếu chưa có trong selectedCartItems
          const itemId = ex.cartId || ex.id;
          if (!this.selectedCartItems.includes(itemId)) {
            this.selectedCartItems.push(itemId);
          }
        } else {
          const cartId = `${addon.id}-${Date.now()}`;
          const newItem = { ...addon, cartId: cartId, quantity: 1, weight: '', isAddon: true };
          this.cart.push(newItem);
          this.selectedCartItems.push(cartId);
        }
        this.triggerCartAnimation();

        if (addon.id === 'addon_tui_dau_tam') {
          this.showAlert(`Đã thêm ${addon.name}! 🚚 Bạn được miễn phí ship!`, 'success');
        } else if (addon.id === 'addon_bo_dau_tam_7_canh') {
          this.showAlert(`Đã thêm ${addon.name}! 🚚 Bạn được miễn phí ship!`, 'success');
        } else if (addon.id === 'addon_bo_dau_tam_9_canh') {
          this.showAlert(`Đã thêm ${addon.name}! 🚚 Bạn được miễn phí ship!`, 'success');
        } else if (addon.id === 'addon_moc_chia_khoa') {
          this.showAlert(`Đã thêm ${addon.name}! 💰 Giảm 5K!`, 'success');
        } else {
          this.showAlert(`Đã thêm ${addon.name}!`, 'success');
        }
      } else {
      }
    },

    // Xóa addon khỏi Product Detail
    removeAddonFromProductDetail(addonId) {

      // Xóa khỏi product detail selected addons
      this.productDetailSelectedAddons = this.productDetailSelectedAddons.filter(a => a.id !== addonId);

      // Đồng thời xóa khỏi giỏ hàng
      const cartItem = this.cart.find(i => i.id === addonId && i.isAddon);

      if (cartItem) {
        const itemId = cartItem.cartId || cartItem.id;
        this.cart = this.cart.filter(i => i !== cartItem);
        this.selectedCartItems = this.selectedCartItems.filter(id => id !== itemId);
      }

      const addon = this.addonProducts.find(a => a.id === addonId);
      this.showAlert(`Đã xóa ${addon?.name || 'addon'}!`, 'success');
    },
    isAddonInCart(addonId) { return this.cart.some(i => i.id === addonId); },
    isFreeshippingFromDiscount() {
      if (!this.appliedDiscountCode) return false;
      const d = this.availableDiscounts.find(d => d.code?.toUpperCase() === this.appliedDiscountCode);
      return !!(d && d.type === 'shipping');
    },
    removeFromCart(productId, cartId = null) {
      // Khi modal Quick Buy đang mở, xóa khỏi Quick Buy thay vì giỏ hàng
      if (this.isQuickBuyModalOpen) {
        this.removeAddonFromQuickBuy(productId);
        return;
      }

      // Khi modal Product Detail đang mở, xóa khỏi Product Detail thay vì giỏ hàng
      if (this.isProductDetailOpen) {
        this.removeAddonFromProductDetail(productId);
        return;
      }

      const isAddon = this.addonProducts.some(a => a.id === productId);
      let removed;

      if (cartId) {
        // Remove by cartId for specific items (like bead products)
        removed = this.cart.find(i => i.cartId === cartId);
        this.cart = this.cart.filter(i => i.cartId !== cartId);
        this.selectedCartItems = this.selectedCartItems.filter(id => id !== cartId);
      } else {
        // Remove by productId for general items
        removed = this.cart.find(i => i.id === productId);
        this.cart = this.cart.filter(i => i.id !== productId);
        this.selectedCartItems = this.selectedCartItems.filter(id => id !== productId);
      }
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

    updateItemHandSize(cartId, newSize) {
      const item = this.cart.find(i => i.cartId === cartId);
      if (item) {
        item.selectedSize = newSize;
        item.handSize = newSize;
        item.weight = newSize; // Keep weight and size in sync for consistency
        this.saveCart();
      }
    },
    decreaseQuantity(productId) {
      const item = this.cart.find(i => i.id === productId);
      if (item && item.quantity > 1) { item.quantity--; this.revalidateAppliedDiscount(); }
      else if (item) { this.removeFromCart(productId); }
    },

    // Bead quantity management functions
    increaseBeadQuantity(cartId) {
      const item = this.cart.find(i => i.cartId === cartId);
      if (item && item.beadQuantity && item.beadQuantity < 50) {
        item.beadQuantity++;
        this.revalidateAppliedDiscount();
      }
    },

    decreaseBeadQuantity(cartId) {
      const item = this.cart.find(i => i.cartId === cartId);
      if (item && item.beadQuantity && item.beadQuantity > 1) {
        item.beadQuantity--;
        this.revalidateAppliedDiscount();
      } else if (item && item.beadQuantity && item.beadQuantity <= 1) {
        // Không cho phép giảm dưới 1 hạt, có thể xóa sản phẩm
        if (confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
          this.removeFromCart(item.id, cartId);
        }
      }
    },

    updateItemWeight(productId, weight) {
      // Tìm item bằng cartId trước, fallback về id nếu không có cartId
      const item = this.cart.find(i => i.cartId === productId || i.id === productId);
      if (item) {
        if (weight === 'custom') {
          // When "Khác..." is selected, don't update weight yet
          // Weight will be updated when user types in custom input
          return;
        }

        // Handle custom weight input (when it comes from number input)
        let finalWeight = weight;
        if (item.selectedWeight === 'custom' && weight) {
          // If custom is selected and we have a weight value
          const numericWeight = this.parseWeight(weight);

          // Validation: Chỉ cho phép cân nặng từ 20kg trở lên cho custom input
          if (numericWeight < 20) {
            // Hiển thị thông báo lỗi và không cập nhật
            this.showAlert('Cân nặng tùy chỉnh phải từ 20kg trở lên!', 'error');
            return;
          }

          finalWeight = weight;
          item.customWeight = numericWeight; // Store the number value
        }

        // Update the weight field
        item.weight = finalWeight;
        if (item.selectedWeight !== 'custom') {
          item.selectedWeight = weight;
        }

        // Calculate and update dynamic price
        const product = this.products.find(p => p.id === item.id);
        if (product) {
          const priceData = this.calculateDynamicPrice(product, finalWeight);
          item.basePrice = product.price;
          item.finalPrice = priceData.finalPrice;
          item.surcharge = priceData.surcharge;
          item.hasSurcharge = priceData.hasSurcharge;
        }

        // Update cart total
        this.updateCartTotal();

        // Clear weight error for this item if it exists
        if (this.weightErrors[productId]) {
          delete this.weightErrors[productId];
        }
      }
    },

    // Core Dynamic Pricing Functions
    calculateDynamicPrice(product, weightString) {
      // Kiểm tra product có tồn tại không
      if (!product) {
        return {
          finalPrice: 0,
          surcharge: 0,
          hasSurcharge: false,
          tier: 'standard'
        };
      }

      // Parse weight từ string (VD: "13kg" → 13)
      const weight = this.parseWeight(weightString);
      const basePrice = product.price;

      // Special cases
      if (weightString === 'Chưa sinh' || weightString === '🤱 Chưa sinh' || !weight) {
        return {
          finalPrice: basePrice,
          surcharge: 0,
          hasSurcharge: false,
          tier: 'standard'
        };
      }

      // Pricing logic
      const isAdult = this.isAdultProduct(product);
      const value = this.parseWeight(weightString); // This is now a generic value (weight or size)

      if (isAdult) {
        // Adult product: surcharge based on hand size
        if (value >= 17) { // Size từ 17cm trở lên
          const surcharge = this.pricingConfig.largeSizeSurcharge;
          return {
            finalPrice: basePrice + surcharge,
            surcharge: surcharge,
            hasSurcharge: true,
            tier: 'large'
          };
        }
      } else {
        // Kid product: surcharge based on weight
        if (value > this.pricingConfig.standardMaxWeight) {
          const surcharge = this.pricingConfig.largeSizeSurcharge;
          return {
            finalPrice: basePrice + surcharge,
            surcharge: surcharge,
            hasSurcharge: true,
            tier: 'large'
          };
        }
      }

      return {
        finalPrice: basePrice,
        surcharge: 0,
        hasSurcharge: false,
        tier: 'standard'
      };
    },

    parseWeight(weightString) {
      if (!weightString) return 0;

      // Handle both string and number inputs
      if (typeof weightString === 'number') {
        return weightString;
      }

      if (typeof weightString === 'string') {
        // Remove 'kg' and parse to float
        const cleanWeight = weightString.replace(/kg/gi, '').trim();
        const weight = parseFloat(cleanWeight);
        return isNaN(weight) ? 0 : weight;
      }

      return 0;
    },

    formatPriceWithSurcharge(product, weight) {
      const priceData = this.calculateDynamicPrice(product, weight);

      if (priceData.hasSurcharge) {
        return {
          display: this.formatCurrency(priceData.finalPrice),
          breakdown: `${this.formatCurrency(product.price)} + ${this.formatCurrency(priceData.surcharge)} (size lớn)`,
          hasSurcharge: true,
          surcharge: priceData.surcharge
        };
      }

      return {
        display: this.formatCurrency(priceData.finalPrice),
        breakdown: null,
        hasSurcharge: false,
        surcharge: 0
      };
    },

    updateCartTotal() {
      // Force reactivity update for cart calculations
      this.$nextTick(() => {
        // Chỉ revalidate discount khi thực sự có discount được áp dụng
        if (this.appliedDiscountCode || this.appliedGift || this.discountAmount > 0) {
          this.revalidateAppliedDiscount();
        }
      });
    },

    // Modal hướng dẫn cách đo size tay
    openSizingGuideModal() {
      this.isSizingGuideModalOpen = true;
    },

    closeSizingGuideModal() {
      this.isSizingGuideModalOpen = false;
    },

    buyNow(product) {

      // First, check for stock
      if (product.stock_quantity === 0) {
        this.showAlert('Sản phẩm này đã hết hàng!', 'error');
        return;
      }


      // Mua ngay - bỏ qua giỏ hàng hoàn toàn
      this.quickBuyProduct = { ...product };
      // Set default quantity to empty for all products to force user selection
      this.quickBuyQuantity = ''; // Default to the placeholder option for all products
      this.quickBuyWeight = '';
      this.quickBuyCustomWeight = '';
      this.quickBuyBabyName = '';
      this.quickBuyNotes = '';

      // Kiểm tra xem có cần hiển thị ô cân nặng không
      const skipWeightCategories = ['san_pham_ban_kem', 'hat_dau_tam_mai_san', 'bi_charm_bac'];
      this.showWeightInQuickBuy = !skipWeightCategories.includes(product.category);

      // Kiểm tra xem có phải sản phẩm người lớn không
      this.isAdultInQuickBuy = this.isAdultProduct(product);

      this.isQuickBuyModalOpen = true;
      this.startSocialProofTimer();


      // Revalidate mã giảm giá với sản phẩm và số lượng mới
      this.$nextTick(() => {
        this.revalidateQuickBuyDiscount();
      });

      // Auto-focus vào field đầu tiên
      this.$nextTick(() => {
        setTimeout(() => {
          const firstInput = document.querySelector('#quickBuyModal input[type="text"]');
          if (firstInput && !this.customer.name) {
            firstInput.focus();
          }
        }, 300);
      });
    },
    closeQuickBuyModal() {

      this.isQuickBuyModalOpen = false;
      this.isBuyingCombo = false; // Reset combo flag
      this.quickBuyProduct = null;
      this.quickBuyQuantity = '';
      this.quickBuyWeight = '';
      this.quickBuyCustomWeight = '';
      this.quickBuyBabyName = '';
      this.quickBuyNotes = '';
      this.quickBuyPaymentMethod = 'cod'; // Reset về COD
      this.isQuickBuyTransferConfirmed = false; // Reset trạng thái xác nhận
      this.quickBuySelectedAddons = []; // Reset addon được chọn
      this.showWeightInQuickBuy = true; // Reset hiển thị cân nặng
      this.isAdultInQuickBuy = false; // Reset hiển thị size tay
      this.clearFormErrors(); // Clear validation errors
      this.stopSocialProofTimer();

      // KHÔNG đóng modal combo detail khi đóng modal mua ngay
      // Để người dùng có thể tiếp tục xem thông tin combo
      // if (this.isComboImageModalOpen) {
      //   this.closeComboImageModal();
      // }

      // Giữ nguyên discount state để có thể tái sử dụng

    },



    // Hàm xử lý order success tập trung
    handleOrderSuccess() {
      // Ẩn Quick Buy Modal
      this.isQuickBuyModalOpen = false;



      // Hiển thị Success Modal (cho cả COD và Bank Transfer)
      this.isSuccessModalOpen = true;
    },

    // Helper: Xóa referral khỏi localStorage
    clearReferralStorage() {
      localStorage.removeItem('referralData');
      localStorage.removeItem('referralCode'); // Legacy cleanup
    },

    // Helper: Đóng tất cả modal
    closeAllModals() {

      this.isImageModalOpen = false;
      this.isAlertModalOpen = false;
      this.isSuccessModalOpen = false;
      this.isConfirmModalOpen = false;
      this.isCheckoutModalOpen = false;
      this.isMiniCartOpen = false;
      this.isDiscountModalOpen = false;
      this.isQuickBuyModalOpen = false;
      this.isBuyingCombo = false;
      this.isCheckoutConfirmTransferModalOpen = false;
      this.isComboImageModalOpen = false;
      this.isAddonDetailModalOpen = false;
      this.isProductDetailOpen = false;
      this.isSizingGuideModalOpen = false;



    },

    // Mở modal Quick View
    openQuickView(product) {
      this.quickViewProduct = product;
      this.isQuickViewOpen = true;
      document.body.style.overflow = 'hidden';
    },

    // Đóng modal Quick View
    closeQuickView() {
      this.isQuickViewOpen = false;
      this.quickViewProduct = null;
      // Restore body scroll only if no other modal is open
      if (!this.isMiniCartOpen && !this.isCheckoutModalOpen && !this.isProductDetailOpen && !this.isQuickBuyModalOpen && !this.isSizingGuideModalOpen) {
        document.body.style.overflow = 'auto';
      }
    },

    // Mở modal hướng dẫn đo size
    openSizingGuideModal() {
      this.isSizingGuideModalOpen = true;
      this.preventQuickBuyCloseOnEscape = true; // Ngăn modal Quick Buy đóng khi bấm ESC
    },

    // Đóng modal hướng dẫn đo size
    closeSizingGuideModal() {
      this.isSizingGuideModalOpen = false;
      this.preventQuickBuyCloseOnEscape = false; // Cho phép modal Quick Buy đóng lại
    },

    // Xác nhận chuyển khoản và tiếp tục đặt hàng
    async confirmTransferAndSubmit() {
      this.isQuickBuySubmitting = true;

      try {
        // Tạo đơn hàng trực tiếp từ sản phẩm
        const orderItem = {
          ...this.quickBuyProduct,
          quantity: this.quickBuyQuantity,
          weight: this.quickBuyWeight,
          babyName: this.quickBuyBabyName, // Tên bé cần khắc
          note: this.quickBuyNotes,
          cartId: `quickbuy-${Date.now()}`
        };

        const subtotal = this.quickBuyOrderValue; // Tổng giá trị sản phẩm (bao gồm addon)
        const shippingFee = this.quickBuyShippingFee;
        const total = this.quickBuyTotal;

        // Tạo orderId cho quick buy
        const newOrderId = this.generateOrderId();
        this.lastOrderId = newOrderId;

        const orderDetails = {
          orderId: newOrderId,
          cart: [{
            name: orderItem.name,
            price: this.formatCurrency(orderItem.price),
            quantity: orderItem.quantity,
            weight: orderItem.weight,
            notes: orderItem.notes || ''
          }],
          customer: {
            name: this.customer.name,
            phone: this.customer.phone,
            email: this.customer.email,
            address: this.customer.address,
            notes: this.quickBuyNotes,
            province_id: this.selectedProvince || null,
            district_id: this.selectedDistrict || null,
            ward_id: this.selectedWard || null,
            street_address: this.streetAddress || null
          },
          orderDate: new Date().toISOString(),
          subtotal: this.formatCurrency(subtotal),
          shipping: shippingFee === 0 ? 'Miễn phí' : this.formatCurrency(shippingFee),
          discount: this.discountAmount > 0 ? `-${this.formatCurrency(this.discountAmount)} (${this.appliedDiscountCode})` : 'Không có',
          total: this.formatCurrency(total),
          totalAmount: total, // Số nguyên không format
          paymentMethod: 'Chuyển khoản ngân hàng',
          referralCode: (this.referralCode && this.validateReferralCode(this.referralCode)) ? this.referralCode : '',
          referralPartner: (this.referralCode && this.validateReferralCode(this.referralCode)) ? (this.getPartnerInfo(this.referralCode)?.name || '') : '',
          referralCommission: (this.referralCode && this.validateReferralCode(this.referralCode)) ? this.calculateCommission(total, this.referralCode) : 0,
          telegramNotification: 'VDT_SECRET_2025_ANHIEN'
        };

        // Gửi đơn hàng đến API (tự động phát hiện môi trường)
        const apiUrl = this.getApiUrl('/api/order/create');
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderDetails)
        });

        const result = await res.json();

        if (!result.success) {
          throw new Error(result.error || 'Không thể tạo đơn hàng');
        }

        console.log('✅ Đơn hàng đã được lưu:', result);

        // Thành công - xử lý success
        this.handleOrderSuccess();

      } catch (e) {
        console.error('Lỗi quick buy:', e);
        this.showAlert(`Lỗi đặt hàng: ${e.message}`, 'error');
      } finally {
        this.isQuickBuySubmitting = false;
      }
    },


    clearFieldError(fieldName) {
      if (this.formErrors[fieldName]) {
        this.formErrors[fieldName] = '';
      }
    },

    // Scroll to first error in Quick Buy modal - optimized version
    scrollToFirstQuickBuyError() {
      this.$nextTick(() => {
        // Priority order for error fields (top to bottom in form layout)
        const errorSelectors = {
          name: 'input[x-model="customer.name"]',
          phone: 'input[x-model="customer.phone"]',
          province: 'select[x-model="selectedProvince"]',
          district: 'select[x-model="selectedDistrict"]',
          ward: 'select[x-model="selectedWard"]',
          streetAddress: 'input[x-model="streetAddress"]',
          quantity: '#quick-buy-quantity-section',
          weight: 'select[x-model="quickBuyWeight"]',
          babyName: 'input[x-model="quickBuyBabyName"]',
          paymentMethod: '[x-model="quickBuyPaymentMethod"]'
        };

        // Find first error and scroll to it
        for (const [field, selector] of Object.entries(errorSelectors)) {
          if (this.formErrors[field]) {
            const element = document.querySelector(selector);
            if (element) {
              const modalContent = element.closest('.modal-scroll') || element.closest('.overflow-y-auto');
              if (modalContent) {
                const elementTop = element.offsetTop - modalContent.offsetTop;
                modalContent.scrollTo({ top: Math.max(0, elementTop - 80), behavior: 'smooth' });
              } else {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
              // Focus input/select elements
              if (['INPUT', 'SELECT'].includes(element.tagName)) {
                setTimeout(() => element.focus(), 200);
              }
              break;
            }
          }
        }
      });
    },

    // Scroll to first error in Checkout modal
    scrollToFirstCheckoutError() {

      // Priority order for error fields (top to bottom in checkout form layout)
      const errorPriority = ['name', 'phone', 'province', 'district', 'ward', 'streetAddress', 'paymentMethod'];

      // Find the first error field based on priority
      let firstErrorField = null;
      for (const field of errorPriority) {
        if (this.formErrors[field]) {
          firstErrorField = field;
          break;
        }
      }

      if (!firstErrorField) {
        return;
      }


      // Map field names to their corresponding input selectors in checkout modal
      const fieldSelectors = {
        name: 'input[x-model="customer.name"]',
        phone: 'input[x-model="customer.phone"]',
        province: 'select[x-model="selectedProvince"]',
        district: 'select[x-model="selectedDistrict"]',
        ward: 'select[x-model="selectedWard"]',
        streetAddress: 'input[x-model="streetAddress"]',
        paymentMethod: 'div[x-show="paymentMethod === \'cod\'"], div[x-show="paymentMethod === \'transfer\'"]'
      };

      const selector = fieldSelectors[firstErrorField];
      if (!selector) {
        return;
      }

      // Find the checkout modal container
      const checkoutModal = document.querySelector('[x-show="isCheckoutModalOpen"]');
      if (!checkoutModal) {
        return;
      }

      // Find the scrollable content area within checkout modal
      const scrollContainer = checkoutModal.querySelector('.overflow-y-auto');
      if (!scrollContainer) {
        return;
      }

      // Find the target element within the checkout modal
      const targetElement = checkoutModal.querySelector(selector);
      if (!targetElement) {
        return;
      }

      // Calculate scroll position
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop;

      // Calculate the position to scroll to (with some offset for better visibility)
      const targetScrollPosition = scrollTop + (targetRect.top - containerRect.top) - 20;


      // Smooth scroll to the target position
      scrollContainer.scrollTo({
        top: Math.max(0, targetScrollPosition),
        behavior: 'smooth'
      });

      // Optional: Focus the element after a short delay
      setTimeout(() => {
        if (targetElement.focus && typeof targetElement.focus === 'function') {
          targetElement.focus();
        }
      }, 300);
    },

    async quickBuySubmit() {
      // Clear previous errors
      this.clearFormErrors();

      // Ensure address is updated before validation
      this.updateFullAddress();

      // Debug logging for address validation

      // Validate form using formErrors system
      let isValid = true;

      // 1. Validate baby name if it's an engraving product
      if (this.isEngravingProductInQuickBuy && !this.quickBuyNotes.trim()) {
        this.formErrors.quickBuyNotes = 'Vui lòng nhập tên bé cần khắc...Ví dụ "Hoàng Anh - Khoai"';
        isValid = false;
        this.$nextTick(() => {
          this.$refs.quickBuyNotesInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        return; // Dừng lại và cuộn đến lỗi đầu tiên
      }

      if (!this.customer.name.trim()) {
        this.formErrors.name = 'Vui lòng nhập họ và tên';
        isValid = false;
      }

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

      // Validate address fields individually for Quick Buy
      if (!this.selectedProvince || String(this.selectedProvince).trim() === '') {
        this.formErrors.province = 'Vui lòng chọn tỉnh/thành phố';
        isValid = false;
      }
      if (!this.selectedDistrict || String(this.selectedDistrict).trim() === '') {
        this.formErrors.district = 'Vui lòng chọn quận/huyện';
        isValid = false;
      }
      if (!this.selectedWard || String(this.selectedWard).trim() === '') {
        this.formErrors.ward = 'Vui lòng chọn phường/xã';
        isValid = false;
      }
      if (!this.streetAddress || !this.streetAddress.trim()) {
        this.formErrors.streetAddress = 'Vui lòng nhập địa chỉ cụ thể';
        isValid = false;
      }

      // Bỏ qua validation cân nặng cho các sản phẩm không cần thiết trong quick buy
      const skipWeightCategories = ['san_pham_ban_kem', 'hat_dau_tam_mai_san', 'bi_charm_bac'];
      const shouldSkipWeightValidation = this.quickBuyProduct &&
        (skipWeightCategories.includes(this.quickBuyProduct.category) ||
          this.quickBuyProduct.id === 'addon_moc_chia_khoa' ||
          this.quickBuyProduct.id === 'addon_tui_dau_tam');

      if (this.quickBuyProduct && !shouldSkipWeightValidation) {
        // Kiểm tra xem có phải sản phẩm người lớn không
        const isAdult = this.isAdultProduct(this.quickBuyProduct);

        if (!this.quickBuyWeight || this.quickBuyWeight.trim() === '' ||
          this.quickBuyWeight === '- Chọn cân nặng -' ||
          this.quickBuyWeight === '-- Chọn size tay --') {
          this.formErrors.weight = isAdult ? 'Vui lòng chọn size tay' : 'Vui lòng chọn cân nặng của bé';
          isValid = false;
        } else if (!isAdult && this.quickBuyWeight === '✏️ Nhập cân nặng > 20kg' && (!this.quickBuyCustomWeight || this.quickBuyCustomWeight < 20)) {
          this.formErrors.weight = 'Vui lòng nhập cân nặng cụ thể từ 20kg trở lên';
          isValid = false;
        } else if (!isAdult && this.quickBuyWeight.includes('kg') && this.parseWeight(this.quickBuyWeight) >= 20 && this.parseWeight(this.quickBuyWeight) < 20) {
          // Validation cho custom weight nếu có
          this.formErrors.weight = 'Cân nặng phải từ 20kg trở lên';
          isValid = false;
        }
      }

      // Validation cho tên bé - chỉ cho sản phẩm mix thẻ tên bé
      if (this.quickBuyProduct && this.quickBuyProduct.categories && this.quickBuyProduct.categories.includes('mix_the_ten_be')) {
        if (!this.quickBuyBabyName || this.quickBuyBabyName.trim() === '') {
          this.formErrors.babyName = 'Nhập tên bé ví dụ Nhím - Nhím hoặc Nhím - Nhật Minh';
          isValid = false;
        }
      }

      // Validation số lượng cho tất cả sản phẩm
      if (!this.quickBuyQuantity || this.quickBuyQuantity < 1) {
        if (this.quickBuyProduct && this.quickBuyProduct.category === 'hat_dau_tam_mai_san') {
          this.formErrors.quantity = 'Vui lòng chọn số lượng hạt dâu';
        } else {
          this.formErrors.quantity = 'Vui lòng chọn số lượng sản phẩm';
        }
        isValid = false;
      }

      if (!this.quickBuyPaymentMethod) {
        this.formErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán';
        isValid = false;
      }

      if (!isValid) {
        this.scrollToFirstQuickBuyError();
        return;
      }

      // Kiểm tra xác nhận chuyển khoản nếu cần
      if (this.quickBuyPaymentMethod === 'bank_transfer' && !this.isQuickBuyTransferConfirmed) {
        this.showAlert('Vui lòng xác nhận chuyển khoản trước khi đặt hàng!', 'error');
        return;
      }

      this.isQuickBuySubmitting = true;

      try {
        // Tạo đơn hàng trực tiếp từ sản phẩm
        const orderItem = {
          ...this.quickBuyProduct,
          quantity: this.quickBuyQuantity,
          weight: this.quickBuyWeight,
          babyName: this.quickBuyBabyName, // Tên bé cần khắc
          note: this.quickBuyNotes, // Ghi chú thêm
          cartId: `quickbuy-${Date.now()}`
        };

        // Thêm addon products vào đơn hàng
        const cartItems = [{
          name: orderItem.name,
          price: this.formatCurrency(orderItem.price),
          quantity: orderItem.quantity,
          weight: orderItem.weight,
          notes: orderItem.notes || ''
        }];

        // Thêm addon products từ cart
        this.quickBuyAddons.forEach(addon => {
          cartItems.push({
            name: addon.name,
            price: this.formatCurrency(addon.price),
            quantity: addon.quantity,
            weight: '',
            notes: 'Sản phẩm bán kèm'
          });
        });

        const subtotal = this.quickBuyOrderValue; // Tổng giá trị sản phẩm (bao gồm addon)
        const shippingFee = this.quickBuyShippingFee; // Phí ship thực tế sau khi trừ freeship
        const total = this.quickBuyTotal;

        // Tạo orderId cho quick buy
        const newOrderId = this.generateOrderId();
        this.lastOrderId = newOrderId;



        const orderDetails = {
          orderId: newOrderId,
          cart: cartItems,
          customer: {
            name: this.customer.name,
            phone: this.customer.phone,
            email: this.customer.email,
            address: this.customer.address,
            notes: this.quickBuyNotes,
            province_id: this.selectedProvince || null,
            district_id: this.selectedDistrict || null,
            ward_id: this.selectedWard || null,
            street_address: this.streetAddress || null
          },
          orderDate: new Date().toISOString(),
          subtotal: this.formatCurrency(subtotal),
          shipping: shippingFee === 0 ? 'Miễn phí' : this.formatCurrency(shippingFee),
          discount: this.discountAmount > 0 ? `-${this.formatCurrency(this.discountAmount)} (${this.appliedDiscountCode})` : 'Không có',
          total: this.formatCurrency(total),
          totalAmount: total, // Số nguyên không format
          paymentMethod: this.quickBuyPaymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng',
          referralCode: (this.referralCode && this.validateReferralCode(this.referralCode)) ? this.referralCode : '',
          referralPartner: (this.referralCode && this.validateReferralCode(this.referralCode)) ? (this.getPartnerInfo(this.referralCode)?.name || '') : '',
          referralCommission: (this.referralCode && this.validateReferralCode(this.referralCode)) ? this.calculateCommission(total, this.referralCode) : 0,
          telegramNotification: 'VDT_SECRET_2025_ANHIEN'
        };

        // Gửi đơn hàng đến API (tự động phát hiện môi trường)
        const apiUrl = this.getApiUrl('/api/order/create');
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderDetails)
        });

        const result = await res.json();

        if (!result.success) {
          throw new Error(result.error || 'Không thể tạo đơn hàng');
        }

        console.log('✅ Đơn hàng đã được lưu:', result);

        // Thành công - gọi hàm xử lý success chung
        this.handleOrderSuccess();

      } catch (e) {
        console.error('Lỗi quick buy:', e);
        this.showAlert(`Lỗi đặt hàng: ${e.message}`, 'error');
      } finally {
        this.isQuickBuySubmitting = false;
      }
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
      this.giftCode = '';
      this.discountAmount = 0;
      this.discountError = '';
    },

    // Reset chỉ mã giảm giá (giữ lại gift)
    resetDiscountOnly() {
      this.discountCode = '';
      this.appliedDiscountCode = '';
      this.discountAmount = 0;
      this.discountError = '';
    },

    // Reset chỉ mã quà tặng (giữ lại discount)
    resetGiftOnly() {
      this.giftCode = '';
      this.appliedGift = null;
      this.discountError = '';
    },
    openDiscountModal() {
      this.preventMiniCartCloseOnClickOutside = true;
      this.isDiscountModalFromQuickBuy = this.isQuickBuyModalOpen; // Set flag nếu mở từ Quick Buy
      if (this.isQuickBuyModalOpen) {
        this.preventQuickBuyCloseOnEscape = true; // Ngăn đóng Quick Buy khi mở modal con
      }
      this.isDiscountModalOpen = true;
    },
    closeDiscountModal() {
      this.isDiscountModalOpen = false;
      this.discountError = '';
      this.isDiscountModalFromQuickBuy = false; // Reset flag
      // Đồng bộ lại code hiển thị với code đã áp dụng, xoá code lỗi
      this.discountCode = this.appliedDiscountCode;
      this.giftCode = this.appliedGift?.code || '';
      setTimeout(() => {
        this.preventMiniCartCloseOnClickOutside = false;
        this.preventQuickBuyCloseOnEscape = false; // Reset flag cho Quick Buy
      }, 100);
    },
    selectDiscount(code) { this.discountCode = code; },
    selectGift(code) { this.giftCode = code; },

    applySelectedDiscount(andClose = false) {
      // Thu thập các mã đã chọn
      let selectedDiscountCode = this.discountCode?.trim().toUpperCase();
      let selectedGiftCode = this.giftCode?.trim().toUpperCase();

      // Nếu nhập mã thủ công vào discountCode, kiểm tra xem có phải gift không
      if (selectedDiscountCode && !selectedGiftCode) {
        const rawCheck = this.availableDiscounts.find(d => (d.code || '').toUpperCase() === selectedDiscountCode);
        if (rawCheck && rawCheck.type === 'gift') {
          // Chuyển sang giftCode
          selectedGiftCode = selectedDiscountCode;
          this.giftCode = selectedDiscountCode;
          selectedDiscountCode = '';
          this.discountCode = '';
        }
      }

      if (!selectedDiscountCode && !selectedGiftCode) {
        this.discountError = 'Vui lòng chọn ít nhất một mã khuyến mãi.';
        return;
      }

      const isFromQuickBuy = this.isDiscountModalFromQuickBuy;
      const subtotal = isFromQuickBuy ? this.quickBuyOrderValue : this.cartSubtotal();
      const quantity = isFromQuickBuy ? this.quickBuyQuantity : this.totalCartQuantity;

      let appliedCodes = [];
      let errorMessages = [];

      // Áp dụng mã giảm giá (nếu có)
      if (selectedDiscountCode) {
        const raw = this.availableDiscounts.find(d => (d.code || '').toUpperCase() === selectedDiscountCode);
        const promotion = this._normalizeDiscount(raw);

        if (!promotion || !promotion.active) {
          errorMessages.push(`Mã ${selectedDiscountCode} không hợp lệ hoặc đã hết hạn.`);
        } else if (subtotal < promotion.minOrder) {
          errorMessages.push(`${selectedDiscountCode} chỉ áp dụng cho đơn từ ${this.formatCurrency(promotion.minOrder)}.`);
        } else if (promotion.minItems && quantity < promotion.minItems) {
          errorMessages.push(`${selectedDiscountCode} chỉ áp dụng khi có từ ${promotion.minItems} SP trở lên.`);
        } else {
          // Áp dụng thành công
          this.resetDiscountOnly();
          this.appliedDiscountCode = selectedDiscountCode;

          if (promotion.type === 'shipping') {
            // freeship
          } else if (promotion.type === 'fixed') {
            this.discountAmount = promotion.value;
          } else if (promotion.type === 'percentage') {
            const contextSubtotal = isFromQuickBuy ? this.quickBuyOrderValue : this.cartSubtotal();
            this.discountAmount = Math.floor(contextSubtotal * promotion.value / 100);
          }

          const maxDiscount = isFromQuickBuy ? this.quickBuyOrderValue : this.cartSubtotal();
          if (this.discountAmount > maxDiscount) this.discountAmount = maxDiscount;

          appliedCodes.push(selectedDiscountCode);
        }
      }

      // Áp dụng mã quà tặng (nếu có)
      if (selectedGiftCode) {
        const raw = this.availableDiscounts.find(d => (d.code || '').toUpperCase() === selectedGiftCode);
        const promotion = this._normalizeDiscount(raw);

        if (!promotion || !promotion.active) {
          errorMessages.push(`Mã ${selectedGiftCode} không hợp lệ hoặc đã hết hạn.`);
        } else if (subtotal < promotion.minOrder) {
          errorMessages.push(`${selectedGiftCode} chỉ áp dụng cho đơn từ ${this.formatCurrency(promotion.minOrder)}.`);
        } else if (promotion.minItems && quantity < promotion.minItems) {
          errorMessages.push(`${selectedGiftCode} chỉ áp dụng khi có từ ${promotion.minItems} SP trở lên.`);
        } else {
          // Áp dụng thành công
          this.resetGiftOnly();
          this.appliedGift = { title: promotion.title, value: promotion.value, code: selectedGiftCode };
          appliedCodes.push(selectedGiftCode);
        }
      }

      // Hiển thị kết quả
      if (errorMessages.length > 0) {
        this.discountError = errorMessages.join(' ');
        return;
      }

      if (appliedCodes.length > 0) {
        const message = appliedCodes.length === 1
          ? `Đã áp dụng mã ${appliedCodes[0]}!`
          : `Đã áp dụng ${appliedCodes.length} mã: ${appliedCodes.join(', ')}!`;
        this.showAlert(message, 'success');
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

      const mapped = allVisible.map(d => {
        // Sử dụng logic khác nhau tùy theo context
        if (this.isDiscountModalFromQuickBuy) {
          // Logic cho Quick Buy - tính theo tổng giá trị đơn hàng (bao gồm addon)
          const promotion = this._normalizeDiscount(d);
          const available = promotion &&
            this.quickBuyOrderValue >= promotion.minOrder &&
            (!promotion.minItems || this.quickBuyQuantity >= promotion.minItems);

          const reason = !available
            ? (this.quickBuyOrderValue < promotion.minOrder
              ? `Cần mua thêm ${this.formatCurrency(promotion.minOrder - this.quickBuyOrderValue)}`
              : `Cần thêm ${promotion.minItems - this.quickBuyQuantity} sản phẩm`)
            : '';

          return {
            ...d,
            availability: { available, reason },
            effectiveValue: available ? this.calculateQuickBuyDiscountValue(promotion) : 0
          };
        } else {
          // Logic cho Cart - tính theo giỏ hàng
          return {
            ...d,
            availability: this.getDiscountAvailability(d),
            effectiveValue: this.getDiscountEffectiveValue(d)
          };
        }
      });

      return mapped.sort((a, b) => {
        // Ưu tiên các mã có sẵn lên trên
        if (a.availability.available && !b.availability.available) return -1;
        if (!a.availability.available && b.availability.available) return 1;

        // Nếu cả hai đều có sẵn hoặc không, sắp xếp theo giá trị giảm dần
        return b.effectiveValue - a.effectiveValue;
      });
    },

    // Mã giảm giá thông thường (không phải quà tặng)
    get normalDiscounts() {
      return this.sortedDiscounts.filter(d => d.type !== 'gift');
    },

    // Mã khuyến mãi quà tặng
    get giftDiscounts() {
      const gifts = this.sortedDiscounts.filter(d => d.type === 'gift');
      return gifts;
    },

    // Lấy giá trị quà tặng từ products.json
    getGiftValue(discount) {
      if (discount.type !== 'gift' || !discount.value?.name) return 0;

      // Tìm sản phẩm trong products.json theo tên
      const product = this.products.find(p =>
        p.name.toLowerCase().includes(discount.value.name.toLowerCase()) ||
        discount.value.name.toLowerCase().includes(p.name.toLowerCase())
      );

      return product ? product.price : 0;
    },

    get isEligibleForAnyDiscount() {
      // Chỉ hiển thị nếu chưa có mã nào được áp dụng và có mã hợp lệ
      if (this.appliedDiscountCode || this.appliedGift) return false;
      return this.hasAnyApplicableDiscounts;
    },
    openCheckout() {
      // Clear previous weight errors
      this.weightErrors = {};

      // Validate weight for all cart items trước khi mở checkout (bỏ qua addon products)
      let hasWeightError = false;
      let firstErrorItemId = null;

      for (let i = 0; i < this.cart.length; i++) {
        const item = this.cart[i];

        // Bỏ qua validation cân nặng cho addon products
        // Bỏ qua validation cho cả sản phẩm hạt (bead product)
        if (item.id === 'addon_moc_chia_khoa' || item.id === 'addon_tui_dau_tam' || this.isAddonProduct(item) || item.beadQuantity) {
          continue;
        }

        // Kiểm tra xem có phải sản phẩm người lớn không
        const isAdult = this.isAdultProduct(item);

        if (!item.weight || item.weight.trim() === '') {
          const itemKey = item.cartId || item.id;
          this.weightErrors[itemKey] = isAdult ? 'Vui lòng chọn size tay' : 'Vui lòng chọn cân nặng bé';
          hasWeightError = true;

          // Lưu ID của sản phẩm đầu tiên thiếu cân nặng
          if (!firstErrorItemId) {
            firstErrorItemId = itemKey;
          }
        }
      }

      // Nếu có lỗi cân nặng, cuộn đến sản phẩm đầu tiên thiếu cân nặng
      if (hasWeightError && firstErrorItemId) {
        this.scrollToWeightError(firstErrorItemId);
        return;
      }

      // Mở checkout modal chồng lên mini cart (mini cart vẫn mở bên dưới)
      this.socialProofViewers = Math.floor(Math.random() * 5) + 1;
      this.isCheckoutModalOpen = true;
      this.startSocialProofTimer();

      // Auto-focus vào field đầu tiên
      this.$nextTick(() => {
        setTimeout(() => {
          const firstInput = this.$refs.firstInput;
          if (firstInput && !this.customer.name) {
            firstInput.focus();
          }
        }, 300);
      });
    },

    // Scroll to first weight error for better UX
    scrollToWeightError(itemId) {
      // Đợi DOM update để hiển thị error message
      this.$nextTick(() => {
        setTimeout(() => {
          // Tìm element của cart item có lỗi
          const cartItemElement = document.querySelector(`[data-cart-item-id="${itemId}"]`);

          if (cartItemElement) {
            // Tính toán vị trí cuộn để hiển thị phần weight selector
            const weightSection = cartItemElement.querySelector('.cart-item-weight-section');
            const targetElement = weightSection || cartItemElement;

            // Cuộn mượt mà đến vị trí với offset để không bị che bởi header
            const offsetTop = targetElement.offsetTop - 100; // 100px offset từ top

            // Cuộn trong mini cart modal (nếu có scroll container)
            const miniCartContent = document.querySelector('.mini-cart-content');
            if (miniCartContent) {
              miniCartContent.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
              });
            } else {
              // Fallback: cuộn toàn trang
              window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
              });
            }

            // Highlight weight selector để thu hút sự chú ý
            const weightSelector = targetElement.querySelector('.weight-selector');
            if (weightSelector) {
              // Thêm hiệu ứng highlight tạm thời
              weightSelector.classList.add('ring-2', 'ring-red-400', 'ring-opacity-75');
              setTimeout(() => {
                weightSelector.classList.remove('ring-2', 'ring-red-400', 'ring-opacity-75');
              }, 2000); // Bỏ highlight sau 2 giây
            }
          }
        }, 100); // Delay nhỏ để đảm bảo error message đã render
      });
    },

    closeCheckoutModal() {
      // Đóng checkout modal - mini cart đã mở sẵn bên dưới
      this.isCheckoutModalOpen = false;
      this.stopSocialProofTimer();
    },

    goBackToMiniCart() {
      // Đóng checkout modal - mini cart đã mở sẵn bên dưới
      this.isCheckoutModalOpen = false;
      this.stopSocialProofTimer();
    },

    /* ========= CHECKOUT ========= */
    validateAndShowConfirmModal() {
      // Clear previous errors
      this.clearFormErrors();

      // Validate form
      const isValid = this.validateForm();

      if (!isValid) {
        return; // Errors will be shown inline
      }

      // Mở Confirm Modal chồng lên Checkout Modal
      this.isConfirmModalOpen = true;
    },

    clearFormErrors() {
      Object.keys(this.formErrors).forEach(key => {
        this.formErrors[key] = '';
      });
    },

    // Function để reset form data
    resetFormData() {
      this.selectedProvince = '';
      this.selectedDistrict = '';
      this.selectedWard = '';
      this.streetAddress = '';
      this.customer.name = '';
      this.customer.phone = '';
      this.customer.email = '';
      this.customer.address = '';
      this.paymentMethod = 'cod';
      this.clearFormErrors();
    },

    validateForm() {
      let isValid = true;

      // Validate cart
      if (!this.cart.length) {
        this.showAlert('Giỏ hàng của bạn đang trống.', 'error');
        return false;
      }

      // Validate bead quantity for specific products in cart
      for (const item of this.cart) {
        if (item.category === 'hat_dau_tam_mai_san' && (!item.beadQuantity || item.beadQuantity < 1)) {
          this.showAlert(`Vui lòng chọn số lượng hạt cho sản phẩm "${item.name}" trong giỏ hàng.`, 'error');
          return false; // Stop validation
        }
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

      // Validate address - check for empty string, null, undefined, or just whitespace
      if (!this.selectedProvince || String(this.selectedProvince).trim() === '') {
        this.formErrors.province = 'Vui lòng chọn tỉnh/thành phố';
        isValid = false;
      }

      if (!this.selectedDistrict || String(this.selectedDistrict).trim() === '') {
        this.formErrors.district = 'Vui lòng chọn quận/huyện';
        isValid = false;
      }

      if (!this.selectedWard || String(this.selectedWard).trim() === '') {
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


      // If validation failed, scroll to first error
      if (!isValid) {
        setTimeout(() => {
          this.scrollToFirstCheckoutError();
        }, 100);
      }

      return isValid;
    },

    async confirmAndSubmitOrder() {
      // Validate form again before submitting (double check)
      this.clearFormErrors();
      if (!this.validateForm()) {
        this.isSubmitting = false;
        // Close confirm modal and go back to checkout modal to show errors
        this.isConfirmModalOpen = false;
        this.isCheckoutModalOpen = true;
        return;
      }

      this.isSubmitting = true;
      this.updateFullAddress();

      const newOrderId = this.generateOrderId();
      this.lastOrderId = newOrderId;



      const orderDetails = {
        orderId: newOrderId,
        cart: (() => {
          const items = this.cart.map(i => ({
            name: i.name, price: this.formatCurrency(i.price), quantity: i.quantity, weight: i.weight, notes: i.notes || ''
          }));
          if (this.appliedGift) items.push({ name: this.appliedGift.title, price: 'Miễn phí', quantity: 1, weight: 0, notes: '' });
          return items;
        })(),
        customer: { 
          name: this.customer.name, 
          phone: this.customer.phone, 
          email: this.customer.email, 
          address: this.customer.address, 
          notes: this.customer.notes,
          province_id: this.selectedProvince || null,
          district_id: this.selectedDistrict || null,
          ward_id: this.selectedWard || null,
          street_address: this.streetAddress || null
        },
        orderDate: new Date().toISOString(),
        subtotal: this.formatCurrency(this.cartSubtotal()),
        shipping: this.shippingFee() === 0 ? (this.freeShipping ? 'Miễn phí (FREESHIP)' : 'Miễn phí') : this.formatCurrency(this.shippingFee()),
        discount: this.discountAmount > 0 ? `-${this.formatCurrency(this.discountAmount)} (${this.appliedDiscountCode})` : 'Không có',
        total: this.formatCurrency(this.cartTotal()),
        totalAmount: this.cartTotal(), // Số nguyên không format
        paymentMethod: this.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng',
        referralCode: (this.referralCode && this.validateReferralCode(this.referralCode)) ? this.referralCode : '',
        referralPartner: (this.referralCode && this.validateReferralCode(this.referralCode)) ? (this.getPartnerInfo(this.referralCode)?.name || '') : '',
        referralCommission: (this.referralCode && this.validateReferralCode(this.referralCode)) ? this.calculateCommission(this.cartTotal(), this.referralCode) : 0,
        telegramNotification: 'VDT_SECRET_2025_ANHIEN'
      };

      try {
        // Gửi đơn hàng đến API (tự động phát hiện môi trường)
        const apiUrl = this.getApiUrl('/api/order/create');
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderDetails)
        });

        const result = await res.json();

        if (!result.success) {
          throw new Error(result.error || 'Không thể tạo đơn hàng');
        }

        console.log('✅ Đơn hàng đã được lưu:', result);

        // Clear giỏ hàng ngay khi đặt hàng thành công
        this.cart = [];
        this.resetDiscount();

        // Đóng tất cả các modal khác và chỉ hiển thị modal thành công
        this.$nextTick(() => {
          this.closeAllModals();
          this.isSuccessModalOpen = true;
        });

      } catch (e) {
        console.error('Lỗi gửi đơn hàng:', e);
        this.showAlert(`Lỗi gửi đơn hàng: ${e.message}`, 'error');
      } finally {
        this.isSubmitting = false;
      }
    },


    // Hàm đóng success modal và reset state
    closeSuccessModal() {

      // Đóng Success Modal trước
      this.isSuccessModalOpen = false;

      // Sử dụng $nextTick để đảm bảo DOM được cập nhật
      this.$nextTick(() => {
        // Đóng tất cả modal liên quan đến shopping flow
        this.isConfirmModalOpen = false;
        this.isCheckoutModalOpen = false;
        this.isMiniCartOpen = false;
        this.closeQuickBuyModal(); // Reset toàn bộ Quick Buy state

      });
    },

    // Tiếp tục mua sắm
    continueShoppingAndScroll() {
      this.closeSuccessModal();
      window.scrollTo(0, 0);
    },

    cleanupAfterOrder() {
      this.cart = [];
      this.resetDiscount();
      this.view = 'products';
      window.scrollTo(0, 0);
    },


    /* ========= SOCIAL PROOF ========= */
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

    /* ========= PRODUCT DETAIL MODAL ========= */
    openProductDetail(product) {
      this.currentProductDetail = product;
      this.productDetailQuantity = 1;
      this.productDetailViewers = Math.floor(Math.random() * 5) + 1; // 1-5 người đang xem

      // --- NEW: DYNAMIC CONTENT LOGIC ---
      if (this.sharedDetails) {
        const category = product.category;
        // Use specific details if available, otherwise use the default
        this.productDetailContent = this.sharedDetails[category] || this.sharedDetails['default_vong_dau_tam'];
      } else {
        // Fallback if sharedDetails hasn't loaded
        this.productDetailContent = null;
      }
      // --- END NEW LOGIC ---

      this.isProductDetailOpen = true;
      if (product && product.id) {
        history.pushState(null, null, '#product=' + product.id);
      }
      document.body.style.overflow = 'hidden';

      // Bắt đầu timer để thay đổi số người xem
      this.startProductDetailViewersTimer();
    },
    closeProductDetail() {

      this.isProductDetailOpen = false;
      if (history.state === null) { // Chỉ xóa hash nếu nó được thêm bởi app
        history.pushState(null, null, ' ');
      }

      // Chỉ restore overflow nếu không có modal nào khác đang mở
      if (!this.isQuickBuyModalOpen && !this.isDiscountModalOpen && !this.isMiniCartOpen &&
        !this.isCheckoutModalOpen && !this.isAddonDetailModalOpen) {
        document.body.style.overflow = 'auto';
      } else {
      }

      // Dừng timer
      this.stopProductDetailViewersTimer();

      setTimeout(() => {
        this.currentProductDetail = null;
        this.productDetailQuantity = 1;
        this.productDetailSelectedAddons = []; // Reset addon được chọn
      }, 300);

    },
    addProductDetailToCart() {
      if (this.currentProductDetail) {
        // Nếu là sản phẩm bán kèm, thêm trực tiếp vào giỏ hàng và đóng modal
        if (this.isAddonProduct(this.currentProductDetail)) {
          this.addAddonToCart(this.currentProductDetail);
          this.closeProductDetail();
          this.showAlert('Đã thêm sản phẩm vào giỏ hàng!', 'success');
        } else {
          // Mở modal tùy chọn (cân nặng, size...) mà không đóng modal chi tiết
          this.handleProductClick(this.currentProductDetail);
        }
      }
    },
    buyProductDetailNow() {
      if (this.currentProductDetail) {
        // Nếu là sản phẩm bán kèm, chỉ thêm vào giỏ hàng thay vì mua ngay
        if (this.isAddonProduct(this.currentProductDetail)) {
          this.addAddonToCart(this.currentProductDetail);
          this.closeProductDetail();
          return;
        }

        // Chuyển addon từ ProductDetail sang QuickBuy
        this.quickBuySelectedAddons = [...this.productDetailSelectedAddons];

        // Không đóng ProductDetail modal, chỉ mở QuickBuy modal chồng lên
        this.buyNow(this.currentProductDetail);
      }
    },

    // Timer cho số người xem trong product detail modal
    startProductDetailViewersTimer() {
      this.stopProductDetailViewersTimer(); // Dừng timer cũ nếu có
      this.productDetailViewersTimer = setInterval(() => {
        // Thay đổi số người xem một cách tự nhiên (±1 người)
        const change = Math.floor(Math.random() * 3) - 1; // -1 đến +1
        const newViewers = this.productDetailViewers + change;
        // Giữ trong khoảng 1-5 người
        this.productDetailViewers = Math.max(1, Math.min(5, newViewers));
      }, 3000 + Math.random() * 4000); // 3-7 giây ngẫu nhiên
    },

    stopProductDetailViewersTimer() {
      if (this.productDetailViewersTimer) {
        clearInterval(this.productDetailViewersTimer);
        this.productDetailViewersTimer = null;
      }
    },

    /* ========= QUICK VIEW ========= */
    openQuickView(product) {
      // Redirect to new product detail modal
      this.openProductDetail(product);
    },
    closeQuickView() {
      this.isQuickViewOpen = false;
      if (!this.isMiniCartOpen) document.body.style.overflow = 'auto';
      setTimeout(() => { this.quickViewProduct = null; }, 300);
    },



    // Quick Buy revalidation - kiểm tra mã giảm giá khi thay đổi số lượng trong Quick Buy
    revalidateQuickBuyDiscount() {
      // Chỉ revalidate khi đang trong Quick Buy modal và có mã được áp dụng
      if (!this.isQuickBuyModalOpen || (!this.appliedDiscountCode && !this.appliedGift)) {
        return;
      }

      if (this.appliedDiscountCode) {
        const raw = this.availableDiscounts.find(d => (d.code || '').toUpperCase() === this.appliedDiscountCode);
        const promotion = this._normalizeDiscount(raw);

        if (!promotion || !promotion.active) {
          this.resetDiscount();
          this.showAlert('Mã giảm giá đã hết hạn và được gỡ bỏ.', 'info');
          return;
        }

        // Kiểm tra điều kiện với Quick Buy order value (bao gồm addon)
        const subtotalCheck = this.quickBuyOrderValue >= promotion.minOrder;
        const itemsCheck = !promotion.minItems || this.quickBuyQuantity >= promotion.minItems;

        if (!subtotalCheck || !itemsCheck) {
          const promotionTitle = promotion.title || promotion.code;
          this.resetDiscount();
          this.showAlert(`Ưu đãi "${promotionTitle}" đã được gỡ bỏ vì không còn đủ điều kiện.`, 'info');
          return;
        }

        // Cập nhật lại giá trị giảm giá theo Quick Buy order value
        if (promotion.type === 'percentage') {
          this.discountAmount = Math.floor(this.quickBuyOrderValue * promotion.value / 100);
        } else if (promotion.type === 'fixed') {
          this.discountAmount = promotion.value;
        }

        if (this.discountAmount > this.quickBuyOrderValue) {
          this.discountAmount = this.quickBuyOrderValue;
        }
      }
      // Gift không phụ thuộc vào subtotal nên giữ nguyên
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
    },

    /* ========= REFERRAL FUNCTIONS ========= */

    // Xử lý referral code từ URL
    handleReferralFromURL() {
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');

        if (refCode?.trim() && /^[A-Z0-9_-]+$/i.test(refCode)) {
          // Có referral mới từ URL
          const cleanCode = refCode.trim().toUpperCase();
          this.referralCode = cleanCode;

          const referralData = {
            code: cleanCode,
            expiry: Date.now() + SEVEN_DAYS
          };

          try {
            localStorage.setItem('referralData', JSON.stringify(referralData));
            // Clean URL
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('ref');
            window.history.replaceState({}, document.title, newUrl.toString());
          } catch (e) {
            // Silent fail
          }
        } else {
          // Không có referral trong URL, kiểm tra localStorage
          this.loadStoredReferral();
        }
      } catch (error) {
        // Silent fail
      }
    },

    // Load referral từ localStorage
    loadStoredReferral() {
      try {
        const storedData = localStorage.getItem('referralData');
        if (storedData) {
          const data = JSON.parse(storedData);
          if (data.expiry && Date.now() < data.expiry) {
            this.referralCode = data.code;
          } else {
            // Hết hạn, xóa
            this.clearReferralStorage();
          }
        }
      } catch (error) {
        this.clearReferralStorage();
      }
    },

    // Revalidate referral sau khi partners data đã được load
    revalidateReferralAfterLoad() {
      if (this.referralCode && !this.validateReferralCode(this.referralCode)) {
        this.referralCode = '';
        this.clearReferralStorage();
      }
    },

    // Validate referral code - Chỉ dùng cho UI, validation thực sự ở Worker API
    validateReferralCode(code) {
      try {
        if (!code || code.trim() === '') return false;
        // Chấp nhận mọi mã có format CTVxxxxxx
        return code.toUpperCase().startsWith('CTV') && code.length >= 6;
      } catch (error) {
        return false;
      }
    },

    // Lấy thông tin partner - Chỉ dùng cho UI, dữ liệu thực sự từ database
    getPartnerInfo(code) {
      try {
        if (!code || !this.partners || typeof this.partners !== 'object') return null;
        // Trả về thông tin từ partners object nếu có (cho UI)
        return this.partners[code.toUpperCase()] || { name: 'CTV', commission: 10 };
      } catch (error) {
        return { name: 'CTV', commission: 10 };
      }
    },

    // Tính hoa hồng
    calculateCommission(total, code) {
      try {
        const partner = this.getPartnerInfo(code);
        if (!partner) return 0;

        // Convert total to number if it's a string
        let numericTotal = total;
        if (typeof total === 'string') {
          // Remove currency formatting and convert to number
          numericTotal = parseInt(total.replace(/[^\d]/g, '')) || 0;
        }

        if (typeof numericTotal !== 'number' || numericTotal <= 0) return 0;

        const commission = Math.floor(numericTotal * partner.commission / 100);
        return commission;
      } catch (error) {
        return 0;
      }
    },

    /* ========= PARTNER MANAGEMENT ========= */

    // Thêm partner mới (dành cho admin)
    addPartner(code, name, commission) {
      if (!code || !name || !commission) {
        console.error('❌ Missing required fields for partner');
        return false;
      }

      this.partners[code.toUpperCase()] = {
        name: name,
        commission: commission,
        status: 'active'
      };

      return true;
    },

    // Vô hiệu hóa partner
    deactivatePartner(code) {
      if (this.partners[code.toUpperCase()]) {
        this.partners[code.toUpperCase()].status = 'inactive';
        return true;
      }
      return false;
    },

    // Kích hoạt lại partner
    activatePartner(code) {
      if (this.partners[code.toUpperCase()]) {
        this.partners[code.toUpperCase()].status = 'active';
        return true;
      }
      return false;
    },

    /* ========= DEBUG FUNCTIONS ========= */

    // Quick referral status check
    showReferralStatus() {

      // Hiển thị thông tin thời hạn từ referralData
      try {
        const referralData = localStorage.getItem('referralData');
        if (referralData) {
          const data = JSON.parse(referralData);
          const now = Date.now();
          const timeRemaining = data.expiry - now;
          const daysRemaining = Math.round(timeRemaining / (1000 * 60 * 60 * 24) * 10) / 10;

        } else {
        }
      } catch (error) {
        console.error('❌ Error reading referralData:', error);
      }

      if (this.referralCode && this.validateReferralCode(this.referralCode)) {
        const partner = this.getPartnerInfo(this.referralCode);
      }
    },

    // Manual set referral for testing
    setTestReferral(code) {

      if (this.validateReferralCode(code)) {
        this.referralCode = code;

        // Lưu với cấu trúc mới (7 ngày)
        const referralData = {
          code: code,
          timestamp: Date.now(),
          expiry: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 ngày
        };

        try {
          localStorage.setItem('referralData', JSON.stringify(referralData));
          localStorage.setItem('referralCode', code); // Tương thích
        } catch (error) {
          console.error('❌ Error saving referral data:', error);
        }

        const partner = this.getPartnerInfo(code);
      } else {
      }
    },

    // Test URL parsing manually
    testUrlParsing() {

      const urlParams = new URLSearchParams(window.location.search);
    },

    /* ========= BABY NAME MODAL FUNCTIONS ========= */

    // Kiểm tra xem sản phẩm có cần khắc tên không
    requiresBabyName(product) {
      if (!product || !product.name) return false;
      return this.babyNameRequiredProducts.some(requiredName =>
        product.name.toLowerCase().includes(requiredName.toLowerCase()) ||
        requiredName.toLowerCase().includes(product.name.toLowerCase())
      );
    },

    // Mở modal nhập tên bé
    openBabyNameModal(product) {
      this.babyNameProductInfo = {
        id: product.id,
        name: product.name,
        price: product.price
      };
      this.pendingBabyNameProduct = product;
      this.babyNameInput = '';
      this.babyNameError = '';
      this.isBabyNameModalOpen = true;
    },

    // Đóng modal nhập tên bé
    closeBabyNameModal() {
      this.isBabyNameModalOpen = false;
      this.babyNameInput = '';
      this.babyNameError = '';
      this.babyNameProductInfo = {};
      this.pendingBabyNameProduct = null;
    },

    // Validate tên bé
    validateBabyName() {
      this.babyNameError = '';
      const name = this.babyNameInput.trim();

      if (!name) {
        this.babyNameError = 'Vui lòng nhập tên bé cần khắc';
        return false;
      }

      if (name.length < 2) {
        this.babyNameError = 'Tên bé phải có ít nhất 2 ký tự';
        return false;
      }

      if (name.length > 50) {
        this.babyNameError = 'Tên bé không được quá 50 ký tự';
        return false;
      }

      // Kiểm tra ký tự đặc biệt không hợp lệ
      const invalidChars = /[<>{}[\]\\\/]/;
      if (invalidChars.test(name)) {
        this.babyNameError = 'Tên bé không được chứa ký tự đặc biệt như < > { } [ ] \\ /';
        return false;
      }

      return true;
    },

    // Xác nhận và thêm sản phẩm với tên bé vào giỏ hàng
    confirmBabyName() {
      if (!this.validateBabyName()) {
        return;
      }

      if (!this.pendingBabyNameProduct) {
        this.showAlert('Có lỗi xảy ra, vui lòng thử lại', 'error');
        return;
      }

      const product = this.pendingBabyNameProduct;
      const babyName = this.babyNameInput.trim();

      // Tạo sản phẩm với thông tin tên bé
      const productWithBabyName = {
        ...product,
        babyName: babyName,
        notes: `Khắc tên: ${babyName}`, // Gán tên bé vào notes để hiển thị trong giỏ hàng
        weight: 'N/A', // Sản phẩm khắc tên không cần cân nặng
        selectedWeight: 'N/A',
        cartId: `${product.id}-${Date.now()}`,
        quantity: 1,
        basePrice: product.price,
        finalPrice: product.price,
        displayName: `${product.name} - Khắc tên: ${babyName}`
      };

      // Thêm vào giỏ hàng
      this.addToCart(productWithBabyName);

      // Đóng modal và hiển thị thông báo
      this.closeBabyNameModal();
      this.showAlert(`Đã thêm ${product.name} với tên "${babyName}" vào giỏ hàng!`, 'success');

      // Đóng modal chi tiết sản phẩm nếu đang mở
      if (this.isProductDetailOpen) {
        this.closeProductDetail();
      }
    }
  }));
});

