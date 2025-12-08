import os

class Config:
    """Configurações base da aplicação"""
    
    # Configurações básicas do Flask
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configurações de segurança
    ADMIN_URL_PREFIX = os.environ.get('ADMIN_URL_PREFIX', '/gestao-exclusiva-netfyber')
    
    # Configurações do Flask-Login
    REMEMBER_COOKIE_DURATION = 86400  # 1 dia em segundos
    SESSION_PROTECTION = 'strong'
    
    # Configurações de upload
    UPLOAD_FOLDER = os.path.join('static', 'uploads', 'blog')
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8MB
    
    @classmethod
    def validate(cls):
        """Valida configurações críticas"""
        if not cls.SECRET_KEY:
            raise ValueError("SECRET_KEY não configurada")
        if not cls.SQLALCHEMY_DATABASE_URI:
            raise ValueError("DATABASE_URL não configurada")

class ProductionConfig(Config):
    """Configurações para ambiente de produção"""
    DEBUG = False
    TESTING = False
    
    def __init__(self):
        self.validate()
        # Em produção, use sempre HTTPS
        self.PREFERRED_URL_SCHEME = 'https'

class DevelopmentConfig(Config):
    """Configurações para ambiente de desenvolvimento"""
    DEBUG = True
    TESTING = False
    TEMPLATES_AUTO_RELOAD = True
    
    def __init__(self):
        # Em desenvolvimento, gerar SECRET_KEY se não existir
        if not self.SECRET_KEY:
            import secrets
            self.SECRET_KEY = secrets.token_hex(32)
        if not self.SQLALCHEMY_DATABASE_URI:
            self.SQLALCHEMY_DATABASE_URI = 'sqlite:///netfyber.db'

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
    config_class = config.get(env, config['default'])
    return config_class()