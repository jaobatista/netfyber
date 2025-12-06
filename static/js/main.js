// ========================================
// CARROSSEL DE PLANOS - PROFISSIONAL E RESPONSIVO
// ========================================

class PlanosCarousel {
    constructor(containerSelector = '.carrossel-planos-container') {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;
        
        this.track = this.container.querySelector('.carrossel-track');
        this.items = Array.from(this.track.children);
        this.prevBtn = this.container.querySelector('.carrossel-anterior');
        this.nextBtn = this.container.querySelector('.carrossel-proximo');
        this.indicatorsContainer = this.container.querySelector('.carrossel-indicadores');
        this.indicators = [];
        
        this.currentIndex = 0;
        this.slidesPerView = this.getSlidesPerView();
        this.totalSlides = this.items.length;
        this.isAnimating = false;
        this.autoPlayInterval = null;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 50;
        
        this.init();
    }
    
    init() {
        if (this.totalSlides === 0) return;
        
        this.setupIndicators();
        this.setupEventListeners();
        this.updateCarousel();
        this.startAutoPlay();
        
        // Inicializar swipe
        this.track.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.track.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        console.log('🎯 Carrossel inicializado com', this.totalSlides, 'slides');
    }
    
    getSlidesPerView() {
        const width = window.innerWidth;
        if (width >= 992) return 3;  // Desktop
        if (width >= 768) return 2;  // Tablet
        return 1;                    // Mobile
    }
    
    setupIndicators() {
        if (!this.indicatorsContainer) return;
        
        this.indicatorsContainer.innerHTML = '';
        const indicatorCount = Math.ceil(this.totalSlides / this.slidesPerView);
        
        for (let i = 0; i < indicatorCount; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'carrossel-indicador';
            indicator.setAttribute('aria-label', `Ir para slide ${i + 1}`);
            indicator.addEventListener('click', () => this.goToSlide(i));
            
            this.indicatorsContainer.appendChild(indicator);
            this.indicators.push(indicator);
        }
        
        this.updateIndicators();
    }
    
    setupEventListeners() {
        // Botões de navegação
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prev());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.next());
        }
        
        // Navegação por teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prev();
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.next();
            }
        });
        
        // Redimensionamento da janela
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Pausar autoplay no hover
        this.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.container.addEventListener('mouseleave', () => this.startAutoPlay());
    }
    
    handleResize() {
        const newSlidesPerView = this.getSlidesPerView();
        
        if (newSlidesPerView !== this.slidesPerView) {
            this.slidesPerView = newSlidesPerView;
            this.setupIndicators();
            this.updateCarousel();
        }
    }
    
    updateCarousel() {
        const itemWidth = 100 / this.slidesPerView;
        const translateX = -this.currentIndex * itemWidth;
        
        this.track.style.transform = `translateX(${translateX}%)`;
        this.updateButtons();
        this.updateIndicators();
    }
    
    updateButtons() {
        const maxIndex = Math.max(0, this.totalSlides - this.slidesPerView);
        
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentIndex === 0;
        }
        
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentIndex >= maxIndex;
        }
    }
    
    updateIndicators() {
        const activeIndicator = Math.floor(this.currentIndex / this.slidesPerView);
        
        this.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === activeIndicator);
        });
    }
    
    next() {
        if (this.isAnimating) return;
        
        const maxIndex = Math.max(0, this.totalSlides - this.slidesPerView);
        
        if (this.currentIndex < maxIndex) {
            this.currentIndex++;
        } else {
            this.currentIndex = 0;
        }
        
        this.animateTransition();
    }
    
    prev() {
        if (this.isAnimating) return;
        
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            const maxIndex = Math.max(0, this.totalSlides - this.slidesPerView);
            this.currentIndex = maxIndex;
        }
        
        this.animateTransition();
    }
    
    goToSlide(slideIndex) {
        if (this.isAnimating || slideIndex < 0 || slideIndex >= this.indicators.length) return;
        
        this.currentIndex = slideIndex * this.slidesPerView;
        this.animateTransition();
    }
    
    animateTransition() {
        this.isAnimating = true;
        this.track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        setTimeout(() => {
            this.isAnimating = false;
            this.track.style.transition = '';
        }, 500);
        
        this.updateCarousel();
        this.restartAutoPlay();
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
    }
    
    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        const swipeDistance = this.touchStartX - this.touchEndX;
        
        if (Math.abs(swipeDistance) > this.minSwipeDistance) {
            if (swipeDistance > 0) {
                this.next();
            } else {
                this.prev();
            }
        }
    }
    
    startAutoPlay() {
        if (this.totalSlides > this.slidesPerView && !this.autoPlayInterval) {
            this.autoPlayInterval = setInterval(() => {
                this.next();
            }, 5000);
        }
    }
    
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    restartAutoPlay() {
        this.pauseAutoPlay();
        this.startAutoPlay();
    }
    
    destroy() {
        this.pauseAutoPlay();
        // Remover event listeners
        if (this.prevBtn) this.prevBtn.removeEventListener('click', () => this.prev());
        if (this.nextBtn) this.nextBtn.removeEventListener('click', () => this.next());
        document.removeEventListener('keydown', this.handleKeydown);
        window.removeEventListener('resize', this.handleResize);
    }
}

// ========================================
// SISTEMA DE COOKIES
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
            setTimeout(() => this.showBanner(), 1000);
        }
    }
    
    getCookiePreferences() {
        try {
            const cookie = localStorage.getItem(this.cookieName);
            return cookie ? JSON.parse(cookie) : null;
        } catch {
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
            this.hideBanner();
            this.showNotification('Preferências de cookies salvas!', 'success');
        } catch {
            this.showNotification('Erro ao salvar preferências', 'danger');
        }
    }
    
    showBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.style.display = 'block';
            setTimeout(() => banner.classList.add('show'), 100);
        }
    }
    
    hideBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.style.display = 'none', 300);
        }
    }
    
    showNotification(message, type) {
        // Implementar notificação se necessário
        console.log(`${type}: ${message}`);
    }
}

