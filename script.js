// 文章内容（沁园春·长沙）
const originalText = `独立寒秋，湘江北去，橘子洲头。看万山红遍，层林尽染；漫江碧透，百舸争流。鹰击长空，鱼翔浅底，万类霜天竞自由。怅寥廓，问苍茫大地，谁主沉浮？

携来百侣曾游。忆往昔峥嵘岁月稠。恰同学少年，风华正茂；书生意气，挥斥方遒。指点江山，激扬文字，粪土当年万户侯。曾记否，到中流击水，浪遏飞舟？`;

// 拼音映射表
const pinyinMap = {
    '独': 'dú', '立': 'lì', '寒': 'hán', '秋': 'qiū', '湘': 'xiāng', '江': 'jiāng', '北': 'běi', '去': 'qù',
    '橘': 'jú', '子': 'zǐ', '洲': 'zhōu', '头': 'tóu', '看': 'kàn', '万': 'wàn', '山': 'shān', '红': 'hóng',
    '遍': 'biàn', '层': 'céng', '林': 'lín', '尽': 'jìn', '染': 'rǎn', '漫': 'màn', '碧': 'bì', '透': 'tòu',
    '百': 'bǎi', '舸': 'gě', '争': 'zhēng', '流': 'liú', '鹰': 'yīng', '击': 'jī', '长': 'cháng', '空': 'kōng',
    '鱼': 'yú', '翔': 'xiáng', '浅': 'qiǎn', '底': 'dǐ', '类': 'lèi', '霜': 'shuāng', '天': 'tiān', '竞': 'jìng',
    '自': 'zì', '由': 'yóu', '怅': 'chàng', '寥': 'liáo', '廓': 'kuò', '问': 'wèn', '苍': 'cāng', '茫': 'máng',
    '大': 'dà', '地': 'dì', '谁': 'shuí', '主': 'zhǔ', '沉': 'chén', '浮': 'fú', '携': 'xié', '来': 'lái',
    '侣': 'lǚ', '曾': 'céng', '游': 'yóu', '忆': 'yì', '往': 'wǎng', '昔': 'xī', '峥': 'zhēng', '嵘': 'róng',
    '岁': 'suì', '月': 'yuè', '稠': 'chóu', '恰': 'qià', '同': 'tóng', '学': 'xué', '少': 'shào', '年': 'nián',
    '风': 'fēng', '华': 'huá', '正': 'zhèng', '茂': 'mào', '书': 'shū', '生': 'shēng', '意': 'yì', '气': 'qì',
    '挥': 'huī', '斥': 'chì', '方': 'fāng', '遒': 'qiú', '指': 'zhǐ', '点': 'diǎn', '激': 'jī', '扬': 'yáng',
    '文': 'wén', '字': 'zì', '粪': 'fèn', '土': 'tǔ', '当': 'dāng', '户': 'hù', '侯': 'hóu', '记': 'jì',
    '否': 'fǒu', '到': 'dào', '中': 'zhōng', '击': 'jī', '水': 'shuǐ', '浪': 'làng', '遏': 'è', '飞': 'fēi',
    '舟': 'zhōu'
};

let hiddenChars = []; // 存储隐藏的字符索引
let lastSentence = ''; // 最后点击的句子
let hideMode = 'random'; // 隐藏模式

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    displayFullText();
    bindEvents();
});

function bindEvents() {
    document.getElementById('show-full').addEventListener('click', displayFullText);
    document.getElementById('hide-slider').addEventListener('input', () => {
        const value = document.getElementById('hide-slider').value;
        document.getElementById('slider-value').textContent = value + '%';
        const ratio = parseInt(value) / 100;
        hideChars(ratio);
    });
    document.getElementById('random-mode').addEventListener('change', () => { hideMode = 'random'; });
    document.getElementById('uniform-mode').addEventListener('change', () => { hideMode = 'uniform'; });
    document.getElementById('preserve-mode').addEventListener('change', () => { hideMode = 'preserve'; });
    document.getElementById('check-answers').addEventListener('click', checkAnswers);
    document.getElementById('show-original').addEventListener('click', showOriginal);
}

// 显示完整文章
function displayFullText() {
    const container = document.getElementById('article-container');
    container.innerHTML = originalText.split('').map(char => {
        if (/[\u4e00-\u9fff]/.test(char)) {
            const pinyin = pinyinMap[char] || '';
            return `<ruby><span onclick="showChar(event, this)">${char}</span><rt>${pinyin}</rt></ruby>`;
        } else {
            return `<span onclick="showChar(event, this)">${char}</span>`;
        }
    }).join('');
    hiddenChars = [];
}

