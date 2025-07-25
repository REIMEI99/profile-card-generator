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
 * 将当前页面的所有状态收集并返回为一个对象 (不含图片)
 * @returns {object} state - 包含所有配置的状态对象
 */
function getCurrentState() {
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
            // backgroundImage: cardPreview.style.backgroundImage, // 移除：不再导出卡片背景图信息
            bgOption: control.querySelector(`input[name="card-bg-option-${cardId}"]:checked`)?.value || 'cover',
            textAlign: control.querySelector(`input[name="card-align-option-${cardId}"]:checked`)?.value || 'default',
            overlayColor: control.querySelector('.card-overlay-color-picker').value,
            overlayOpacity: control.querySelector('.card-overlay-opacity-slider').value,
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
            shadow: document.getElementById('global-card-shadow-toggle').checked,
            textAlign: document.querySelector('input[name="global-card-align"]:checked')?.value || 'left',
            lineHeight: document.querySelector('input[name="global-line-height"]:checked')?.value || '1.5',
            fontFamily: globalFontFamilySelect.value || 'sans',
        },
        cardIdCounter: cardIdCounter,
    };

    return state;
}

/**
 * 将当前页面的所有状态收集并保存到localStorage (不含图片)
 */
function saveState() {
    const state = getCurrentState();
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
    applyState(state);
    console.log('状态已从 localStorage 加载。');
}

/**
 * 新增：根据传入的状态对象，恢复页面
 * @param {object} state - 状态对象
 */
function applyState(state) {
    if (!state) {
        alert('配置数据无效！');
        return;
    }

    try {
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
        document.getElementById('global-card-shadow-toggle').checked = state.globalCardStyles.shadow;
        const globalAlign = state.globalCardStyles.textAlign || 'left';
        document.querySelector(`input[name="global-card-align"][value="${globalAlign}"]`).checked = true;
        const globalLineHeight = state.globalCardStyles.lineHeight || '1.5';
        document.querySelector(`input[name="global-line-height"][value="${globalLineHeight}"]`).checked = true;
        const globalFontFamily = state.globalCardStyles.fontFamily || 'sans';
        globalFontFamilySelect.value = globalFontFamily;


        // 恢复卡片ID计数器
        cardIdCounter = state.cardIdCounter || 0;

        // 清空现有卡片
        document.getElementById('single-card-controls-container').innerHTML = '';
        document.getElementById('dual-card-controls-container').innerHTML = '';
        singleColumnCardsContainer.innerHTML = '';
        dualColumnCardsContainer.innerHTML = '';

        // 重新创建卡片
        if (state.cards && state.cards.length > 0) {
            state.cards.forEach(cardData => {
                addCard(cardData.type, cardData);
            });
        }

        // --- 新增：强制更新预览区域，确保加载的数据能立即显示 ---
        nicknamePreview.textContent = nicknameInput.value;
        bioPreview.textContent = bioInput.value;
        updateProfileHeaderAppearance();
        updateBackgroundOverlay();
        updateBackgroundStyle();
        updateAllCardsAlignment(); // 新增：应用加载的对齐设置
        updateAllCardsLineHeight(); // 新增：应用加载的行距设置
        updateFontFamily(); // 新增：应用加载的字体设置
        updateFontSize(); // 新增：应用加载的字体大小
        // 触发阴影更新
        globalCardShadowToggle.dispatchEvent(new Event('change'));

        // 最后重排一次布局
        recalculateCardLayout();

        console.log('状态已成功应用。');

    } catch (error) {
        console.error("应用状态失败:", error);
        alert('导入配置失败，文件格式可能不正确。');
    }
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
const singleCardControlsContainer = document.getElementById('single-card-controls-container');
const dualCardControlsContainer = document.getElementById('dual-card-controls-container');
const exportBtn = document.getElementById('export-btn');
const importConfigBtn = document.getElementById('import-config-btn');
const exportConfigBtn = document.getElementById('export-config-btn');
const configFilePicker = document.getElementById('config-file-input');
const globalCardColorInput = document.getElementById('global-card-color');
const globalCardTextColorInput = document.getElementById('global-card-text-color'); // 新增
const globalCardOpacityInput = document.getElementById('global-card-opacity');
const globalCardShadowToggle = document.getElementById('global-card-shadow-toggle');
const globalCardAlignRadios = document.querySelectorAll('input[name="global-card-align"]'); // 新增
const globalCardLineHeightRadios = document.querySelectorAll('input[name="global-line-height"]'); // 新增
const globalFontFamilySelect = document.getElementById('global-font-family-select'); // 修改：从单选改为下拉框
const globalFontSizeSelect = document.getElementById('global-font-size-select');

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

// 新增：下载模态框相关的DOM元素
const downloadModal = document.getElementById('download-modal');
const downloadModalTitle = document.getElementById('download-modal-title');
const downloadModalContent = document.getElementById('download-modal-content');
const downloadModalCloseBtn = document.getElementById('download-modal-close-btn');
let currentObjectUrl = null; // 用于跟踪需要释放的URL对象

// 新增：实验性手机模式开关
const mobileModeToggle = document.getElementById('mobile-mode-toggle');

// 新增：实验性高清导出模式开关
const hdExportToggle = document.getElementById('hd-export-toggle');

// 手机模式切换逻辑
if (mobileModeToggle) {
    mobileModeToggle.addEventListener('change', () => {
        if (mobileModeToggle.checked) {
            previewArea.classList.add('mobile-mode');
        } else {
            previewArea.classList.remove('mobile-mode');
        }
        // 手机模式切换后需要重排卡片布局
        if (dualColumnCardsContainer.children.length > 0) {
            recalculateCardLayout();
        }
    });
}


// === 2. 核心功能函数 ===

/**
 * 新增：显示下载模态框
 * @param {string} url - 下载链接 (可以是data URL或blob URL)
 * @param {string} filename - 默认文件名
 * @param {string} title - 模态框标题
 */
function showDownloadModal(url, filename, title) {
    // 释放上一个URL，防止内存泄漏
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
    }
    // 只保存blob URL用于后续释放
    currentObjectUrl = url.startsWith('blob:') ? url : null;

    downloadModalTitle.textContent = title;
    downloadModalContent.innerHTML = ''; // 清空旧链接

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.textContent = `点击下载: ${filename}`;
    
    // 如果是图片，额外提供一个预览
    if (url.startsWith('data:image')) {
        const imgPreview = document.createElement('img');
        imgPreview.src = url;
        imgPreview.style.maxWidth = '100%';
        imgPreview.style.maxHeight = '50vh'; // 新增：限制图片预览的最大高度
        imgPreview.style.marginBottom = '15px';
        imgPreview.style.borderRadius = '8px';
        downloadModalContent.appendChild(imgPreview);
    }

    downloadModalContent.appendChild(downloadLink);
    downloadModal.classList.add('visible');
}