// ========================================
// SISTEMA DE GEOLOCALIZAÇÃO
// ========================================

class GeolocationManager {
    constructor() {
        this.cacheKey = 'netfyber_location';
        this.cacheDuration = 5 * 60 * 1000; // 5 minutos
        this.init();
    }
    
    async init() {
        const cachedLocation = this.getCachedLocation();
        if (cachedLocation) {
            this.updateLocationDisplay(cachedLocation);
        }
    }
    
    async getLocation() {
        if (!navigator.geolocation) {
            return this.showLocationError('Geolocalização não suportada');
        }
        
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const location = await this.reverseGeocode(
                            position.coords.latitude,
                            position.coords.longitude
                        );
                        
                        this.cacheLocation(location);
                        this.updateLocationDisplay(location);
                        resolve(location);
                    } catch (error) {
                        reject(error);
                    }
                },
                (error) => {
                    this.showLocationError(this.getErrorMessage(error));
                    reject(error);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: this.cacheDuration
                }
            );
        });
    }
    
    async reverseGeocode(lat, lon) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=pt-BR`
            );
            
            if (!response.ok) throw new Error('Erro na requisição');
            
            const data = await response.json();
            return {
                city: data.address.city || data.address.town || data.address.village || 'Cidade',
                state: data.address.state || 'Estado',
                displayName: data.display_name || ''
            };
        } catch {
            return {
                city: `Lat: ${lat.toFixed(4)}`,
                state: `Lon: ${lon.toFixed(4)}`,
                displayName: ''
            };
        }
    }
    
    getErrorMessage(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                return 'Permissão de localização negada';
            case error.POSITION_UNAVAILABLE:
                return 'Localização indisponível';
            case error.TIMEOUT:
                return 'Tempo esgotado';
            default:
                return 'Erro desconhecido';
        }
    }
    
    cacheLocation(location) {
        try {
            const cacheData = {
                ...location,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch {
            // Ignora erros de cache
        }
    }
    
    getCachedLocation() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const location = JSON.parse(cached);
                if (Date.now() - location.timestamp < this.cacheDuration) {
                    return location;
                }
            }
        } catch {
            return null;
        }
        return null;
    }
    
    updateLocationDisplay(location) {
        const element = document.getElementById('user-location');
        if (element && location) {
            element.textContent = `${location.city} - ${location.state}`;
            element.classList.remove('text-muted');
        }
    }
    
    showLocationError(message) {
        const element = document.getElementById('user-location');
        if (element) {
            element.textContent = message;
            element.classList.add('text-danger');
        }
    }
}

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

// Scroll suave
function smoothScroll(target, duration = 800) {
    const targetElement = document.querySelector(target);
    if (!targetElement) return;
    
    const targetPosition = targetElement.offsetTop - 80;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;
    
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const easeProgress = easeOutCubic(progress);
        
        window.scrollTo(0, startPosition + distance * easeProgress);
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    }
    
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    requestAnimationFrame(animation);
}

// Inicializar tooltips do Bootstrap
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(element => {
        new bootstrap.Tooltip(element);
    });
}

// Inicializar animações de scroll
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    document.querySelectorAll('.feature-card, .plan-card, .guia-card').forEach(el => {
        observer.observe(el);
    });
}

// ========================================
// INICIALIZAÇÃO DA PÁGINA
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NetFyber - Sistema inicializando...');
    
    try {
        // Inicializar sistemas essenciais
        initEssentialSystems();
        
        // Inicializar componentes específicos da página
        initPageComponents();
        
        console.log('✅ Sistema inicializado com sucesso!');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
});

function initEssentialSystems() {
    // Cookies
    window.cookieManager = new CookieManager();
    
    // Geolocalização
    window.geolocationManager = new GeolocationManager();
    
    // Tooltips
    initTooltips();
    
    // Animações
    initScrollAnimations();
    
    // Scroll suave para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                smoothScroll(href);
            }
        });
    });
}

function initPageComponents() {
    // Carrossel de planos (se estiver na página de planos)
    if (document.querySelector('.carrossel-planos-container')) {
        window.planosCarousel = new PlanosCarousel();
    }
    
    // Geolocalização automática
    setTimeout(() => {
        if (window.geolocationManager && !window.geolocationManager.getCachedLocation()) {
            window.geolocationManager.getLocation().catch(() => {
                // Ignora erros silenciosamente
            });
        }
    }, 2000);
}

// ========================================
// FUNÇÕES GLOBAIS PARA TEMPLATES
// ========================================

window.NetFyber = {
    smoothScroll,
    showNotification: (message, type = 'info') => {
        console.log(`${type}: ${message}`);
    },
    aceitarCookies: () => {
        if (window.cookieManager) {
            window.cookieManager.saveCookiePreferences({
                essential: true,
                analytics: true,
                personalization: true
            });
        }
    },
    configurarCookies: () => {
        const modal = new bootstrap.Modal(document.getElementById('cookieSettingsModal'));
        modal.show();
    },
    obterLocalizacao: () => {
        if (window.geolocationManager) {
            window.geolocationManager.getLocation();
        }
    }
};

// ========================================
// ERROR HANDLING
// ========================================

window.addEventListener('error', function(e) {
    console.error('Erro capturado:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rejeitada:', e.reason);
});