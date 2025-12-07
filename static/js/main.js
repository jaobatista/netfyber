// ========================================
// SISTEMA DE COOKIES PROFISSIONAL
// ========================================

class CookieManager {
    constructor() {
        this.cookieName = 'netfyber_cookies';
        this.cookieExpiry = 365;
        this.init();
    }

    init() {
        const preferences = this.getCookiePreferences();
        if (!preferences) {
            setTimeout(() => this.showBanner(), 1500);
        } else {
            this.applyPreferences(preferences);
        }
    }

    getCookiePreferences() {
        try {
            const cookie = localStorage.getItem(this.cookieName);
            return cookie ? JSON.parse(cookie) : null;
        } catch (error) {
            console.warn('Erro ao ler preferências de cookies:', error);
            return null;
        }
    }

    saveCookiePreferences(preferences) {
        try {
            const cookieData = {
                ...preferences,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem(this.cookieName, JSON.stringify(cookieData));
            this.applyPreferences(preferences);
            this.hideBanner();
            this.showConfirmation(preferences);
            
        } catch (error) {
            console.error('Erro ao salvar preferências:', error);
            this.showNotification('Erro ao salvar preferências. Tente novamente.', 'danger');
        }
    }

    showBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.style.display = 'block';
            setTimeout(() => {
                banner.classList.add('show');
            }, 100);
        }
    }

    hideBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.style.display = 'none';
            }, 300);
        }
    }

    showConfirmation(preferences) {
        const message = preferences.analytics ? 
            'Preferências de cookies salvas com sucesso!' :
            'Cookies essenciais ativados. Sua privacidade é importante para nós.';
        
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.alert.position-fixed');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    applyPreferences(preferences) {
        if (preferences.analytics) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }

        if (preferences.personalization) {
            this.enablePersonalization();
        } else {
            this.disablePersonalization();
        }
    }

    enableAnalytics() {
        console.log('📊 Analytics ativado');
        // Implementar Google Analytics ou similar
    }

    disableAnalytics() {
        console.log('📊 Analytics desativado');
        // Desativar Google Analytics
    }

    enablePersonalization() {
        console.log('🎨 Personalização ativada');
    }

    disablePersonalization() {
        console.log('🎨 Personalização desativada');
    }

    acceptAll() {
        this.saveCookiePreferences({
            essential: true,
            analytics: true,
            personalization: true,
            marketing: false
        });
    }

    acceptEssential() {
        this.saveCookiePreferences({
            essential: true,
            analytics: false,
            personalization: false,
            marketing: false
        });
    }

    customPreferences(analytics, personalization) {
        this.saveCookiePreferences({
            essential: true,
            analytics: analytics,
            personalization: personalization,
            marketing: false
        });
    }

    isAccepted() {
        const prefs = this.getCookiePreferences();
        return prefs !== null;
    }
}

// ========================================
// CLASSE CARROSSEL DE PLANOS (CORRIGIDA)
// ========================================

class CarrosselPlanos {
    constructor() {
        this.container = document.querySelector('.carrossel-planos-container');
        if (!this.container) return;
        
        this.carrossel = this.container.querySelector('.carrossel-planos');
        this.items = this.container.querySelectorAll('.carrossel-item');
        this.btnAnterior = this.container.querySelector('.carrossel-anterior');
        this.btnProximo = this.container.querySelector('.carrossel-proximo');
        this.indicadoresContainer = this.container.querySelector('.carrossel-indicadores');
        
        this.indiceAtual = 0;
        this.totalSlides = this.items.length;
        
        if (this.totalSlides === 0) return;
        
        this.init();
    }
    
    init() {
        // Configurar largura do carrossel
        this.carrossel.style.width = `${this.totalSlides * 100}%`;
        
        // Configurar largura dos itens
        this.items.forEach(item => {
            item.style.width = `${100 / this.totalSlides}%`;
        });
        
        // Criar indicadores
        this.criarIndicadores();
        
        // Adicionar eventos
        this.adicionarEventos();
        
        // Atualizar exibição inicial
        this.atualizarCarrossel();
    }
    