/**
 * 新增：隐藏下载模态框并清理资源
 */
function hideDownloadModal() {
    downloadModal.classList.remove('visible');
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
    }
}

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
 * 新增：更新指定卡片的文字对齐方式
 * @param {string} cardId - 卡片的ID
 */
function updateCardAlignment(cardId) {
    const cardDiv = document.querySelector(`.card[data-card-id="${cardId}"]`);
    const controlDiv = document.querySelector(`.card-control[data-card-id="${cardId}"]`);
    if (!cardDiv || !controlDiv) return;

    const globalAlign = document.querySelector('input[name="global-card-align"]:checked')?.value || 'left';
    const cardAlign = controlDiv.querySelector(`input[name="card-align-option-${cardId}"]:checked`)?.value || 'default';

    let finalAlign = cardAlign === 'default' ? globalAlign : cardAlign;

    cardDiv.classList.remove('align-left', 'align-center');
    if (finalAlign === 'left') {
        cardDiv.classList.add('align-left');
    } else if (finalAlign === 'center') {
        cardDiv.classList.add('align-center');
    }
}

/**
 * 新增：更新预览区域的字体
 */
function updateFontFamily() {
    const fontFamily = globalFontFamilySelect.value || 'sans';
    if (fontFamily === 'serif') {
        previewArea.classList.remove('font-sans');
        previewArea.classList.add('font-serif');
    } else {
        previewArea.classList.remove('font-serif');
        previewArea.classList.add('font-sans');
    }
    // 字体改变会严重影响布局，必须重算
    if (dualColumnCardsContainer.children.length > 0) {
        recalculateCardLayout();
    }
}

