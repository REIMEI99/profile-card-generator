// script.js

// === 新增：LocalStorage 状态管理 ===
let saveTimer;

/**
 * 防抖函数，延迟执行保存操作以提高性能
 */
function debounceSaveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 500); // 500ms延迟
}

/**
 * 将当前页面的所有状态收集并保存到localStorage (不含图片)
 */
function saveState() {
    const cardsData = [];
    document.querySelectorAll('.card-control').forEach(control => {
        const cardId = control.dataset.cardId;
        const cardPreview = document.querySelector(`.card[data-card-id="${cardId}"]`);
        if (!cardPreview) return;

        const type = singleColumnCardsContainer.contains(cardPreview) ? 'single' : 'dual';
        
        cardsData.push({
            id: cardId,
            type: type,
            title: control.querySelector('.card-title-input').value,
            content: control.querySelector('.card-content-input').value,
            color: control.querySelector('.card-color-picker').value,
            textColor: control.querySelector('.card-text-color-picker').value,
            opacity: control.querySelector('.card-opacity-slider').value,
        });
    });

    const state = {
        personalInfo: {
            nickname: nicknameInput.value,
            bio: bioInput.value,
            // 不保存头像和背景图
            backgroundOption: document.querySelector('input[name="bg-option"]:checked').value,
            overlayColor: bgOverlayColorInput.value,
            overlayOpacity: bgOverlayOpacityInput.value,
            headerColor: bgColorPicker.value,
            headerOpacity: bgOpacitySlider.value,
            headerTextColor: headerTextColorPicker.value,
            pageBgColor: pageBgColorPicker.value,
        },
        cards: cardsData,
        globalCardStyles: {
            color: globalCardColorInput.value,
            textColor: globalCardTextColorInput.value,
            opacity: globalCardOpacityInput.value,
        },
        cardIdCounter: cardIdCounter,
    };

    localStorage.setItem('selfIntroGeneratorState', JSON.stringify(state));
    console.log('文本状态已保存到 localStorage。');
}

/**
 * 从localStorage加载并恢复页面状态 (不含图片)
 */
function loadState() {
    const savedStateJSON = localStorage.getItem('selfIntroGeneratorState');
    if (!savedStateJSON) {
        console.log('未找到已保存的状态。');
        return;
    }

    const state = JSON.parse(savedStateJSON);
    
    // 恢复个人信息 (文本和颜色)
    nicknameInput.value = state.personalInfo.nickname;
    bioInput.value = state.personalInfo.bio;
    pageBgColorPicker.value = state.personalInfo.pageBgColor || '#ffffff';
    previewArea.style.backgroundColor = state.personalInfo.pageBgColor;

    document.querySelector(`input[name="bg-option"][value="${state.personalInfo.backgroundOption}"]`).checked = true;
    bgOverlayColorInput.value = state.personalInfo.overlayColor;
    bgOverlayOpacityInput.value = state.personalInfo.overlayOpacity;
    bgColorPicker.value = state.personalInfo.headerColor;
    bgOpacitySlider.value = state.personalInfo.headerOpacity;
    headerTextColorPicker.value = state.personalInfo.headerTextColor;
    
    // 恢复全局卡片样式
    globalCardColorInput.value = state.globalCardStyles.color;
    globalCardColor = state.globalCardStyles.color;
    globalCardTextColorInput.value = state.globalCardStyles.textColor;
    globalCardTextColor = state.globalCardStyles.textColor;
    globalCardOpacityInput.value = state.globalCardStyles.opacity;
    globalCardOpacity = state.globalCardStyles.opacity;

    // 恢复卡片ID计数器
    cardIdCounter = state.cardIdCounter || 0;

    // 清空现有卡片
    cardControlsContainer.innerHTML = '';
    singleColumnCardsContainer.innerHTML = '';
    dualColumnCardsContainer.innerHTML = '';

    // 重新创建卡片
    if (state.cards && state.cards.length > 0) {
        state.cards.forEach(cardData => {
            addCard(cardData.type, cardData);
        });
    }

    console.log('状态已从 localStorage 加载。');
}