    criarIndicadores() {
        // Limpar indicadores existentes
        if (this.indicadoresContainer) {
            this.indicadoresContainer.innerHTML = '';
            
            // Criar um indicador para cada slide
            for (let i = 0; i < this.totalSlides; i++) {
                const indicador = document.createElement('button');
                indicador.className = 'carrossel-indicador';
                indicador.setAttribute('aria-label', `Ir para slide ${i + 1}`);
                indicador.setAttribute('data-indice', i);
                
                indicador.addEventListener('click', () => {
                    this.irParaSlide(i);
                });
                
                this.indicadoresContainer.appendChild(indicador);
            }
            
            this.indicadores = this.indicadoresContainer.querySelectorAll('.carrossel-indicador');
        }
    }
    
    adicionarEventos() {
        // Botão anterior
        if (this.btnAnterior) {
            this.btnAnterior.addEventListener('click', () => {
                this.slideAnterior();
            });
        }
        
        // Botão próximo
        if (this.btnProximo) {
            this.btnProximo.addEventListener('click', () => {
                this.slideProximo();
            });
        }
        
        // Navegação por teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.slideAnterior();
            } else if (e.key === 'ArrowRight') {
                this.slideProximo();
            }
        });
        
        // Suporte a toque (mobile)
        let startX = 0;
        let endX = 0;
        
        this.carrossel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        this.carrossel.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            this.handleSwipe(startX, endX);
        }, { passive: true });
    }
    
    slideAnterior() {
        this.indiceAtual = (this.indiceAtual - 1 + this.totalSlides) % this.totalSlides;
        this.atualizarCarrossel();
    }
    
    slideProximo() {
        this.indiceAtual = (this.indiceAtual + 1) % this.totalSlides;
        this.atualizarCarrossel();
    }
    
    irParaSlide(indice) {
        this.indiceAtual = indice;
        this.atualizarCarrossel();
    }
    
    handleSwipe(startX, endX) {
        const threshold = 50; // pixels mínimos para considerar um swipe
        
        if (startX - endX > threshold) {
            // Swipe para esquerda = próximo
            this.slideProximo();
        } else if (endX - startX > threshold) {
            // Swipe para direita = anterior
            this.slideAnterior();
        }
    }
    
    atualizarCarrossel() {
        // Calcular deslocamento
        const offset = -this.indiceAtual * (100 / this.totalSlides);
        this.carrossel.style.transform = `translateX(${offset}%)`;
        
        // Atualizar indicadores
        if (this.indicadores) {
            this.indicadores.forEach((indicador, index) => {
                if (index === this.indiceAtual) {
                    indicador.classList.add('ativo');
                    indicador.setAttribute('aria-current', 'true');
                } else {
                    indicador.classList.remove('ativo');
                    indicador.removeAttribute('aria-current');
                }
            });
        }
        
        // Atualizar atributos ARIA
        this.items.forEach((item, index) => {
            if (index === this.indiceAtual) {
                item.setAttribute('aria-hidden', 'false');
            } else {
                item.setAttribute('aria-hidden', 'true');
            }
        });
        
        // Atualizar estado dos botões
        if (this.btnAnterior) {
            this.btnAnterior.disabled = this.indiceAtual === 0;
        }
        
        if (this.btnProximo) {
            this.btnProximo.disabled = this.indiceAtual === this.totalSlides - 1;
        }
    }
    
    // Método para auto-play (opcional)
    iniciarAutoPlay(intervalo = 5000) {
        this.autoPlayInterval = setInterval(() => {
            this.slideProximo();
        }, intervalo);
        
        // Pausar auto-play quando hover
        this.container.addEventListener('mouseenter', () => {
            clearInterval(this.autoPlayInterval);
        });
        
        this.container.addEventListener('mouseleave', () => {
            this.iniciarAutoPlay(intervalo);
        });
    }
    
    // Método para destruir (limpeza)
    destroy() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
        
        // Remover event listeners
        if (this.btnAnterior) {
            const newBtnAnterior = this.btnAnterior.cloneNode(true);
            this.btnAnterior.parentNode.replaceChild(newBtnAnterior, this.btnAnterior);
        }
        
        if (this.btnProximo) {
            const newBtnProximo = this.btnProximo.cloneNode(true);
            this.btnProximo.parentNode.replaceChild(newBtnProximo, this.btnProximo);
        }
    }
}

