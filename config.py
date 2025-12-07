import os

class Config:
    """Configurações base da aplicação"""
    
    # Configurações básicas do Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://postgres:102030@localhost/testenet1')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configurações de segurança
    ADMIN_URL_PREFIX = os.environ.get('ADMIN_URL_PREFIX', '/gestao-exclusiva-netfyber')
    
    # Configurações do Flask-Login
    REMEMBER_COOKIE_DURATION = 86400  # 1 dia em segundos
    SESSION_PROTECTION = 'strong'
    
    # Configurações de upload
    UPLOAD_FOLDER = os.path.join('static', 'uploads', 'blog')
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8MB

class ProductionConfig(Config):
    """Configurações para ambiente de produção"""
    DEBUG = False
    TESTING = False
    
    # Segurança reforçada em produção
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY deve ser definida em produção")
    
    # Em produção, use sempre HTTPS
    PREFERRED_URL_SCHEME = 'https'

class DevelopmentConfig(Config):
    """Configurações para ambiente de desenvolvimento"""
    DEBUG = True
    TESTING = False
    TEMPLATES_AUTO_RELOAD = True

class TestingConfig(Config):
    """Configurações para ambiente de testes"""
    DEBUG = False
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

# Configuração padrão
config = {
    'production': ProductionConfig,
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Retorna a configuração baseada na variável de ambiente FLASK_ENV"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])