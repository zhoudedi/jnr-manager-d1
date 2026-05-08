document.addEventListener('DOMContentLoaded', function() {
    const stepForm = document.getElementById('stepForm');
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // 添加鼠标跟随效果
    addMouseFollowEffect();
    
    // 添加滚动视差效果
    addParallaxEffect();
    
    // 添加粒子交互效果
    addParticleInteraction();
    
    // 表单提交处理
    stepForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const account = document.getElementById('account').value.trim();
        const password = document.getElementById('password').value.trim();
        const steps = document.getElementById('steps').value.trim();
        
        // 验证输入
        if (!validateInputs(account, password, steps)) {
            return;
        }
        
        // 显示加载动画
        showLoading();
        
        try {
            // 调用API
            const result = await submitSteps(account, password, steps);
            
            // 显示结果
            displayResult(result);
            
        } catch (error) {
            // 显示错误信息
            displayError(error.message);
        } finally {
            // 隐藏加载动画
            hideLoading();
        }
    });
    
    // 鼠标跟随效果
    function addMouseFollowEffect() {
        document.addEventListener('mousemove', function(e) {
            const cards = document.querySelectorAll('.main-card, .feature-card, .result-card');
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            cards.forEach((card, index) => {
                const speed = (index + 1) * 0.5;
                const x = (mouseX - 0.5) * speed * 10;
                const y = (mouseY - 0.5) * speed * 10;
                
                card.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }
    
    // 滚动视差效果
    function addParallaxEffect() {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const parallax = document.querySelector('.particles');
            const speed = scrolled * 0.5;
            
            if (parallax) {
                parallax.style.transform = `translateY(${speed}px)`;
            }
        });
    }
    
    // 粒子交互效果
    function addParticleInteraction() {
        document.addEventListener('mousemove', function(e) {
            const particles = document.querySelectorAll('.particle');
            
            particles.forEach((particle, index) => {
                const rect = particle.getBoundingClientRect();
                const particleX = rect.left + rect.width / 2;
                const particleY = rect.top + rect.height / 2;
                const distance = Math.sqrt(
                    Math.pow(e.clientX - particleX, 2) + Math.pow(e.clientY - particleY, 2)
                );
                
                if (distance < 100) {
                    const force = (100 - distance) / 100;
                    const angle = Math.atan2(particleY - e.clientY, particleX - e.clientX);
                    const x = Math.cos(angle) * force * 20;
                    const y = Math.sin(angle) * force * 20;
                    
                    particle.style.transform = `translate(${x}px, ${y}px) scale(${1 + force})`;
                } else {
                    particle.style.transform = 'translate(0px, 0px) scale(1)';
                }
            });
        });
    }
    
    // 输入验证函数
    function validateInputs(account, password, steps) {
        let isValid = true;
        
        // 重置错误样式
        document.querySelectorAll('.form-group input').forEach(input => {
            input.classList.remove('error');
        });
        
        // 验证账号
        if (!account) {
            showInputError('account', '请输入账号');
            isValid = false;
        } else if (account.length < 3) {
            showInputError('account', '账号长度不能少于3位');
            isValid = false;
        }
        
        // 验证密码
        if (!password) {
            showInputError('password', '请输入密码');
            isValid = false;
        } else if (password.length < 6) {
            showInputError('password', '密码长度不能少于6位');
            isValid = false;
        }
        
        // 验证步数
        if (!steps) {
            showInputError('steps', '请输入步数');
            isValid = false;
        } else if (isNaN(steps) || parseInt(steps) <= 0) {
            showInputError('steps', '请输入有效的步数');
            isValid = false;
        } else if (parseInt(steps) > 99999) {
            showInputError('steps', '步数不能超过99999');
            isValid = false;
        }
        
        return isValid;
    }
    
    // 显示输入错误
    function showInputError(fieldId, message) {
        const input = document.getElementById(fieldId);
        input.classList.add('error');
        
        // 创建错误提示元素
        let errorElement = input.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            input.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.style.color = '#e53e3e';
        errorElement.style.fontSize = '0.85rem';
        errorElement.style.marginTop = '5px';
        
        // 3秒后移除错误提示
        setTimeout(() => {
            if (errorElement) {
                errorElement.remove();
            }
            input.classList.remove('error');
        }, 3000);
    }
    
    // 背景设置相关函数
    
    // 打开设置面板
    window.openSettings = function() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };
    
    // 关闭设置面板
    window.closeSettings = function() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
    
    // 应用背景预设
    window.applyBgPreset = function(preset) {
        const body = document.body;
        const customBg = document.querySelector('.custom-bg');
        
        // 移除之前的背景类
        body.classList.remove('bg-custom', 'bg-solid', 'bg-none');
        
        switch(preset) {
            case 'custom':
                // 使用指定的京东图片链接
                if (customBg) {
                    customBg.style.backgroundImage = 'url("https://img12.360buyimg.com/ddimg/jfs/t1/347812/4/26730/23908/6915cb86F4568bc72/33bbab5d0d205466.jpg")';
                    customBg.style.display = 'block';
                }
                body.classList.add('bg-custom');
                break;
            case 'solid':
                body.classList.add('bg-solid');
                if (customBg) customBg.style.display = 'none';
                break;
            case 'none':
                body.classList.add('bg-none');
                if (customBg) customBg.style.display = 'none';
                break;
            default:
                if (customBg) customBg.style.display = 'none';
                break;
        }
        
        // 保存设置到本地存储
        localStorage.setItem('bgPreset', preset);
    };
    
    // 更新背景透明度
    window.updateBgOpacity = function(opacity) {
        const customBg = document.querySelector('.custom-bg');
        const opacityValue = document.getElementById('opacityValue');
        
        if (customBg) {
            customBg.style.opacity = opacity / 100;
        }
        
        if (opacityValue) {
            opacityValue.textContent = opacity + '%';
        }
        
        // 保存设置到本地存储
        localStorage.setItem('bgOpacity', opacity);
    };
    
    // 初始化背景设置
    function initBackgroundSettings() {
        const savedPreset = localStorage.getItem('bgPreset') || 'default';
        const savedOpacity = localStorage.getItem('bgOpacity') || '100';
        
        // 应用保存的设置
        if (savedPreset !== 'default') {
            const bgSelect = document.getElementById('bgPresetSelect');
            if (bgSelect) bgSelect.value = savedPreset;
            applyBgPreset(savedPreset);
        } else {
            // 默认隐藏自定义背景
            const customBg = document.querySelector('.custom-bg');
            if (customBg) customBg.style.display = 'none';
        }
        
        // 设置透明度
        const opacitySlider = document.getElementById('bgOpacity');
        if (opacitySlider) opacitySlider.value = savedOpacity;
        updateBgOpacity(savedOpacity);
    }
    
    // 初始化所有设置
    initAllSettings();
    
    // 切换毛玻璃效果
    window.toggleGlassEffect = function() {
        const checkbox = document.getElementById('glassEffect');
        const cards = document.querySelectorAll('.main-card, .feature-card, .modal-container');
        
        if (checkbox.checked) {
            cards.forEach(card => {
                card.style.backdropFilter = 'blur(25px)';
                card.style.webkitBackdropFilter = 'blur(25px)';
            });
        } else {
            cards.forEach(card => {
                card.style.backdropFilter = 'none';
                card.style.webkitBackdropFilter = 'none';
            });
        }
        
        localStorage.setItem('glassEffect', checkbox.checked);
    };
    
    // 更新毛玻璃模糊强度
    window.updateGlassBlur = function(blurValue) {
        const cards = document.querySelectorAll('.main-card, .feature-card, .modal-container');
        const blurValueSpan = document.getElementById('blurValue');
        
        if (document.getElementById('glassEffect').checked) {
            cards.forEach(card => {
                card.style.backdropFilter = `blur(${blurValue}px)`;
                card.style.webkitBackdropFilter = `blur(${blurValue}px)`;
            });
        }
        
        if (blurValueSpan) {
            blurValueSpan.textContent = blurValue + 'px';
        }
        
        localStorage.setItem('glassBlur', blurValue);
    };
    
    // 保存所有设置
    window.saveSettings = function() {
        closeSettings();
        // 设置已自动保存，这里可以添加提示
        console.log('设置已保存');
    };
    
    // 初始化毛玻璃设置
    function initGlassSettings() {
        const savedGlassEffect = localStorage.getItem('glassEffect');
        const savedGlassBlur = localStorage.getItem('glassBlur') || '25';
        
        if (savedGlassEffect !== null) {
            const glassCheckbox = document.getElementById('glassEffect');
            if (glassCheckbox) {
                glassCheckbox.checked = savedGlassEffect === 'true';
                toggleGlassEffect();
            }
        }
        
        if (savedGlassBlur) {
            const blurSlider = document.getElementById('glassBlur');
            const blurValueSpan = document.getElementById('blurValue');
            if (blurSlider) blurSlider.value = savedGlassBlur;
            if (blurValueSpan) blurValueSpan.textContent = savedGlassBlur + 'px';
        }
    }
    
    // 初始化所有设置
    function initAllSettings() {
        initBackgroundSettings();
        initGlassSettings();
    }
    
    // 提交步数到API。account=账号，password=密码，steps=步数
    async function submitSteps(account, password, steps) {
        const apiUrl = `https://api.5k4.cn/api/zeep?key=2e1ea3f60e06d0c5&account=${encodeURIComponent(account)}&password=${encodeURIComponent(password)}&steps=${encodeURIComponent(steps)}`;
        
        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 根据返回的数据结构处理结果
            if (data.code === 1 || data.code === '1') {
                throw new Error(data.msg || data.message || '格式错误，请检查输入参数');
            }
            
            return {
                status: 'success',
                success: data.success || true,
                message: data.message || data.msg || '步数提交成功',
                step: data.step || steps,
                account: data.account || account,
                proxy_used: data.proxy_used || '未使用代理',
                time: data.time || new Date().toLocaleString('zh-CN')
            };
            
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('网络连接失败，请检查网络连接');
            }
            throw error;
        }
    }
    
    // 显示结果弹窗
     function showResultModal(targetSteps, currentSteps, stepsToAdd, estimatedTime, calories, healthTip, isSuccess = true) {
         // 获取或创建弹窗元素
         let modal = document.getElementById('resultModal');
         if (!modal) {
             modal = document.createElement('div');
             modal.id = 'resultModal';
             modal.className = 'modal-overlay';
             document.body.appendChild(modal);
         }
         
         // 设置弹窗内容
         const iconClass = isSuccess ? 'fas fa-check' : 'fas fa-times';
         const titleText = isSuccess ? '刷步成功！' : '刷步失败！';
         const statusClass = isSuccess ? 'success' : 'error';
         
         modal.className = `modal-overlay ${statusClass}`;
         modal.innerHTML = `
             <div class="modal-container">
                 <div class="modal-header">
                     <div class="modal-icon">
                         <i class="${iconClass}"></i>
                     </div>
                     <h2 class="modal-title">${titleText}</h2>
                     <button class="modal-close" onclick="window.closeResultModal()">
                         <i class="fas fa-times"></i>
                     </button>
                 </div>
                 <div class="modal-content">
                     <div class="result-details">
                         <div class="result-item">
                             <span class="result-label">目标步数:</span>
                             <span class="result-value">${targetSteps}</span>
                         </div>
                         <div class="result-item">
                             <span class="result-label">当前步数:</span>
                             <span class="result-value">${currentSteps}</span>
                         </div>
                         <div class="result-item">
                             <span class="result-label">需要刷步数:</span>
                             <span class="result-value">${stepsToAdd}</span>
                         </div>
                         <div class="result-item">
                             <span class="result-label">预计时间:</span>
                             <span class="result-value">${estimatedTime}</span>
                         </div>
                         <div class="result-item">
                             <span class="result-label">消耗卡路里:</span>
                             <span class="result-value">${calories}</span>
                         </div>
                         <div class="result-item">
                             <span class="result-label">健康建议:</span>
                             <span class="result-value">${healthTip}</span>
                         </div>
                     </div>
                 </div>
                 <div class="modal-footer">
                     <button class="modal-btn modal-btn-secondary" onclick="window.closeResultModal()">
                         <i class="fas fa-times"></i>
                         关闭
                     </button>
                     <button class="modal-btn modal-btn-primary" onclick="window.continueSubmit()">
                         <i class="fas fa-sync"></i>
                         继续提交
                     </button>
                 </div>
             </div>
         `;
         
         // 添加点击外部关闭事件
         modal.addEventListener('click', function(event) {
             if (event.target === modal) {
                 window.closeResultModal();
             }
         });
         
         // 显示弹窗
         setTimeout(() => {
             modal.classList.add('show');
         }, 10);
         
         // 添加键盘事件监听
         document.addEventListener('keydown', handleModalKeydown);
     }
     
     // 关闭结果弹窗
     function closeResultModal() {
         const modal = document.getElementById('resultModal');
         if (modal) {
             modal.classList.remove('show');
             setTimeout(() => {
                 modal.remove();
             }, 300);
         }
         document.removeEventListener('keydown', handleModalKeydown);
     }
     
     // 继续提交
     function continueSubmit() {
         window.closeResultModal();
         // 重置表单并聚焦到第一个输入框
         stepForm.reset();
         document.getElementById('steps').focus();
         
         // 显示友好的提示信息
         showNotification('表单已重置，请重新输入数据', 'info');
     }
     
     // 将函数添加到全局作用域
     window.closeResultModal = closeResultModal;
     window.continueSubmit = continueSubmit;
     
     // 显示通知
     function showNotification(message, type = 'success') {
         // 创建通知元素
         const notification = document.createElement('div');
         notification.className = `notification notification-${type}`;
         notification.innerHTML = `
             <div class="notification-content">
                 <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                 <span>${message}</span>
             </div>
         `;
         
         // 添加样式
         notification.style.cssText = `
             position: fixed;
             top: 20px;
             right: 20px;
             background: ${type === 'success' ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : type === 'error' ? 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' : 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)'};
             color: white;
             padding: 15px 20px;
             border-radius: 10px;
             box-shadow: 0 8px 25px rgba(0,0,0,0.2);
             z-index: 3000;
             transform: translateX(400px);
             transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
             font-weight: 500;
             max-width: 300px;
         `;
         
         document.body.appendChild(notification);
         
         // 显示动画
         setTimeout(() => {
             notification.style.transform = 'translateX(0)';
         }, 100);
         
         // 自动隐藏
         setTimeout(() => {
             notification.style.transform = 'translateX(400px)';
             setTimeout(() => {
                 notification.remove();
             }, 300);
         }, 3000);
     }
     
     // 处理弹窗键盘事件
     function handleModalKeydown(event) {
         if (event.key === 'Escape') {
             closeResultModal();
         }
     }

    // 显示结果
     function displayResult(result) {
         const isSuccess = result.status === 'success';
         
         showResultModal(
             result.step.toLocaleString() + ' 步',
             '0 步',
             result.step.toLocaleString() + ' 步',
             '即时',
             '约 ' + Math.round(result.step * 0.04) + ' 千卡',
             result.message || '步数已更新，请保持运动习惯！',
             isSuccess
         );
         
         // 重置表单
         stepForm.reset();
         
         // 显示成功动画
         showSuccessAnimation();
     }
    
    // 显示错误信息
    function displayError(message) {
        // 使用弹窗显示错误信息
        showResultModal(
            '未知',
            '未知',
            '未知',
            '未知',
            '未知',
            message || '提交失败，请检查输入参数或稍后重试',
            false
        );
    }
    
    // 显示加载动画
    function showLoading() {
        loadingOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    // 隐藏加载动画
    function hideLoading() {
        loadingOverlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
    
    // 隐藏结果卡片
    window.hideResult = function() {
        resultCard.classList.add('hidden');
        resultContent.innerHTML = '';
    };
    
    // 显示成功动画
    function showSuccessAnimation() {
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.style.animation = 'pulse 0.6s ease-in-out';
        
        setTimeout(() => {
            submitBtn.style.animation = '';
        }, 600);
    }
    
    // 添加输入框焦点效果
    document.querySelectorAll('.form-group input').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentNode.style.transform = 'scale(1)';
        });
    });
    
    // 添加回车键提交功能
    document.querySelectorAll('.form-group input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                stepForm.dispatchEvent(new Event('submit'));
            }
        });
    });
    
    // 添加步数输入限制
    document.getElementById('steps').addEventListener('input', function() {
        if (this.value.length > 5) {
            this.value = this.value.slice(0, 5);
        }
        if (parseInt(this.value) > 99999) {
            this.value = '99999';
        }
    });
    
    // 添加账号输入限制
    document.getElementById('account').addEventListener('input', function() {
        // 限制特殊字符
        this.value = this.value.replace(/[^a-zA-Z0-9@._-]/g, '');
    });
    
    // 防止表单重复提交
    let isSubmitting = false;
    stepForm.addEventListener('submit', function() {
        if (isSubmitting) {
            return;
        }
        isSubmitting = true;
        
        setTimeout(() => {
            isSubmitting = false;
        }, 3000);
    });
    
    // 移动端性能优化检测
function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 检测低端设备
function isLowEndDevice() {
    // 检测内存
    const memory = navigator.deviceMemory;
    if (memory && memory < 4) return true;
    
    // 检测CPU核心数
    const hardwareConcurrency = navigator.hardwareConcurrency;
    if (hardwareConcurrency && hardwareConcurrency < 4) return true;
    
    // 检测连接类型
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && connection.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
        return true;
    }
    
    return false;
}

    console.log('智能步数管理器已加载完成！');
});