// ========================================
// INICIALIZAÇÃO CORRIGIDA
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NetFyber - Inicializando sistema...');
    
    try {
        initEssentialSystems();
        initPageSpecificComponents();
        console.log('✅ NetFyber - Sistema inicializado com sucesso!');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
});

function initEssentialSystems() {
    // Inicializar Cookie Manager
    window.cookieManager = new CookieManager();
    
    // Inicializar componentes
    initSmoothScroll();
    initBootstrapTooltips();
    initScrollAnimations();
    initFormValidations();
    initCopyButtons();
}

function initPageSpecificComponents() {
    const path = window.location.pathname;
    
    // Inicializar carrossel de planos se estiver na página de planos
    if (path.includes('/planos') || path === '/') {
        initPlanosCarousel();
    }
    
    // Inicializar filtros do blog se estiver na página do blog
    if (path.includes('/blog')) {
        initBlogFilters();
    }
}

// ========================================
// COMPONENTES ESSENCIAIS
// ========================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Atualizar URL sem recarregar a página
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            }
        });
    });
}

function initBootstrapTooltips() {
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    } else {
        console.warn('Bootstrap não encontrado. Tooltips não inicializados.');
    }
}

function initScrollAnimations() {
    // Verificar se o IntersectionObserver está disponível
    if (!('IntersectionObserver' in window)) {
        // Fallback: mostrar todos os elementos
        document.querySelectorAll('.feature-card, .plan-card, .blog-post-item, .guia-card').forEach(el => {
            el.classList.add('fade-in-up');
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    const elementsToAnimate = document.querySelectorAll('.feature-card, .plan-card, .blog-post-item, .guia-card');
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });
}

function initFormValidations() {
    document.querySelectorAll('form').forEach(form => {
        // Limpar validação ao digitar
        form.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('is-invalid');
                const errorDiv = this.nextElementSibling;
                if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
                    errorDiv.remove();
                }
            });
        });
        
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                const firstInvalid = this.querySelector('.is-invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                    firstInvalid.focus();
                }
            }
        });
    });
}

function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
            
            if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('invalid-feedback')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                errorDiv.textContent = 'Este campo é obrigatório.';
                input.parentNode.appendChild(errorDiv);
            }
        } else {
            input.classList.remove('is-invalid');
            const errorDiv = input.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
                errorDiv.remove();
            }
        }
    });
    
    return isValid;
}

function initCopyButtons() {
    document.querySelectorAll('[data-copy-text]').forEach(button => {
        button.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-copy-text');
            
            // Usar a API Clipboard moderna
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(textToCopy)
                    .then(() => {
                        showCopyFeedback(this, 'Copiado!');
                    })
                    .catch(err => {
                        console.error('Erro ao copiar:', err);
                        showCopyFeedback(this, 'Erro ao copiar', false);
                    });
            } else {
                // Fallback para método antigo
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    showCopyFeedback(this, 'Copiado!');
                } catch (err) {
                    console.error('Fallback: Erro ao copiar texto:', err);
                    showCopyFeedback(this, 'Erro ao copiar', false);
                }
                
                document.body.removeChild(textArea);
            }
        });
    });
    
    function showCopyFeedback(button, message, success = true) {
        const originalHTML = button.innerHTML;
        const originalBg = button.style.backgroundColor;
        
        button.innerHTML = `<i class="bi bi-${success ? 'check' : 'x'}-circle me-2"></i>${message}`;
        button.style.backgroundColor = success ? '#28a745' : '#dc3545';
        button.disabled = true;
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.backgroundColor = originalBg;
            button.disabled = false;
        }, 2000);
    }
}

// ========================================
// CARROSSEL DE PLANOS
// ========================================