/**
 * 新增：更新预览区域的字体大小
 */
function updateFontSize() {
    const size = globalFontSizeSelect.value || 'small';
    previewArea.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    previewArea.classList.add('font-size-' + size);
    // 字号改变可能影响布局
    if (dualColumnCardsContainer.children.length > 0) {
        recalculateCardLayout();
    }
}

/**
 * 新增：更新所有卡片的行距
 */
function updateAllCardsLineHeight() {
    const lineHeight = document.querySelector('input[name="global-line-height"]:checked')?.value || '1.5';
    document.querySelectorAll('.card .card-content').forEach(content => {
        content.style.lineHeight = lineHeight;
    });
    // 行距的改变可能影响文字换行，从而改变双列卡片的高度，需要重排
    if (dualColumnCardsContainer.children.length > 0) {
        recalculateCardLayout();
    }
}

/**
 * 新增：更新所有卡片的对齐方式（通常在全局设置改变时调用）
 */
function updateAllCardsAlignment() {
    document.querySelectorAll('.card-control').forEach(control => {
        updateCardAlignment(control.dataset.cardId);
    });
    // 对齐方式的改变可能影响文字换行，从而改变双列卡片的高度，需要重排
    if (dualColumnCardsContainer.children.length > 0) {
        recalculateCardLayout();
    }
}

/**
 * JS实现的瀑布流布局函数
 */
function recalculateCardLayout(container = dualColumnCardsContainer) {
    if (!container) return;
    const gap = 15; // 修改：将间距从10px统一为15px
    const containerWidth = container.clientWidth;
    if (containerWidth === 0) return; // 如果容器不可见或没有宽度，则不计算
    const cardWidth = (containerWidth - gap) / 2;
    
    let columnHeights = [0, 0];
    const cards = container.querySelectorAll('.card');

    cards.forEach(card => {
        card.style.width = `${cardWidth}px`;
        const cardHeight = card.offsetHeight;
        const minHeightColumn = columnHeights[0] <= columnHeights[1] ? 0 : 1;
        
        card.style.left = `${minHeightColumn * (cardWidth + gap)}px`;
        card.style.top = `${columnHeights[minHeightColumn]}px`;
        
        columnHeights[minHeightColumn] += cardHeight + gap;
    });

    container.style.height = `${Math.max(...columnHeights)}px`;
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
 * 新增：阻止在指定元素上按回车键换行
 * @param {KeyboardEvent} e - 键盘事件
 * @param {HTMLElement|null} nextElementToFocus - （可选）回车后要聚焦的下一个元素
 */
function preventEnter(e, nextElementToFocus = null) {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (nextElementToFocus) {
            nextElementToFocus.focus();
        }
    }
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

// 实时更新昵称和简介（双向绑定）
nicknameInput.addEventListener('input', () => {
    nicknamePreview.textContent = nicknameInput.value;
    debounceSaveState();
});
nicknamePreview.addEventListener('input', () => {
    nicknameInput.value = nicknamePreview.textContent;
    debounceSaveState();
});
nicknamePreview.addEventListener('keydown', (e) => preventEnter(e, bioPreview));

bioInput.addEventListener('input', () => {
    bioPreview.textContent = bioInput.value;
    debounceSaveState();
});
bioPreview.addEventListener('input', () => {
    bioInput.value = bioPreview.textContent;
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

// 新增：全局卡片阴影开关
globalCardShadowToggle.addEventListener('change', (e) => {
    const showShadow = e.target.checked;
    document.querySelectorAll('.card').forEach(card => {
        card.classList.toggle('no-shadow', !showShadow);
    });
    debounceSaveState();
});

// 新增：全局卡片对齐控制器
globalCardAlignRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        updateAllCardsAlignment();
        debounceSaveState();
    });
});

// 新增：全局卡片行距控制器
globalCardLineHeightRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        updateAllCardsLineHeight();
        debounceSaveState();
    });
});

// 修改：全局字体控制器
globalFontFamilySelect.addEventListener('change', () => {
    updateFontFamily();
    debounceSaveState();
});

