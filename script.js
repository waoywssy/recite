/**
 * 背诵练习工具 - JavaScript 主逻辑文件
 * 支持任意中文文本的拼音标注和渐进式背诵练习
 * 使用 pinyin-pro 库提供准确的拼音标注
 */

// 默认文章内容（沁园春·长沙）
const defaultText = `独立寒秋，湘江北去，橘子洲头。看万山红遍，层林尽染；漫江碧透，百舸争流。鹰击长空，鱼翔浅底，万类霜天竞自由。怅寥廓，问苍茫大地，谁主沉浮？

携来百侣曾游。忆往昔峥嵘岁月稠。恰同学少年，风华正茂；书生意气，挥斥方遒。指点江山，激扬文字，粪土当年万户侯。曾记否，到中流击水，浪遏飞舟？`;

// 当前使用的文本
let currentText = defaultText;

/**
 * 获取汉字拼音的函数（使用pinyin-pro库）
 * @param {string} char - 要获取拼音的单个汉字
 * @returns {string} 汉字的拼音（带声调）
 */
function getPinyin(char) {
    try {
        // 使用pinyin-pro库获取拼音，保留声调
        return window.pinyinPro.pinyin(char);
    } catch (error) {
        console.warn('拼音获取失败:', char, error);
        return '';
    }
}

// 存储隐藏的字符索引
let hiddenChars = [];
// 最后点击的句子
let lastSentence = '';
// 隐藏模式：'random'(随机), 'uniform'(均匀), 'preserve'(保留首字), 'alternate'(交替)
let hideMode = 'preserve';
// 交替隐藏状态：0隐藏奇数，1隐藏偶数
let alternateState = 0;

/**
 * 页面初始化函数
 * 设置默认文本并绑定事件监听器
 */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('text-input').value = defaultText;
    displayFullText();
    bindEvents();
});

/**
 * 绑定所有事件监听器
 * 为页面上的按钮、滑块等元素添加点击和输入事件
 */
function bindEvents() {
    // 显示完整文章按钮
    document.getElementById('show-full').addEventListener('click', displayFullText);

    // 加载自定义文本按钮
    document.getElementById('load-text').addEventListener('click', loadCustomText);

    // 加载默认文本按钮
    document.getElementById('load-default').addEventListener('click', loadDefaultText);

    // 切换输入区域显示/隐藏按钮
    document.getElementById('toggle-input').addEventListener('click', toggleInputArea);

    // 隐藏比例滑块
    document.getElementById('hide-slider').addEventListener('input', () => {
        const value = document.getElementById('hide-slider').value;
        document.getElementById('slider-value').textContent = value + '%';
        const ratio = parseInt(value) / 100;
        hideChars(ratio);
    });

    // 隐藏模式按钮组
    document.getElementById('random-btn').addEventListener('click', () => { setMode('random'); });
    document.getElementById('uniform-btn').addEventListener('click', () => { setMode('uniform'); });
    document.getElementById('preserve-btn').addEventListener('click', () => { setMode('preserve'); });
    document.getElementById('alternate-btn').addEventListener('click', () => { setMode('alternate'); });
}

/**
 * 切换输入区域显示/隐藏
 * 方便用户在背诵时隐藏输入框，专注练习
 */
function toggleInputArea() {
    const inputArea = document.getElementById('input-area');
    const toggleBtn = document.getElementById('toggle-input');

    if (inputArea.classList.contains('hidden')) {
        // 显示输入区域
        inputArea.classList.remove('hidden');
        toggleBtn.textContent = '隐藏输入区';
    } else {
        // 隐藏输入区域
        inputArea.classList.add('hidden');
        toggleBtn.textContent = '显示输入区';
    }
}

/**
 * 加载自定义文本
 * 从文本框中读取用户输入的文本，并设置为当前背诵内容
 */