function initPlanosCarousel() {
    const carrosselContainer = document.querySelector('.carrossel-planos-container');
    if (!carrosselContainer) return;
    
    try {
        window.planosCarousel = new CarrosselPlanos();
        console.log('✅ Carrossel de planos inicializado');
        
        // Iniciar auto-play após 3 segundos (opcional)
        setTimeout(() => {
            if (window.planosCarousel) {
                window.planosCarousel.iniciarAutoPlay(5000);
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ Erro ao inicializar carrossel:', error);
        
        // Fallback básico se o carrossel falhar
        setupSimpleCarouselFallback(carrosselContainer);
    }
}

function setupSimpleCarouselFallback(container) {
    console.log('⚠️ Usando fallback simples para carrossel');
    
    const items = container.querySelectorAll('.carrossel-item');
    const btnAnterior = container.querySelector('.carrossel-anterior');
    const btnProximo = container.querySelector('.carrossel-proximo');
    
    let currentIndex = 0;
    
    function showSlide(index) {
        items.forEach((item, i) => {
            item.style.display = i === index ? 'block' : 'none';
        });
        
        // Atualizar indicadores
        const indicadores = container.querySelectorAll('.carrossel-indicador');
        indicadores.forEach((indicador, i) => {
            indicador.classList.toggle('ativo', i === index);
        });
    }
    
    if (btnAnterior) {
        btnAnterior.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            showSlide(currentIndex);
        });
    }
    
    if (btnProximo) {
        btnProximo.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % items.length;
            showSlide(currentIndex);
        });
    }
    
    // Mostrar primeiro slide
    showSlide(0);
}

// ========================================
// FILTROS DO BLOG
// ========================================

function initBlogFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const blogPosts = document.querySelectorAll('.blog-post-item');
    const filterCount = document.getElementById('filter-count');

    if (filterButtons.length === 0 || blogPosts.length === 0) return;

    function updateFilterCount(filter, count) {
        let message = '';
        
        switch(filter) {
            case 'all':
                message = `Mostrando todos os ${count} posts`;
                break;
            case 'tecnologia':
                message = `${count} post${count !== 1 ? 's' : ''} de tecnologia`;
                break;
            case 'noticias':
                message = `${count} post${count !== 1 ? 's' : ''} de notícias`;
                break;
        }
        
        if (filterCount) {
            filterCount.textContent = message;
        }
    }

    function filterPosts(filterValue) {
        let visibleCount = 0;
        
        blogPosts.forEach(post => {
            const postCategory = post.getAttribute('data-category');
            const shouldShow = filterValue === 'all' || postCategory === filterValue;
            
            if (shouldShow) {
                post.classList.remove('hidden');
                visibleCount++;
                
                // Animar entrada
                post.style.opacity = '0';
                post.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    post.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    post.style.opacity = '1';
                    post.style.transform = 'translateY(0)';
                }, 10);
            } else {
                post.classList.add('hidden');
            }
        });
        
        updateFilterCount(filterValue, visibleCount);
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => {
                btn.classList.remove('active', 'btn-primary');
                btn.classList.add('btn-outline-primary');
            });
            
            this.classList.remove('btn-outline-primary');
            this.classList.add('active', 'btn-primary');
            
            const filterValue = this.getAttribute('data-filter');
            filterPosts(filterValue);
            
            // Rolar para o topo dos resultados
            const postsContainer = document.getElementById('posts-container');
            if (postsContainer) {
                postsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    updateFilterCount('all', blogPosts.length);
}

// ========================================
// DETECÇÃO DE DISPOSITIVO E OTIMIZAÇÕES
// ========================================