// === 1. 获取所有需要的DOM元素 ===
// 控制面板元素
const nicknameInput = document.getElementById('nickname-input');
const bioInput = document.getElementById('bio-input');
const avatarUpload = document.getElementById('avatar-upload');
const bgUpload = document.getElementById('bg-upload');
const bgOverlayColorInput = document.getElementById('bg-overlay-color');
const bgOverlayOpacityInput = document.getElementById('bg-overlay-opacity');
const bgColorPicker = document.getElementById('bg-color-picker');
const bgOpacitySlider = document.getElementById('bg-opacity-slider');
const headerTextColorPicker = document.getElementById('header-text-color-picker'); // 新增
const pageBgColorPicker = document.getElementById('page-bg-color-picker');
const addSingleCardBtn = document.getElementById('add-single-card-btn');
const addDualCardBtn = document.getElementById('add-dual-card-btn');
const cardControlsContainer = document.getElementById('card-controls-container');
const exportBtn = document.getElementById('export-btn');
const globalCardColorInput = document.getElementById('global-card-color');
const globalCardTextColorInput = document.getElementById('global-card-text-color'); // 新增
const globalCardOpacityInput = document.getElementById('global-card-opacity');

// 预览区域元素
const previewArea = document.getElementById('preview-area');
const profileHeader = document.getElementById('profile-header');
const avatarPreview = document.getElementById('avatar-preview');
const nicknamePreview = document.getElementById('nickname-preview');
const bioPreview = document.getElementById('bio-preview');
const singleColumnCardsContainer = document.getElementById('single-column-cards-container');
const dualColumnCardsContainer = document.getElementById('dual-column-cards-container');

// 新增：Cropper.js 相关的DOM元素
const cropperModal = document.getElementById('cropper-modal');
const imageToCrop = document.getElementById('image-to-crop');
const confirmCropBtn = document.getElementById('confirm-crop-btn');
const cancelCropBtn = document.getElementById('cancel-crop-btn');
let cropper = null; // 用于存储cropper实例
let currentUploadType = null; // 'avatar' 或 'background'
let globalCardColor = '#ffffff'; // 全局卡片颜色
let globalCardTextColor = '#000000'; // 新增：全局卡片文字颜色
let globalCardOpacity = 0.9; // 全局卡片不透明度


// === 2. 核心功能函数 ===

/**
 * 将十六进制颜色和alpha值转换为rgba字符串
 * @param {string} hex - #开头的十六进制颜色
 * @param {number} alpha - 0到1之间的不透明度
 * @returns {string} - rgba(r, g, b, a)格式的颜色字符串
 */