function loadCustomText() {
    const inputText = document.getElementById('text-input').value.trim();
    if (!inputText) {
        alert('请输入要背诵的文本！');
        return;
    }
    currentText = inputText;
    updatePinyinMap();
    displayFullText();
    resetSlider();
    document.getElementById('hint-area').innerText = '************';
}

/**
 * 加载默认文本
 * 恢复到默认的《沁园春·长沙》文本
 */
function loadDefaultText() {
    currentText = defaultText;
    document.getElementById('text-input').value = defaultText;
    displayFullText();
    resetSlider();
}

/**
 * 重置滑块和隐藏状态
 * 将隐藏比例重置为0%，清空隐藏字符列表
 */
function resetSlider() {
    document.getElementById('hide-slider').value = 0;
    document.getElementById('slider-value').textContent = '0%';
    hiddenChars = [];
}

/**
 * 更新拼音映射表（不再需要，直接使用pinyin-pro）
 * 保留函数以备将来扩展使用
 */
function updatePinyinMap() {
    // 使用pinyin-pro库，不需要预处理
}

/**
 * 设置隐藏模式
 * @param {string} mode - 隐藏模式：'random', 'uniform', 'preserve', 'alternate'
 */
function setMode(mode) {
    if (hideMode === mode && mode === 'alternate') {
        // 如果已经是alternate模式，切换隐藏奇数/偶数句子
        alternateState = (alternateState + 1) % 2;
    } else {
        hideMode = mode;
        if (mode === 'alternate') {
            alternateState = 0; // 重置为隐藏奇数句子
        }
    }

    // 更新按钮样式，显示当前激活的模式
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    const btnId = mode + '-btn';
    document.getElementById(btnId).classList.add('active');

    // 重新显示文本
    updateDisplay();
}

/**
 * 更新显示
 * 根据当前滑块值重新应用隐藏逻辑
 */
function updateDisplay() {
    const slider = document.getElementById('hide-slider');
    const ratio = parseInt(slider.value) / 100;
    hideChars(ratio);
}

/**
 * 显示完整文章
 * 显示所有汉字的完整文本，包含拼音标注
 */
function displayFullText() {
    const container = document.getElementById('article-container');
    container.innerHTML = currentText.split('').map(char => {
        if (/[\u4e00-\u9fff]/.test(char)) {
            // 如果是汉字，添加拼音标注
            const pinyin = getPinyin(char);
            return `<ruby><span onclick="showChar(event, this)">${char}</span><rt>${pinyin}</rt></ruby>`;
        } else {
            // 非汉字直接显示
            return `<span onclick="showChar(event, this)">${char}</span>`;
        }
    }).join('');
    hiddenChars = [];
}

/**
 * 隐藏指定比例的汉字
 * 根据不同模式选择要隐藏的汉字位置
 * @param {number} ratio - 隐藏比例 (0-1之间)
 */