function detectDeviceAndOptimize() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent);
    
    if (isMobile) {
        document.body.classList.add('is-mobile');
        
        // Otimizações para mobile
        document.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
        });
    }
    
    if (isTablet) {
        document.body.classList.add('is-tablet');
    }
    
    // Detectar conexão lenta
    if (navigator.connection && navigator.connection.effectiveType) {
        const connection = navigator.connection.effectiveType;
        if (connection === 'slow-2g' || connection === '2g') {
            document.body.classList.add('slow-connection');
            
            // Desativar animações para conexões lentas
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// ========================================
// MONITORAMENTO DE PERFORMANCE
// ========================================

function initPerformanceMonitoring() {
    // Verificar se a API Performance está disponível
    if ('performance' in window && 'getEntriesByType' in performance) {
        // Registrar métricas de tempo de carregamento
        window.addEventListener('load', () => {
            const timing = performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
            
            console.log(`⏱️ Tempo de carregamento total: ${loadTime}ms`);
            console.log(`⏱️ DOM pronto em: ${domReadyTime}ms`);
            
            // Enviar métricas para analytics (se configurado)
            if (window.cookieManager && window.cookieManager.getCookiePreferences()?.analytics) {
                // Aqui você enviaria as métricas para seu serviço de analytics
            }
        });
    }
    
    // Monitorar erros de recursos
    window.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK') {
            console.warn(`⚠️ Erro ao carregar recurso: ${e.target.src || e.target.href}`);
            
            // Substituir imagens quebradas
            if (e.target.tagName === 'IMG') {
                e.target.onerror = null; // Prevenir loop
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGNUY1RjUiLz48cGF0aCBkPSJNNjUgMzVINDFDNDAgMzUgMzkgMzYgMzkgMzdWNDFDMzkgNDIgNDAgNDMgNDEgNDNINjVDNjYgNDMgNjcgNDIgNjcgNDFWMzdDNjcgMzYgNjYgMzUgNjUgMzVaTTY3IDU3VjUzQzY3IDUyIDY2IDUxIDY1IDUxSDQxQzQwIDUxIDM5IDUyIDM5IDUzVjU3QzM5IDU4IDQwIDU5IDQxIDU5SDY1QzY2IDU5IDY3IDU4IDY3IDU3WiIgZmlsbD0iI0Q4RDhEOCIvPjxwYXRoIGQ9Ik01MCAzMEMzOC4wNzQgMzAgMjguNSAzOS41NzQgMjguNSA1MS41QzI4LjUgNjMuNDI2IDM4LjA3NCA3MyA1MCA3M0M2MS45MjYgNzMgNzEuNSA2My40MjYgNzEuNSA1MS41QzcxLjUgMzkuNTc0IDYxLjkyNiAzMCA1MCAzMFpNNTAgNjVDNDAuMzM2IDY1IDMyLjUgNTcuMTY0IDMyLjUgNDcuNUMzMi41IDM3LjgzNiA0MC4zMzYgMzAgNTAgMzBDNTkuNjY0IDMwIDY3LjUgMzcuODM2IDY3LjUgNDcuNUM2Ny41IDU3LjE2NCA1OS42NjQgNjUgNTAgNjVaIiBmaWxsPSIjRDhEOEQ4Ii8+PC9zdmc+';
            }
        }
    }, true);
}

// ========================================
// EXPORTAR FUNÇÕES GLOBAIS
// ========================================

window.NetFyberUtils = {
    CookieManager,
    CarrosselPlanos,
    initBlogFilters,
    initPlanosCarousel
};

// ========================================
// INICIALIZAÇÃO FINAL
// ========================================

// Executar após o DOM estar completamente carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNetFyber);
} else {
    initializeNetFyber();
}

function initializeNetFyber() {
    // Detectar dispositivo e otimizar
    detectDeviceAndOptimize();
    
    // Inicializar monitoramento de performance
    initPerformanceMonitoring();
    
    // Ativar tooltips do Bootstrap
    initBootstrapTooltips();
    
    // Inicializar componentes da página atual
    initPageSpecificComponents();
    
    console.log('🚀 NetFyber - Sistema completamente inicializado');
}

// ========================================
// HANDLING DE ERROS GLOBAL
// ========================================

window.addEventListener('error', function(e) {
    console.error('❌ Erro global capturado:', e.error);
    
    // Não mostrar erros internos do navegador ao usuário
    if (e.error && e.error.message && e.error.message.includes('ResizeObserver')) {
        return;
    }
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promise rejeitada não tratada:', e.reason);
    e.preventDefault();
});

// ========================================
// POLYFILLS PARA COMPATIBILIDADE
// ========================================

// Polyfill para String.includes (IE)
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        'use strict';
        if (typeof start !== 'number') {
            start = 0;
        }
        
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

// Polyfill para Array.forEach (IE8+)
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {
        var T, k;
        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = thisArg;
        }
        k = 0;
        while (k < len) {
            var kValue;
            if (k in O) {
                kValue = O[k];
                callback.call(T, kValue, k, O);
            }
            k++;
        }
    };
}