function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(255, 255, 255, ${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * JS实现的瀑布流布局函数
 */
function recalculateCardLayout() {
    if (!dualColumnCardsContainer) return;
    const gap = 10;
    const containerWidth = dualColumnCardsContainer.clientWidth;
    if (containerWidth === 0) return; // 如果容器不可见或没有宽度，则不计算
    const cardWidth = (containerWidth - gap) / 2;
    
    let columnHeights = [0, 0];
    const cards = dualColumnCardsContainer.querySelectorAll('.card');

    cards.forEach(card => {
        card.style.width = `${cardWidth}px`;
        const cardHeight = card.offsetHeight;
        const minHeightColumn = columnHeights[0] <= columnHeights[1] ? 0 : 1;
        
        card.style.left = `${minHeightColumn * (cardWidth + gap)}px`;
        card.style.top = `${columnHeights[minHeightColumn]}px`;
        
        columnHeights[minHeightColumn] += cardHeight + gap;
    });

    dualColumnCardsContainer.style.height = `${Math.max(...columnHeights)}px`;
}

/**
 * 更新两个卡片区域之间的间距
 */
function updateContainerMargins() {
    const singleHasCards = singleColumnCardsContainer.children.length > 0;
    const dualHasCards = dualColumnCardsContainer.children.length > 0;

    // 如果单列区有卡片，给它一个上边距以和头部区域分开
    singleColumnCardsContainer.style.marginTop = singleHasCards ? '15px' : '0';

    // 如果双列区有卡片，且单列区是空的，才给双列区一个上边距
    if (dualHasCards && !singleHasCards) {
        dualColumnCardsContainer.style.marginTop = '15px';
    } else {
        // 其他情况（双列区没卡片，或单列区有卡片），都无需上边距
        dualColumnCardsContainer.style.marginTop = '0';
    }
}

/**
 * 更新页面背景图的显示样式
 */
function updateBackgroundStyle() {
    const bgOption = document.querySelector('input[name="bg-option"]:checked').value;
    
    switch (bgOption) {
        case 'stretch':
            previewArea.style.backgroundSize = '100% 100%';
            previewArea.style.backgroundRepeat = 'no-repeat';
            break;
        case 'tile':
            previewArea.style.backgroundSize = 'auto';
            previewArea.style.backgroundRepeat = 'repeat';
            previewArea.style.backgroundPosition = 'top left';
            break;
        case 'cover':
        default:
            previewArea.style.backgroundSize = 'cover';
            previewArea.style.backgroundRepeat = 'no-repeat';
            previewArea.style.backgroundPosition = 'center';
            break;
    }
}

/**
 * 更新背景图的颜色蒙版
 */
function updateBackgroundOverlay() {
    const color = bgOverlayColorInput.value;
    const opacity = bgOverlayOpacityInput.value;
    const rgbaColor = hexToRgba(color, opacity);
    previewArea.style.setProperty('--overlay-color', rgbaColor);
}


/**
 * 根据十六进制颜色计算对比色（黑色或白色）
 * @param {string} hexColor - #开头的十六进制颜色
 * @returns {string} - '#000000' 或 '#FFFFFF'
 */
// 函数 getContrastingTextColor 已被移除

/**
 * 更新个人信息区域外观
 */
function updateProfileHeaderAppearance() {
    const color = bgColorPicker.value;
    const opacity = bgOpacitySlider.value;
    profileHeader.style.backgroundColor = hexToRgba(color, opacity);
    updateProfileTextColor(); // 直接调用，不再传递颜色
}

/**
 * 更新个人信息区域的文字颜色
 */
function updateProfileTextColor() {
    const color = headerTextColorPicker.value; // 从新的选择器读取颜色
    nicknamePreview.style.color = color;
    bioPreview.style.color = color;
    // 使用背景图时，不再需要文字阴影，因为有蒙版
    nicknamePreview.style.textShadow = 'none';
    bioPreview.style.textShadow = 'none';
}

/**
 * 初始化或销毁Cropper.js
 * @param {string|null} imageSrc - 图片的Data URL。传null则销毁。
 * @param {object} options - Cropper.js的配置项
 */
function setupCropper(imageSrc, options = {}) {
    if (imageSrc) {
        imageToCrop.src = imageSrc;
        cropperModal.classList.add('visible');
        
        const defaultOptions = {
            aspectRatio: 1 / 1,
            viewMode: 1,
            dragMode: 'move',
            background: false,
            autoCropArea: 0.8,
        };

        cropper = new Cropper(imageToCrop, { ...defaultOptions, ...options });
    } else if (cropper) {
        cropper.destroy();
        cropper = null;
        imageToCrop.src = '';
        cropperModal.classList.remove('visible');
    }
}

// === 3. 绑定个人信息区的事件监听 ===

// 实时更新昵称和简介
nicknameInput.addEventListener('input', () => {
    nicknamePreview.textContent = nicknameInput.value || '你的昵称';
    debounceSaveState();
});
bioInput.addEventListener('input', () => {
    bioPreview.textContent = bioInput.value || '一句话介绍自己';
    debounceSaveState();
});

// 处理文件上传
function handleImageUpload(event, uploadType) {
    const file = event.target.files[0];
    if (!file) return;

    currentUploadType = uploadType;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (uploadType === 'avatar') {
            // 只有头像需要裁剪
            setupCropper(e.target.result, { aspectRatio: 1 / 1 });
        } else if (uploadType === 'background') {
            // 背景图直接应用，不裁剪
            previewArea.style.backgroundImage = `url(${e.target.result})`;
            previewArea.classList.add('has-bg-image');
            updateProfileTextColor(); // 不再强制白色文字，而是使用选择器的值
            updateBackgroundStyle(); // 应用当前的显示方式
            updateBackgroundOverlay(); // 应用当前的蒙版样式
        }
    };
    reader.readAsDataURL(file);
    // 清空input的值，确保下次选择同一文件也能触发change事件
    event.target.value = ''; 
}

// 应用头像和背景图上传
avatarUpload.addEventListener('change', (e) => handleImageUpload(e, 'avatar'));
bgUpload.addEventListener('change', (e) => handleImageUpload(e, 'background'));


// 顶部背景颜色选择
bgColorPicker.addEventListener('input', () => {
    updateProfileHeaderAppearance();
    debounceSaveState();
});
bgOpacitySlider.addEventListener('input', () => {
    updateProfileHeaderAppearance();
    debounceSaveState();
});
headerTextColorPicker.addEventListener('input', () => {
    updateProfileTextColor();
    debounceSaveState();
});

// 新增：页面背景颜色选择
pageBgColorPicker.addEventListener('input', () => {
    previewArea.style.backgroundColor = pageBgColorPicker.value;
    previewArea.style.backgroundImage = 'none'; // 清除背景图
    previewArea.classList.remove('has-bg-image');
    debounceSaveState();
});

// 新增：监听背景图显示方式变化
document.querySelectorAll('input[name="bg-option"]').forEach(radio => {
    radio.addEventListener('change', () => {
        updateBackgroundStyle();
        saveState();
    });
});

// 新增：监听蒙版控件变化
bgOverlayColorInput.addEventListener('input', () => {
    updateBackgroundOverlay();
    debounceSaveState();
});
bgOverlayOpacityInput.addEventListener('input', () => {
    updateBackgroundOverlay();
    debounceSaveState();
});

// 新增：全局卡片样式控制器
globalCardColorInput.addEventListener('input', (e) => {
    globalCardColor = e.target.value;
    document.querySelectorAll('.card-control .card-color-picker').forEach(picker => {
        picker.value = globalCardColor;
        picker.dispatchEvent(new Event('input', { bubbles: true }));
    });
    debounceSaveState();
});
// 新增：全局卡片文字颜色控制器
globalCardTextColorInput.addEventListener('input', (e) => {
    globalCardTextColor = e.target.value;
    document.querySelectorAll('.card-control .card-text-color-picker').forEach(picker => {
        picker.value = globalCardTextColor;
        picker.dispatchEvent(new Event('input', { bubbles: true }));
    });
    debounceSaveState();
});
globalCardOpacityInput.addEventListener('input', (e) => {
    globalCardOpacity = e.target.value;
    document.querySelectorAll('.card-control .card-opacity-slider').forEach(slider => {
        slider.value = globalCardOpacity;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    debounceSaveState();
});


// === 4. Cropper.js 模态框事件监听 ===
confirmCropBtn.addEventListener('click', () => {
    if (!cropper) return;
    
    // 裁剪功能现在只处理头像
    const canvas = cropper.getCroppedCanvas({
        width: 200,
        height: 200,
        imageSmoothingQuality: 'high',
    });

    const croppedImageDataURL = canvas.toDataURL('image/png');
    
    avatarPreview.src = croppedImageDataURL;
    
    setupCropper(null); // 关闭并销毁cropper
});

cancelCropBtn.addEventListener('click', () => {
    setupCropper(null); // 关闭并销毁cropper
});


// === 5. 卡片系统的逻辑 ===

let cardIdCounter = 0;

/**
 * 通用的添加卡片函数
 * @param {string} type - 'single' 或 'dual'
 * @param {object|null} cardData - 用于从localStorage恢复卡片的数据
 */
function addCard(type, cardData = null) {
    const isNewCard = cardData === null;
    const cardId = isNewCard ? ++cardIdCounter : parseInt(cardData.id);
    if (isNewCard) {
      cardIdCounter = Math.max(cardIdCounter, cardId);
    }


    // --- A. 在控制面板创建新的卡片编辑器 ---
    const controlDiv = document.createElement('div');
    controlDiv.className = 'card-control';
    controlDiv.dataset.cardId = cardId;
    controlDiv.innerHTML = `
        <button class="delete-card-btn" title="删除此卡片">❌</button>
        <h4>${type === 'single' ? '单列' : '双列'}卡片 #${cardId}</h4>
        <label>标题:</label>
        <input type="text" class="card-title-input" placeholder="卡片标题">
        <label>内容:</label>
        <textarea class="card-content-input" placeholder="卡片内容..."></textarea>
        <label>背景色:</label>
        <input type="color" class="card-color-picker" value="${isNewCard ? globalCardColor : cardData.color}">
        <label>文字颜色:</label>
        <input type="color" class="card-text-color-picker" value="${isNewCard ? globalCardTextColor : cardData.textColor}">
        <label>不透明度:</label>
        <input type="range" class="card-opacity-slider" min="0.1" max="1" step="0.05" value="${isNewCard ? globalCardOpacity : cardData.opacity}">
    `;
    cardControlsContainer.appendChild(controlDiv);

    // --- B. 在预览区创建新的卡片 ---
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = cardId;
    cardDiv.innerHTML = `
        <h3 class="card-title">${isNewCard ? '卡片标题' : (cardData.title || '卡片标题')}</h3>
        <p class="card-content">${isNewCard ? '卡片内容...' : (cardData.content || '卡片内容...')}</p>
    `;

    // 根据类型将卡片添加到对应的容器
    const targetContainer = type === 'single' ? singleColumnCardsContainer : dualColumnCardsContainer;
    targetContainer.appendChild(cardDiv);

    // --- C. 将控制器和预览卡片关联起来 ---
    const titleInput = controlDiv.querySelector('.card-title-input');
    const contentInput = controlDiv.querySelector('.card-content-input');
    const colorPicker = controlDiv.querySelector('.card-color-picker');
    const textColorPicker = controlDiv.querySelector('.card-text-color-picker'); // 新增
    const opacitySlider = controlDiv.querySelector('.card-opacity-slider');
    const deleteBtn = controlDiv.querySelector('.delete-card-btn');
    
    const previewTitle = cardDiv.querySelector('.card-title');
    const previewContent = cardDiv.querySelector('.card-content');

    // 填充来自localStorage的数据（如果存在）
    if (!isNewCard) {
        titleInput.value = cardData.title;
        contentInput.value = cardData.content;
    }

    // 统一更新卡片背景和文字颜色的函数
    function updateCardAppearance() {
        const hexColor = colorPicker.value;
        const opacity = opacitySlider.value;
        const textColor = textColorPicker.value; // 新增：获取文字颜色
        
        cardDiv.style.backgroundColor = hexToRgba(hexColor, opacity);

        // 不再自动计算文字颜色，直接使用选择器的值
        previewTitle.style.color = textColor;
        previewContent.style.color = textColor;

        // 移除所有关于边框的判断和修改
    }

    // 绑定事件
    titleInput.addEventListener('input', () => {
        previewTitle.textContent = titleInput.value || '卡片标题';
        if (type === 'dual') recalculateCardLayout();
        debounceSaveState();
    });
    contentInput.addEventListener('input', () => {
        previewContent.textContent = contentInput.value || '卡片内容...';
        if (type === 'dual') recalculateCardLayout();
        debounceSaveState();
    });
    colorPicker.addEventListener('input', () => {
        updateCardAppearance();
        debounceSaveState();
    });
    textColorPicker.addEventListener('input', () => {
        updateCardAppearance();
        debounceSaveState();
    });
    opacitySlider.addEventListener('input', () => {
        updateCardAppearance();
        debounceSaveState();
    });

    deleteBtn.addEventListener('click', () => {
        controlDiv.style.transition = 'opacity 0.3s ease';
        if (type === 'single') {
            cardDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease, height 0.3s ease';
        } else {
            cardDiv.style.transition = 'opacity 0.3s ease';
        }
        controlDiv.style.opacity = '0';
        cardDiv.style.opacity = '0';
        
        setTimeout(() => {
            controlDiv.remove();
            cardDiv.remove();
            if (type === 'dual') {
                recalculateCardLayout();
            }
            updateContainerMargins();
            saveState(); // 删除后立即保存
        }, 300);
    });

    if (type === 'dual') {
        recalculateCardLayout();
    }
    updateContainerMargins();
    updateCardAppearance(); // 初始化卡片外观

    if (isNewCard) {
        saveState(); // 添加新卡片后立即保存
    }
}

addSingleCardBtn.addEventListener('click', () => addCard('single'));
addDualCardBtn.addEventListener('click', () => addCard('dual'));


// === 6. 优化的导出功能 ===
exportBtn.addEventListener('click', async () => {
    // 显示加载状态
    exportBtn.textContent = '正在生成图片...';
    exportBtn.disabled = true;

    // 保存预览区的原始样式，以便后续恢复
    const originalWidth = previewArea.style.width;
    const originalMaxWidth = previewArea.style.maxWidth;
    
    try {
        // 添加导出模式样式
        previewArea.classList.add('export-mode');

        // --- 核心修改：为确保导出质量，临时强制设置宽度为600px ---
        previewArea.style.width = '600px';
        previewArea.style.maxWidth = '600px';
        recalculateCardLayout(); // 根据新宽度重新计算瀑布流布局
        
        // 等待DOM更新
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 使用优化的html2canvas配置
        const canvas = await html2canvas(previewArea, {
            scale: 2, // 调整导出分辨率为2倍
            useCORS: true,
            allowTaint: true,
            backgroundColor: null, // 设置背景为透明以防止白边
            logging: false,
        });
        
        // 创建高质量图片
        const link = document.createElement('a');
        link.download = `自我介绍_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png', 1.0); // 最高质量
        link.click();
        
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败，请重试');
    } finally {
        // --- 恢复现场 ---
        // 恢复预览区的原始样式
        previewArea.style.width = originalWidth;
        previewArea.style.maxWidth = originalMaxWidth;

        // 移除导出模式样式
        previewArea.classList.remove('export-mode');

        // 再次重排布局以适应屏幕
        recalculateCardLayout(); 

        // 恢复按钮状态
        exportBtn.textContent = '导出为图片';
        exportBtn.disabled = false;
    }
});

// 监听窗口大小变化，重新计算布局（使用debounce优化性能）
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        recalculateCardLayout();
        updateContainerMargins(); // 窗口大小变化时也更新间距
    }, 150);
});

// 首次加载时计算一次布局
window.addEventListener('load', () => {
    loadState(); // <<<<<<< 新增：页面加载时尝试恢复状态
    recalculateCardLayout();
    updateContainerMargins();
    // 初始化顶部区域外观
    updateProfileHeaderAppearance();
    // 初始化蒙版
    updateBackgroundOverlay();
    // 应用加载的背景显示样式
    updateBackgroundStyle();
});