function hideChars(ratio) {
    const chars = currentText.split('');
    // 计算文本中的汉字总数
    const totalChars = chars.filter(char => /[\u4e00-\u9fff]/.test(char)).length;
    // 计算要隐藏的汉字数量
    const hideCount = Math.floor(totalChars * ratio);

    hiddenChars = [];

    // 获取所有汉字的位置索引
    const availableIndices = [];
    for (let i = 0; i < chars.length; i++) {
        if (/[\u4e00-\u9fff]/.test(chars[i])) {
            availableIndices.push(i);
        }
    }

    // 根据不同模式处理要排除的字符（保留首字模式）
    const excludeIndices = new Set();
    if (hideMode === 'preserve') {
        let sentenceStart = 0;
        for (let i = 0; i < currentText.length; i++) {
            if (['。','？','！','；','、','，',' '].includes(currentText[i])) {
                // 找到句子中的第一个汉字，保留不隐藏
                const sentence = currentText.substring(sentenceStart, i + 1);
                for (let j = 0; j < sentence.length; j++) {
                    if (/[\u4e00-\u9fff]/.test(sentence[j])) {
                        excludeIndices.add(sentenceStart + j);
                        break;
                    }
                }
                sentenceStart = i + 1;
            }
        }
        // 处理最后一段文字（没有标点符号结尾的文字）
        if (sentenceStart < currentText.length) {
            const sentence = currentText.substring(sentenceStart);
            for (let j = 0; j < sentence.length; j++) {
                if (/[\u4e00-\u9fff]/.test(sentence[j])) {
                    excludeIndices.add(sentenceStart + j);
                    break;
                }
            }
        }
    }

    // 过滤掉要保留的字符
    const filteredIndices = availableIndices.filter(idx => !excludeIndices.has(idx));

    // 根据不同模式选择要隐藏的位置
    if (hideMode === 'random' || hideMode === 'preserve') {
        // 随机隐藏模式
        for (let i = 0; i < hideCount; i++) {
            if (filteredIndices.length === 0) break;
            const randomIndex = Math.floor(Math.random() * filteredIndices.length);
            hiddenChars.push(filteredIndices.splice(randomIndex, 1)[0]);
        }
    } else if (hideMode === 'uniform') {
        // 均匀隐藏模式（等间距分布）
        for (let i = 0; i < hideCount; i++) {
            const index = Math.floor(i * filteredIndices.length / hideCount);
            hiddenChars.push(filteredIndices[index]);
        }
    }

    // 显示带空缺的文本
    displayTextWithBlanks();
}

/**
 * 显示带空缺的文章
 * 根据hiddenChars数组，将隐藏的字符替换为输入框
 */
function displayTextWithBlanks() {
    const container = document.getElementById('article-container');
    let html = '';
    let sentenceStart = 0;
    let sentenceIndex = 0;

    // 按句子分割文本并处理
    for (let i = 0; i < currentText.length; i++) {
        if (['。','？','！','；','、','，'].includes(currentText[i])) {
            // 处理一个完整的句子
            const sentence = currentText.substring(sentenceStart, i + 1);
            const shouldHideSentence = hideMode === 'alternate' && sentenceIndex % 2 === alternateState;

            const sentenceHtml = sentence.split('').map((char, idx) => {
                const globalIdx = sentenceStart + idx;
                if (hiddenChars.includes(globalIdx) || (shouldHideSentence && /[\u4e00-\u9fff]/.test(char))) {
                    // 这个字符需要隐藏，显示为空白输入框
                    if (shouldHideSentence && /[\u4e00-\u9fff]/.test(char)) {
                        hiddenChars.push(globalIdx);
                    }
                    return `<input type="text" maxlength="1" data-index="${globalIdx}" onclick="showHint(this)">`;
                }
                if (/[\u4e00-\u9fff]/.test(char)) {
                    // 显示汉字及其拼音
                    const pinyin = getPinyin(char);
                    return `<ruby><span onclick="showChar(event, this)">${char}</span><rt>${pinyin}</rt></ruby>`;
                } else {
                    // 显示非汉字字符
                    return `<span onclick="showChar(event, this)">${char}</span>`;
                }
            }).join('');

            // 包装句子并添加点击事件
            html += `<span class="sentence" onclick="showSentence(this)" data-original="${sentence.replace(/"/g, '&quot;')}">${sentenceHtml}</span>`;
            sentenceStart = i + 1;
            sentenceIndex++;
        }
    }

    // 处理最后一段（没有标点符号结尾的文字）
    if (sentenceStart < currentText.length) {
        const sentence = currentText.substring(sentenceStart);
        const sentenceIndexCurrent = sentenceIndex;
        const shouldHideSentence = hideMode === 'alternate' && sentenceIndexCurrent % 2 === alternateState;

        const sentenceHtml = sentence.split('').map((char, idx) => {
            const globalIdx = sentenceStart + idx;
            if (hiddenChars.includes(globalIdx) || (shouldHideSentence && /[\u4e00-\u9fff]/.test(char))) {
                if (shouldHideSentence && /[\u4e00-\u9fff]/.test(char)) {
                    hiddenChars.push(globalIdx);
                }
                return `<input type="text" maxlength="1" data-index="${globalIdx}" onclick="showHint(this)">`;
            }
            if (/[\u4e00-\u9fff]/.test(char)) {
                const pinyin = getPinyin(char);
                return `<ruby><span onclick="showChar(event, this)">${char}</span><rt>${pinyin}</rt></ruby>`;
            } else {
                return `<span onclick="showChar(event, this)">${char}</span>`;
            }
        }).join('');

        html += `<span class="sentence" onclick="showSentence(this)" data-original="${sentence.replace(/"/g, '&quot;')}">${sentenceHtml}</span>`;
    }

    container.innerHTML = html;
}