// 隐藏指定比例的汉字
function hideChars(ratio) {
    const chars = originalText.split('');
    const totalChars = chars.filter(char => /[\u4e00-\u9fff]/.test(char)).length;
    const hideCount = Math.floor(totalChars * ratio);
    hiddenChars = [];

    const availableIndices = [];
    for (let i = 0; i < chars.length; i++) {
        if (/[\u4e00-\u9fff]/.test(chars[i])) {
            availableIndices.push(i);
        }
    }

    // 计算要排除的首字索引
    const excludeIndices = new Set();
    if (hideMode === 'preserve') {
        let sentenceStart = 0;
        for (let i = 0; i < originalText.length; i++) {
            if (['。','？','！','；','、','，'].includes(originalText[i])) {
                const sentence = originalText.substring(sentenceStart, i + 1);
                for (let j = 0; j < sentence.length; j++) {
                    if (/[\u4e00-\u9fff]/.test(sentence[j])) {
                        excludeIndices.add(sentenceStart + j);
                        break;
                    }
                }
                sentenceStart = i + 1;
            }
        }
        // 剩余部分
        if (sentenceStart < originalText.length) {
            const sentence = originalText.substring(sentenceStart);
            for (let j = 0; j < sentence.length; j++) {
                if (/[\u4e00-\u9fff]/.test(sentence[j])) {
                    excludeIndices.add(sentenceStart + j);
                    break;
                }
            }
        }
    }

    // 过滤availableIndices
    const filteredIndices = availableIndices.filter(idx => !excludeIndices.has(idx));

    if (hideMode === 'random' || hideMode === 'preserve') {
        // 随机隐藏
        for (let i = 0; i < hideCount; i++) {
            if (filteredIndices.length === 0) break;
            const randomIndex = Math.floor(Math.random() * filteredIndices.length);
            hiddenChars.push(filteredIndices.splice(randomIndex, 1)[0]);
        }
    } else if (hideMode === 'uniform') {
        // 均匀隐藏
        for (let i = 0; i < hideCount; i++) {
            const index = Math.floor(i * filteredIndices.length / hideCount);
            hiddenChars.push(filteredIndices[index]);
        }
    }

    displayTextWithBlanks();
}

// 显示带空缺的文章
function displayTextWithBlanks() {
    const container = document.getElementById('article-container');
    let html = '';
    let sentenceStart = 0;
    for (let i = 0; i < originalText.length; i++) {
        if (['。','？','！','；','、','，'].includes(originalText[i])) {
            const sentence = originalText.substring(sentenceStart, i + 1);
            const sentenceHtml = sentence.split('').map((char, idx) => {
                const globalIdx = sentenceStart + idx;
                if (hiddenChars.includes(globalIdx)) {
                    return `<input type="text" maxlength="1" data-index="${globalIdx}" onclick="showHint(this)">`;
                }
                if (/[\u4e00-\u9fff]/.test(char)) {
                    const pinyin = pinyinMap[char] || '';
                    return `<ruby><span onclick="showChar(event, this)">${char}</span><rt>${pinyin}</rt></ruby>`;
                } else {
                    return `<span onclick="showChar(event, this)">${char}</span>`;
                }
            }).join('');
            html += `<span class="sentence" onclick="showSentence(this)" data-original="${sentence.replace(/"/g, '&quot;')}">${sentenceHtml}</span>`;
            sentenceStart = i + 1;
        }
    }
    // 添加剩余部分
    if (sentenceStart < originalText.length) {
        const sentence = originalText.substring(sentenceStart);
        const sentenceHtml = sentence.split('').map((char, idx) => {
            const globalIdx = sentenceStart + idx;
            if (hiddenChars.includes(globalIdx)) {
                return `<input type="text" maxlength="1" data-index="${globalIdx}" onclick="showHint(this)">`;
            }
            if (/[\u4e00-\u9fff]/.test(char)) {
                const pinyin = pinyinMap[char] || '';
                return `<ruby><span onclick="showChar(event, this)">${char}</span><rt>${pinyin}</rt></ruby>`;
            } else {
                return `<span onclick="showChar(event, this)">${char}</span>`;
            }
        }).join('');
        html += `<span class="sentence" onclick="showSentence(this)" data-original="${sentence.replace(/"/g, '&quot;')}">${sentenceHtml}</span>`;
    }
    container.innerHTML = html;
}

// 检查答案
function checkAnswers() {
    const inputs = document.querySelectorAll('#article-container input');
    let correct = 0;
    inputs.forEach(input => {
        const index = parseInt(input.getAttribute('data-index'));
        if (input.value === originalText[index]) {
            input.style.backgroundColor = '#d4edda'; // 绿色
            correct++;
        } else {
            input.style.backgroundColor = '#f8d7da'; // 红色
        }
    });
    alert(`检查完成！正确数：${correct}/${inputs.length}`);
}

// 显示原文
function showOriginal() {
    displayFullText();
}

// 显示提示（点击空白时）
function showHint(input) {
    const index = parseInt(input.getAttribute('data-index'));
    const char = originalText[index];
    const pinyin = pinyinMap[char] || '';
    input.outerHTML = `<ruby><span onclick="showChar(event, this)">${char}</span><rt>${pinyin}</rt></ruby>`;
}

// 显示句子（点击句子时）
function showSentence(span) {
    lastSentence = span.dataset.original;
}

// 显示字（点击字时）
function showChar(e, span) {
    e.stopPropagation();
    const sentenceSpan = span.closest('.sentence');
    const sentence = sentenceSpan.dataset.original;
    const cleanSentence = sentence.replace(/[。？！；、，]/g, '');
    document.getElementById('hint-area').innerText = `句子：${cleanSentence}`;
}

// 切换句子提示显示
function toggleSentenceHint() {
    const hint = document.getElementById('hint-area');
    if (hint.innerText === '*') {
        if (lastSentence) {
            hint.innerText = `句子：${lastSentence}`;
        }
    } else if (hint.innerText.startsWith('句子：')) {
        if (lastSentence) {
            const length = lastSentence.length;
            hint.innerText = '*'.repeat(length);
        }
    } else if (hint.innerText.startsWith('*') && hint.innerText.length > 1) {
        hint.innerText = `句子：${lastSentence}`;
    } else {
        hint.innerText = '*';
    }
}