// 监听字体大小切换
if (globalFontSizeSelect) {
    globalFontSizeSelect.addEventListener('change', () => {
        updateFontSize();
        debounceSaveState && debounceSaveState();
    });
}


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
    // controlDiv.draggable = true; // 移除：不再让整个控制器都可拖拽
    controlDiv.innerHTML = `
        <span class="drag-handle" title="拖动排序" draggable="true">⠿</span> <!-- 新增：仅手柄可拖拽 -->
        <button class="delete-card-btn" title="删除此卡片">❌</button>
        <h4>${type === 'single' ? '单列' : '双列'}卡片 #${cardId}</h4>
        <label>标题:</label>
        <input type="text" class="card-title-input" placeholder="卡片标题">
        <label>内容:</label>
        <textarea class="card-content-input" placeholder="卡片内容... (可输入空行调整带图卡片的高度)"></textarea>
        
        <div class="card-alignment-control">
            <label>对齐:</label>
            <input type="radio" id="card-${cardId}-align-default" name="card-align-option-${cardId}" value="default" checked> <label for="card-${cardId}-align-default">默认</label>
            <input type="radio" id="card-${cardId}-align-left" name="card-align-option-${cardId}" value="left"> <label for="card-${cardId}-align-left">居左</label>
            <input type="radio" id="card-${cardId}-align-center" name="card-align-option-${cardId}" value="center"> <label for="card-${cardId}-align-center">居中</label>
        </div>

        <label>卡片背景图 (可选):</label>
        <div class="card-bg-control">
            <input type="file" class="card-bg-upload" accept="image/*" title="选择背景图">
            <button type="button" class="clear-card-bg-btn" title="清除背景图">清除</button>
        </div>
        <div class="card-bg-options">
            <label>显示方式:</label>
            <input type="radio" id="card-${cardId}-bg-cover" name="card-bg-option-${cardId}" value="cover" checked> <label for="card-${cardId}-bg-cover">缩放</label>
            <input type="radio" id="card-${cardId}-bg-stretch" name="card-bg-option-${cardId}" value="stretch"> <label for="card-${cardId}-bg-stretch">拉伸</label>
            <input type="radio" id="card-${cardId}-bg-tile" name="card-bg-option-${cardId}" value="tile"> <label for="card-${cardId}-bg-tile">平铺</label>
        </div>

        <!-- 新增: 卡片蒙版控制器 -->
        <div class="card-overlay-controls" style="display: none;">
            <label>图片颜色蒙版:</label>
            <div class="color-controls-row">
                <div class="color-control-group">
                    <label>蒙版颜色:</label>
                    <input type="color" class="card-overlay-color-picker" value="#ffffff">
                </div>
                <div class="color-control-group">
                    <label>不透明度:</label>
                    <input type="range" class="card-overlay-opacity-slider" min="0" max="1" step="0.05" value="0.5">
                </div>
            </div>
        </div>

        <div class="color-controls-row">
            <div class="color-control-group">
                <label>背景色:</label>
                <input type="color" class="card-color-picker" value="${isNewCard ? globalCardColor : cardData.color}">
            </div>
            <div class="color-control-group">
                <label>文字颜色:</label>
                <input type="color" class="card-text-color-picker" value="${isNewCard ? globalCardTextColor : cardData.textColor}">
            </div>
        </div>
        <label>不透明度:</label>
        <input type="range" class="card-opacity-slider" min="0.1" max="1" step="0.05" value="${isNewCard ? globalCardOpacity : cardData.opacity}">
    `;
    
    // 根据类型将控制器添加到对应的容器
    const targetControlContainer = type === 'single' ? singleCardControlsContainer : dualCardControlsContainer;
    targetControlContainer.appendChild(controlDiv);

    // --- B. 在预览区创建新的卡片 ---
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = cardId;
    cardDiv.innerHTML = `
        <h3 class="card-title" contenteditable="true" data-placeholder="卡片标题"></h3>
        <p class="card-content" contenteditable="true" data-placeholder="卡片内容..."></p>
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
    const cardBgUpload = controlDiv.querySelector('.card-bg-upload');
    const clearCardBgBtn = controlDiv.querySelector('.clear-card-bg-btn');
    const bgOptionRadios = controlDiv.querySelectorAll(`input[name="card-bg-option-${cardId}"]`);
    const alignRadios = controlDiv.querySelectorAll(`input[name="card-align-option-${cardId}"]`);
    const overlayControls = controlDiv.querySelector('.card-overlay-controls');
    const overlayColorPicker = controlDiv.querySelector('.card-overlay-color-picker');
    const overlayOpacitySlider = controlDiv.querySelector('.card-overlay-opacity-slider');
    
    const previewTitle = cardDiv.querySelector('.card-title');
    const previewContent = cardDiv.querySelector('.card-content');

    // --- 新增：卡片点击跳转功能 ---
    cardDiv.addEventListener('click', (e) => {
        // 如果点击的是可编辑的文字区域，则不触发跳转，以方便用户开始编辑
        if (e.target.isContentEditable) {
            return;
        }

        const controlToScroll = document.querySelector(`.card-control[data-card-id="${cardId}"]`);
        if (controlToScroll) {
            // 平滑滚动到视图中央
            controlToScroll.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // 添加高亮效果，并在动画结束后移除
            controlToScroll.classList.add('highlight-scroll');
            setTimeout(() => {
                controlToScroll.classList.remove('highlight-scroll');
            }, 1500); // 持续时间与CSS动画相同
        }
    });

    // 应用当前的全局行距
    const globalLineHeight = document.querySelector('input[name="global-line-height"]:checked')?.value || '1.5';
    previewContent.style.lineHeight = globalLineHeight;

    // 填充来自localStorage的数据（如果存在）
    if (!isNewCard) {
        titleInput.value = cardData.title;
        contentInput.value = cardData.content;
        previewTitle.textContent = cardData.title;
        previewContent.textContent = cardData.content;
        // 新增：恢复卡片背景
        if (cardData.backgroundImage && cardData.backgroundImage !== 'none' && cardData.backgroundImage !== '') {
            cardDiv.style.backgroundImage = cardData.backgroundImage;
            cardDiv.classList.add('card-has-bg');
            overlayControls.style.display = 'block'; // 恢复时显示蒙版控件
        }
        if (cardData.bgOption) {
            const radioToSelect = controlDiv.querySelector(`input[value="${cardData.bgOption}"]`);
            if (radioToSelect) radioToSelect.checked = true;
        }
        if (cardData.textAlign) {
            const radioToSelect = controlDiv.querySelector(`input[name="card-align-option-${cardId}"][value="${cardData.textAlign}"]`);
            if (radioToSelect) radioToSelect.checked = true;
        }
        if (cardData.overlayColor) {
            overlayColorPicker.value = cardData.overlayColor;
        }
        if (cardData.overlayOpacity) {
            overlayOpacitySlider.value = cardData.overlayOpacity;
        }
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

        // 如果有背景图，为文字添加阴影以保证可读性
        if (cardDiv.classList.contains('card-has-bg')) {
            previewTitle.style.textShadow = 'none';
            previewContent.style.textShadow = 'none';
        } else {
            previewTitle.style.textShadow = 'none';
            previewContent.style.textShadow = 'none';
        }
    }

    // 新增：更新卡片背景图的颜色蒙版
    function updateCardOverlay() {
        const color = overlayColorPicker.value;
        const opacity = overlayOpacitySlider.value;
        const rgbaColor = hexToRgba(color, opacity);
        cardDiv.style.setProperty('--card-overlay-color', rgbaColor);
    }

    // 新增：根据选项更新卡片背景图样式
    function updateCardBackgroundStyle() {
        const selectedOption = controlDiv.querySelector(`input[name="card-bg-option-${cardId}"]:checked`)?.value || 'cover';
        switch (selectedOption) {
            case 'stretch':
                cardDiv.style.backgroundSize = '100% 100%';
                cardDiv.style.backgroundRepeat = 'no-repeat';
                cardDiv.style.backgroundPosition = 'center';
                break;
            case 'tile':
                cardDiv.style.backgroundSize = 'auto';
                cardDiv.style.backgroundRepeat = 'repeat';
                cardDiv.style.backgroundPosition = 'top left';
                break;
            case 'cover':
            default:
                cardDiv.style.backgroundSize = 'cover';
                cardDiv.style.backgroundRepeat = 'no-repeat';
                cardDiv.style.backgroundPosition = 'center';
                break;
        }
    }

    // 绑定事件
    titleInput.addEventListener('input', () => {
        previewTitle.textContent = titleInput.value;
        if (type === 'dual') recalculateCardLayout();
        debounceSaveState();
    });
    contentInput.addEventListener('input', () => {
        previewContent.textContent = contentInput.value;
        if (type === 'dual') recalculateCardLayout();
        debounceSaveState();
    });

    // 预览区 -> 控制区
    previewTitle.addEventListener('input', () => {
        titleInput.value = previewTitle.textContent;
        if (type === 'dual') recalculateCardLayout();
        debounceSaveState();
    });
    previewContent.addEventListener('input', () => {
        contentInput.value = previewContent.textContent;
        if (type === 'dual') recalculateCardLayout();
        debounceSaveState();
    });

    // 阻止标题换行
    previewTitle.addEventListener('keydown', (e) => preventEnter(e, previewContent));


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

    // 新增：处理卡片背景图上传
    cardBgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            cardDiv.style.backgroundImage = `url(${event.target.result})`;
            cardDiv.classList.add('card-has-bg');
            overlayControls.style.display = 'block';
            updateCardOverlay(); // 应用默认或已有的蒙版
            updateCardAppearance(); // 更新文字阴影等
            updateCardBackgroundStyle(); // 应用当前的显示方式
            if (type === 'dual') recalculateCardLayout();
            debounceSaveState();
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // 允许重新上传相同文件
    });

    // 新增：清除卡片背景图
    clearCardBgBtn.addEventListener('click', () => {
        cardDiv.style.backgroundImage = 'none';
        cardDiv.classList.remove('card-has-bg');
        overlayControls.style.display = 'none';
        updateCardAppearance(); // 移除文字阴影
        if (type === 'dual') recalculateCardLayout();
        debounceSaveState();
    });

    // 新增：为背景显示方式单选按钮绑定事件
    bgOptionRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateCardBackgroundStyle();
            debounceSaveState();
        });
    });

    // 新增：为对齐方式单选按钮绑定事件
    alignRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateCardAlignment(cardId);
            // 对齐方式改变可能影响文字换行，从而影响双列卡片高度
            if (type === 'dual') {
                recalculateCardLayout();
            }
            debounceSaveState();
        });
    });

    overlayColorPicker.addEventListener('input', () => {
        updateCardOverlay();
        debounceSaveState();
    });
    overlayOpacitySlider.addEventListener('input', () => {
        updateCardOverlay();
        debounceSaveState();
    });

    if (type === 'dual') {
        recalculateCardLayout();
    }
    updateContainerMargins();
    updateCardAppearance(); // 初始化卡片外观
    updateCardBackgroundStyle(); // 初始化背景图样式
    updateCardAlignment(cardId); // 新增：初始化对齐方式
    updateCardOverlay(); // 新增：初始化蒙版
    // 应用全局阴影设置
    document.querySelector(`.card[data-card-id="${cardId}"]`).classList.toggle('no-shadow', !globalCardShadowToggle.checked);


    if (isNewCard) {
        saveState(); // 添加新卡片后立即保存
    }
}

addSingleCardBtn.addEventListener('click', () => addCard('single'));
addDualCardBtn.addEventListener('click', () => addCard('dual'));


// === 新增：拖拽排序功能 ===
function makeSortable(controlContainer, previewContainer, cardType) {
    let draggedItem = null;

    // 监听容器内的拖拽开始事件
    controlContainer.addEventListener('dragstart', e => {
        // 确保拖拽的是拖拽手柄
        if (e.target.classList.contains('drag-handle')) {
            draggedItem = e.target.closest('.card-control');
            // 使用一个短暂的延迟来确保拖拽的视觉效果（如透明度）能够应用
            setTimeout(() => {
                if (draggedItem) {
                    draggedItem.classList.add('dragging');
                }
            }, 0);
        }
    });

    // 拖拽结束时（无论成功与否），移除样式
    controlContainer.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    });

    // 当拖拽物进入容器范围时
    controlContainer.addEventListener('dragover', e => {
        e.preventDefault(); // 这是允许放置（drop）的必要步骤
        const afterElement = getDragAfterElement(controlContainer, e.clientY);
        const dragging = controlContainer.querySelector('.dragging');
        if (dragging) {
            if (afterElement == null) {
                controlContainer.appendChild(dragging);
            } else {
                controlContainer.insertBefore(dragging, afterElement);
            }
        }
        
        // --- 新增：边缘自动滚动逻辑 ---
        const scrollableParent = (window.innerWidth < 992) ? window : controlContainer.closest('.controls');
        if (!scrollableParent) return;

        const parentRect = (scrollableParent === window)
            ? { top: 0, bottom: window.innerHeight, height: window.innerHeight }
            : scrollableParent.getBoundingClientRect();

        const threshold = parentRect.height * 0.20; // 使用20%的容器高度作为触发区域
        const scrollSpeed = 10; // 每次事件触发时的滚动像素
        const clientY = e.clientY;

        // 如果拖拽到顶部20%的区域，向上滚动
        if (clientY < parentRect.top + threshold) {
            scrollableParent.scrollBy(0, -scrollSpeed);
        } 
        // 如果拖拽到底部20%的区域，向下滚动
        else if (clientY > parentRect.bottom - threshold) {
            scrollableParent.scrollBy(0, scrollSpeed);
        }
    });

    // 当在容器内放置时
    controlContainer.addEventListener('drop', e => {
        e.preventDefault();
        
        // --- 核心逻辑：重新排序预览区的卡片 ---
        const newOrderIds = Array.from(controlContainer.children).map(child => child.dataset.cardId);

        newOrderIds.forEach(id => {
            const cardToMove = previewContainer.querySelector(`.card[data-card-id="${id}"]`);
            if(cardToMove) {
                previewContainer.appendChild(cardToMove);
            }
        });
        
        // 如果是双列布局，需要重新计算瀑布流
        if (cardType === 'dual') {
            recalculateCardLayout();
        }

        // 保存新的顺序
        saveState();
    });

    /**
     * 计算当前鼠标位置下，被拖拽的元素应该插入到哪个元素的前面
     * @param {HTMLElement} container - 容器元素
     * @param {number} y - 鼠标的垂直坐标
     * @returns {HTMLElement|null} - 目标元素或null（表示应插入到末尾）
     */
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.card-control:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}


// === 6. 优化的导出功能 ===

// 新增：等待所有图片加载的辅助函数
function waitForAllImagesLoaded(clone, timeout = 5000) {
    const images = [];
    // 1. 卡片背景图（通过style.backgroundImage设置）
    clone.querySelectorAll('.card.card-has-bg').forEach(card => {
        const bg = card.style.backgroundImage;
        if (bg && bg.startsWith('url(')) {
            // 兼容单双引号
            let url = bg.slice(4, -1).replace(/^["']|["']$/g, '');
            if (url) {
                images.push(url);
            }
        }
    });
    // 2. 全局背景图（previewArea）
    const previewBg = clone.style.backgroundImage;
    if (previewBg && previewBg.startsWith('url(')) {
        let url = previewBg.slice(4, -1).replace(/^["']|["']$/g, '');
        if (url) {
            images.push(url);
        }
    }
    // 3. 头像
    const avatar = clone.querySelector('#avatar-preview');
    if (avatar && avatar.src && avatar.src.startsWith('data:image')) {
        images.push(avatar.src);
    }
    // 4. 预览区内所有img标签（如有）
    clone.querySelectorAll('img').forEach(img => {
        if (img.src && img.src.startsWith('data:image')) {
            images.push(img.src);
        }
    });
    // 等待所有图片加载，或超时
    const loadPromises = images.map(url => new Promise(resolve => {
        const img = new window.Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = url;
    }));
    return Promise.race([
        Promise.all(loadPromises),
        new Promise(resolve => setTimeout(resolve, timeout))
    ]);
}

exportBtn.addEventListener('click', async () => {
    // 显示加载状态
    exportBtn.textContent = '正在生成图片...';
    exportBtn.disabled = true;

    // 创建一个用于离屏渲染的克隆体
    const clone = previewArea.cloneNode(true);
    clone.id = 'preview-clone-for-render'; // 赋予新ID以避免冲突
    
    // --- 核心修改：将克隆体放置在屏幕外并强制设置其样式 ---
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '0px';
    // 判断是否为手机模式
    if (mobileModeToggle && mobileModeToggle.checked) {
        clone.style.width = '375px';
        clone.style.maxWidth = '375px';
    } else {
        clone.style.width = '600px';
        clone.style.maxWidth = '600px';
    }
    clone.style.boxShadow = 'none'; // 去除阴影以获得干净截图
    document.body.appendChild(clone);
    
    try {
        // --- 在克隆体上执行所有布局计算和渲染准备 ---

        // 1. 获取克隆体内的双列容器
        const dualColumnClone = clone.querySelector('#dual-column-cards-container');
        
        // 2. 根据新宽度重新计算克隆体内的瀑布流布局
        recalculateCardLayout(dualColumnClone);
        
        // 3. 确保所有字体都已加载完成
        await document.fonts.ready;

        // 4. 等待所有背景图和头像加载完成，最长5秒
        await waitForAllImagesLoaded(clone, 5000);

        // 5. 等待片刻，以确保图片和CSS背景完全渲染
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 6. 使用优化的html2canvas配置在克隆体上截图
        const exportScale = (hdExportToggle && hdExportToggle.checked) ? 4 : 2;
        const canvas = await html2canvas(clone, {
            scale: exportScale, // 调整导出分辨率
            useCORS: true,
            allowTaint: false, // 设为false以配合useCORS
            backgroundColor: null, // 设置背景为透明
            logging: false,
        });
        
        // 创建高质量图片
        const imageUrl = canvas.toDataURL('image/png', 1.0);
        const filename = `Tintro_${new Date().toISOString().slice(0, 10)}.png`;
        showDownloadModal(imageUrl, filename, '图片已生成');
        
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败，可能是网络问题或图片跨域限制导致，请检查控制台信息或稍后重试。');
    } finally {
        // --- 恢复现场 ---
        
        // 从DOM中移除克隆体
        document.body.removeChild(clone);

        // 恢复按钮状态
        exportBtn.textContent = '导出为图片';
        exportBtn.disabled = false;
    }
});

// === 新增：导入/导出配置功能 ===
exportConfigBtn.addEventListener('click', () => {
    const state = getCurrentState();
    const stateJson = JSON.stringify(state, null, 2); // 格式化JSON，方便阅读
    const blob = new Blob([stateJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `tintro-config_${new Date().toISOString().slice(0, 10)}.json`;

    showDownloadModal(url, filename, '配置文件已生成');
});

importConfigBtn.addEventListener('click', () => {
    configFilePicker.click(); // 触发隐藏的文件输入框
});

configFilePicker.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const state = JSON.parse(e.target.result);
            applyState(state);
            alert('配置导入成功！');
        } catch (error) {
            console.error('读取配置文件失败:', error);
            alert('导入失败，请确保文件是正确的配置文件。');
        }
    };
    reader.readAsText(file);

    // 清空input的值，确保下次选择同一文件也能触发change事件
    event.target.value = '';
});

// 新增：为下载模态框的关闭按钮绑定事件
downloadModalCloseBtn.addEventListener('click', hideDownloadModal);


// 新增：导出帮助提示
const exportHelpLink = document.getElementById('export-help-link');
if (exportHelpLink) {
    exportHelpLink.addEventListener('click', function(e) {
        e.preventDefault();
        alert(
            '如果是格式问题：\n' +
            '1. 检查所用的设备屏幕大小。如果屏幕宽度过小（比如手机），建议先横屏，然后点击各个卡片或适当输入/删除回车直到所有卡片显示正常，再点击导出。\n' +
            '2. 尝试更换网络，例如用移动数据访问。\n' +
            '3. 尝试更换浏览器（可以先导出配置，在新的浏览器中导入），强烈不推荐使用夸克浏览器或手机端无法横屏的浏览器。\n' +
            '\n如果是图片保存失败或没有反应的问题：\n' +
            '一般是由于设备/浏览器的安全设置，建议尝试长按/右键导出的图片预览来保存，如依旧不行，尝试更换浏览器/设备。'
        );
    });
}

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
    // 新增：确保即使没有缓存，全局样式的默认值也能在首次加载时正确应用
    updateAllCardsAlignment();
    updateAllCardsLineHeight();
    updateFontFamily();
    updateFontSize(); // 新增：首次加载时也应用字体大小
    
    // 初始化拖拽功能
    makeSortable(singleCardControlsContainer, singleColumnCardsContainer, 'single');
    makeSortable(dualCardControlsContainer, dualColumnCardsContainer, 'dual');
});