/**
 * 检查答案
 * 验证用户在输入框中填写的答案是否正确
 */
function checkAnswers() {
    const inputs = document.querySelectorAll('#article-container input');
    let correct = 0;

    inputs.forEach(input => {
        const index = parseInt(input.getAttribute('data-index'));
        if (input.value === currentText[index]) {
            // 答案正确，显示绿色背景
            input.style.backgroundColor = '#d4edda';
            correct++;
        } else {
            // 答案错误，显示红色背景
            input.style.backgroundColor = '#f8d7da';
        }
    });

    // 显示检查结果
    alert(`检查完成！正确数：${correct}/${inputs.length}`);
}

/**
 * 显示原文（已废弃，使用displayFullText替代）
 */
function showOriginal() {
    displayFullText();
}

/**
 * 显示提示（点击空白输入框时）
 * 将输入框替换为带有拼音的汉字
 * @param {HTMLInputElement} input - 被点击的输入框元素
 */
function showHint(input) {
    const index = parseInt(input.getAttribute('data-index'));
    const char = currentText[index];
    const pinyin = getPinyin(char);
    input.outerHTML = `<ruby><span onclick="showChar(event, this)">${char}</span><rt>${pinyin}</rt></ruby>`;
}

/**
 * 显示句子（点击句子时）
 * 记录当前点击的句子，用于提示功能
 * @param {HTMLSpanElement} span - 被点击的句子元素
 */
function showSentence(span) {
    lastSentence = span.dataset.original;
}

/**
 * 显示字（点击汉字时）
 * 显示当前汉字所在句子的提示
 * @param {Event} e - 点击事件
 * @param {HTMLSpanElement} span - 被点击的汉字元素
 */
function showChar(e, span) {
    e.stopPropagation(); // 阻止事件冒泡

    // 获取点击汉字所在的句子
    const sentenceSpan = span.closest('.sentence');
    const sentence = sentenceSpan.dataset.original;

    // 清理句子（去除标点符号）
    const cleanSentence = sentence.replace(/[。？！；、，]/g, '');

    // 在提示区域显示句子
    document.getElementById('hint-area').innerText = `句子：${cleanSentence}`;
}

/**
 * 切换句子提示显示
 * 在显示句子、显示星号、隐藏提示之间循环切换
 */
function toggleSentenceHint() {
    const hint = document.getElementById('hint-area');

    if (hint.innerText === '************') {
        // 当前是单个星号，显示句子
        if (lastSentence) {
            hint.innerText = `句子：${lastSentence}`;
        }
    } else if (hint.innerText.startsWith('句子：')) {
        // 当前显示句子，切换为星号遮罩
        if (lastSentence) {
            const length = lastSentence.length;
            hint.innerText = '*'.repeat(length);
        }
    } else if (hint.innerText.startsWith('*') && hint.innerText.length > 1) {
        // 当前是星号遮罩，重新显示句子
        hint.innerText = `句子：${lastSentence}`;
    } else {
        // 其他情况，显示单个星号
        hint.innerText = '************';
    }
}
