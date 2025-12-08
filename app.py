import os
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import uuid
import bleach
from bleach.sanitizer import Cleaner
import re
from urllib.parse import urlparse
import secrets

# ========================================
# CONFIGURAÇÃO DA APLICAÇÃO
# ========================================

app = Flask(__name__)

# Configurações críticas - DEVEM vir de variáveis de ambiente
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
if not app.config['SECRET_KEY']:
    if os.environ.get('FLASK_ENV') == 'production':
        raise ValueError("SECRET_KEY deve ser definida em produção")
    else:
        app.config['SECRET_KEY'] = secrets.token_hex(32)

# Configuração do banco de dados
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    if os.environ.get('FLASK_ENV') == 'production':
        raise ValueError("DATABASE_URL deve ser definida em produção")
    else:
        DATABASE_URL = 'sqlite:///netfyber.db'

# Corrigir formato para SQLAlchemy
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configurações de segurança
ADMIN_URL_PREFIX = os.environ.get('ADMIN_URL_PREFIX', '/gestao-exclusiva-netfyber')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=2)

# Configuração de upload
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads', 'blog')
app.config['MAX_CONTENT_LENGTH'] = 8 * 1024 * 1024  # 8MB

# Whitelist de IPs para admin (opcional, remover para produção pública)
ADMIN_IPS = os.environ.get('ADMIN_IPS', '').split(',') if os.environ.get('ADMIN_IPS') else []

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

db = SQLAlchemy(app)

# ========================================
# SISTEMA DE AUTENTICAÇÃO
# ========================================

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'admin_login'
login_manager.login_message = "Por favor, faça login para acessar esta página."
login_manager.login_message_category = "warning"
login_manager.session_protection = "strong"

# Headers de segurança
@app.after_request
def set_security_headers(response):
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    if os.environ.get('FLASK_ENV') == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# ========================================
# UTILITÁRIOS DE SEGURANÇA
# ========================================

def validate_filename(filename):
    """Validação rigorosa de nomes de arquivo"""
    if not filename or filename.strip() != filename:
        return False
    
    filename = secure_filename(filename)
    if '..' in filename or filename.startswith('.') or '/' in filename:
        return False
    
    return True

def sanitize_html(content):
    """Sanitização segura de HTML"""
    if not content:
        return ""
    
    # Processar markdown primeiro
    html_content = process_markdown(content)
    
    # Tags permitidas
    allowed_tags = [
        'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a',
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'img', 'span', 'div', 'table', 'tr', 'td', 'th'
    ]
    
    # Atributos permitidos
    allowed_attributes = {
        'a': ['href', 'target', 'rel', 'title', 'class'],
        'img': ['src', 'alt', 'title', 'width', 'height', 'class', 'style'],
        '*': ['class', 'id', 'style']
    }
    
    # Sanitizar
    sanitized = bleach.clean(
        html_content,
        tags=allowed_tags,
        attributes=allowed_attributes,
        strip=True,
        strip_comments=True
    )
    
    # Garantir que links externos tenham target="_blank" e rel="noopener noreferrer"
    def add_link_attributes(attrs, new):
        href = attrs.get((None, 'href'), '')
        if href and href.startswith(('http://', 'https://')):
            attrs[(None, 'target')] = '_blank'
            if (None, 'rel') in attrs:
                attrs[(None, 'rel')] = attrs[(None, 'rel')] + ' noopener noreferrer'
            else:
                attrs[(None, 'rel')] = 'noopener noreferrer'
        return attrs
    
    sanitized = bleach.linkify(sanitized, callbacks=[add_link_attributes])
    
    return sanitized

def process_markdown(content):
    """Processa formatação estilo markdown"""
    if not content:
        return ""
    
    lines = content.split('\n')
    processed_lines = []
    in_list = False
    
    for line in lines:
        line = line.rstrip()
        
        if not line:
            if in_list:
                processed_lines.append('</ul>')
                in_list = False
            processed_lines.append('<br>')
            continue
        
        # Processar listas
        if line.strip().startswith('- ') or line.strip().startswith('* '):
            if not in_list:
                processed_lines.append('<ul>')
                in_list = True
            list_item = line.strip()[2:].strip()
            list_item = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', list_item)
            processed_lines.append(f'<li>{list_item}</li>')
            continue
        else:
            if in_list:
                processed_lines.append('</ul>')
                in_list = False
        
        # Processar títulos
        if line.strip().startswith('### '):
            title = line.strip()[4:].strip()
            processed_lines.append(f'<h3>{title}</h3>')
        elif line.strip().startswith('## '):
            title = line.strip()[3:].strip()
            processed_lines.append(f'<h2>{title}</h2>')
        elif line.strip().startswith('# '):
            title = line.strip()[2:].strip()
            processed_lines.append(f'<h1>{title}</h1>')
        else:
            line = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', line)
            processed_lines.append(line + '<br>')
    
    if in_list:
        processed_lines.append('</ul>')
    
    return '\n'.join(processed_lines)

def validate_url(url):
    """Validação segura de URLs"""
    try:
        result = urlparse(url)
        if result.scheme not in ('http', 'https'):
            return False
        if not result.netloc:
            return False
        return True
    except Exception:
        return False

def allowed_file(filename):
    """Verifica se o arquivo tem uma extensão permitida"""
    if not filename:
        return False
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ========================================
# MODELOS DO BANCO DE DADOS
# ========================================

class AdminUser(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(512), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password):
        """Hash seguro da senha"""
        if len(password) < 8:
            raise ValueError("Senha deve ter pelo menos 8 caracteres")
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifica senha com proteção contra força bruta"""
        if self.locked_until and datetime.utcnow() < self.locked_until:
            raise ValueError("Conta temporariamente bloqueada. Tente novamente mais tarde.")
        
        is_correct = check_password_hash(self.password_hash, password)
        
        if is_correct:
            self.login_attempts = 0
            self.locked_until = None
            self.last_login = datetime.utcnow()
        else:
            self.login_attempts += 1
            if self.login_attempts >= 5:
                self.locked_until = datetime.utcnow() + timedelta(minutes=30)
        
        db.session.commit()
        return is_correct

class Plano(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    preco = db.Column(db.String(20), nullable=False)
    velocidade = db.Column(db.String(50))
    features = db.Column(db.Text, nullable=False)
    recomendado = db.Column(db.Boolean, default=False)
    ordem_exibicao = db.Column(db.Integer, default=0)
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def get_features_list(self):
        """Retorna lista de features sanitizada"""
        if not self.features:
            return []
        return [bleach.clean(f.strip()) for f in self.features.split('\n') if f.strip()]

class Configuracao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chave = db.Column(db.String(100), unique=True, nullable=False)
    valor = db.Column(db.Text, nullable=False)
    descricao = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def get_valor(chave, default=None):
        config = Configuracao.query.filter_by(chave=chave).first()
        return bleach.clean(config.valor) if config else default

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    conteudo = db.Column(db.Text, nullable=False)
    resumo = db.Column(db.Text, nullable=False)
    categoria = db.Column(db.String(50), nullable=False)
    imagem = db.Column(db.String(200), default='default.jpg')
    link_materia = db.Column(db.String(500), nullable=False)
    data_publicacao = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_conteudo_html(self):
        """Retorna o conteúdo sanitizado em HTML seguro"""
        try:
            if not self.conteudo:
                return "<p>Conteúdo não disponível.</p>"
            return sanitize_html(self.conteudo)
        except Exception:
            return f"<div style='white-space: pre-line;'>{bleach.clean(self.conteudo or '')}</div>"

    def get_data_formatada(self):
        if self.data_publicacao:
            return self.data_publicacao.strftime('%d/%m/%Y')
        return "Data não disponível"

    def get_imagem_url(self):
        if self.imagem and self.imagem != 'default.jpg':
            safe_filename = secure_filename(self.imagem)
            return f"/static/uploads/blog/{safe_filename}"
        return "/static/images/blog/default.jpg"

@login_manager.user_loader
def load_user(user_id):
    return AdminUser.query.get(int(user_id))

# ========================================
# MIDDLEWARE DE SEGURANÇA
# ========================================

@app.before_request
def restrict_admin_access():
    """Restrição de IP para área administrativa (opcional)"""
    if ADMIN_IPS and request.path.startswith(ADMIN_URL_PREFIX):
        client_ip = request.remote_addr
        if client_ip not in ADMIN_IPS:
            print(f"Tentativa de acesso não autorizado de IP: {client_ip}")
            abort(403, description="Acesso não autorizado")

# ========================================
# FUNÇÕES DE ARQUIVO SEGURAS
# ========================================

def save_uploaded_file(file):
    """Salvamento seguro de arquivos"""
    if not file or file.filename == '':
        return None
    
    if not allowed_file(file.filename):
        return None
    
    try:
        filename = f"{uuid.uuid4().hex}.{file.filename.rsplit('.', 1)[1].lower()}"
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            return filename
    except Exception as e:
        print(f"Erro ao salvar arquivo: {e}")
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
    
    return None

def delete_uploaded_file(filename):
    """Exclusão segura de arquivos"""
    if not filename or filename == 'default.jpg':
        return False
    
    try:
        safe_filename = secure_filename(filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
        
        if not os.path.abspath(file_path).startswith(os.path.abspath(app.config['UPLOAD_FOLDER'])):
            return False
            
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception:
        return False
    
    return False

# ========================================
# ROTAS PÚBLICAS
# ========================================

@app.route('/')
def index():
    return render_template('public/index.html', configs=get_configs())

@app.route('/planos')
def planos():
    try:
        planos_data = Plano.query.filter_by(ativo=True).order_by(Plano.ordem_exibicao).all()
        planos_formatados = []
        for plano in planos_data:
            planos_formatados.append({
                'nome': bleach.clean(plano.nome),
                'preco': bleach.clean(plano.preco),
                'features': [bleach.clean(f) for f in plano.get_features_list()],
                'recomendado': plano.recomendado
            })
        return render_template('public/planos.html', planos=planos_formatados, configs=get_configs())
    except Exception as e:
        print(f"Erro na rota /planos: {e}")
        return render_template('public/planos.html', planos=[], configs=get_configs())

@app.route('/blog')
def blog():
    try:
        posts = Post.query.filter_by(ativo=True).order_by(Post.data_publicacao.desc()).all()
        return render_template('public/blog.html', configs=get_configs(), posts=posts)
    except Exception:
        return render_template('public/blog.html', configs=get_configs(), posts=[])

@app.route('/velocimetro')
def velocimetro():
    return render_template('public/velocimetro.html', configs=get_configs())

@app.route('/sobre')
def sobre():
    return render_template('public/sobre.html', configs=get_configs())

# ========================================
# AUTENTICAÇÃO
# ========================================

@app.route(f'{ADMIN_URL_PREFIX}/login', methods=['GET', 'POST'])
def admin_login():
    if current_user.is_authenticated:
        return redirect(url_for('admin_planos'))
    
    if request.method == 'POST':
        username = bleach.clean(request.form.get('username', '').strip())
        password = request.form.get('password', '')
        
        if not username or not password:
            flash('Credenciais inválidas.', 'error')
            return render_template('auth/login.html')
        
        user = AdminUser.query.filter_by(username=username, is_active=True).first()
        
        if user:
            try:
                if user.check_password(password):
                    login_user(user, remember=False)
                    flash('Login realizado com sucesso!', 'success')
                    return redirect(url_for('admin_planos'))
                else:
                    flash('Usuário ou senha inválidos.', 'error')
            except ValueError as e:
                flash(str(e), 'error')
        else:
            # Timing constante para evitar timing attacks
            check_password_hash(generate_password_hash('dummy'), 'dummy_password')
            flash('Usuário ou senha inválidos.', 'error')
    
    return render_template('auth/login.html')

@app.route(f'{ADMIN_URL_PREFIX}/logout')
@login_required
def admin_logout():
    logout_user()
    flash('Você saiu da sua conta.', 'info')
    return redirect(url_for('admin_login'))

# ========================================
# ROTAS ADMINISTRATIVAS - BLOG
# ========================================

@app.route(f'{ADMIN_URL_PREFIX}/blog')
@login_required
def admin_blog():
    posts = Post.query.filter_by(ativo=True).order_by(Post.data_publicacao.desc()).all()
    return render_template('admin/blog.html', posts=posts)

@app.route(f'{ADMIN_URL_PREFIX}/blog/adicionar', methods=['GET', 'POST'])
@login_required
def adicionar_post():
    if request.method == 'POST':
        try:
            titulo = request.form.get('titulo', '').strip()
            conteudo_bruto = request.form.get('conteudo', '').strip()
            categoria = request.form.get('categoria', '')
            link_materia = request.form.get('link_materia', '').strip()
            data_publicacao_str = request.form.get('data_publicacao', '')
            
            if not all([titulo, conteudo_bruto, categoria, link_materia]):
                flash('Todos os campos obrigatórios devem ser preenchidos.', 'error')
                return redirect(request.url)
            
            if not validate_url(link_materia):
                flash('URL da matéria inválida.', 'error')
                return redirect(request.url)
            
            imagem_filename = 'default.jpg'
            if 'imagem' in request.files:
                file = request.files['imagem']
                if file and file.filename != '':
                    uploaded_filename = save_uploaded_file(file)
                    if uploaded_filename:
                        imagem_filename = uploaded_filename
            
            try:
                data_publicacao = datetime.strptime(data_publicacao_str, '%d/%m/%Y')
            except ValueError:
                data_publicacao = datetime.utcnow()
                flash('Data inválida. Usando data atual.', 'warning')
            
            # Criar resumo
            conteudo_limpo = re.sub(r'<[^>]+>', '', conteudo_bruto)
            conteudo_limpo = re.sub(r'\*\*.*?\*\*', '', conteudo_limpo)
            resumo = conteudo_limpo[:150] + '...' if len(conteudo_limpo) > 150 else conteudo_limpo
            
            novo_post = Post(
                titulo=bleach.clean(titulo),
                conteudo=conteudo_bruto,
                resumo=bleach.clean(resumo),
                categoria=bleach.clean(categoria),
                imagem=imagem_filename,
                link_materia=link_materia,
                data_publicacao=data_publicacao
            )
            
            db.session.add(novo_post)
            db.session.commit()
            
            flash(f'Post "{novo_post.titulo}" adicionado com sucesso!', 'success')
            return redirect(url_for('admin_blog'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao adicionar post: {str(e)}', 'error')
    
    data_hoje = datetime.now().strftime('%d/%m/%Y')
    return render_template('admin/post_form.html', post=None, data_hoje=data_hoje)

@app.route(f'{ADMIN_URL_PREFIX}/blog/<int:post_id>/editar', methods=['GET', 'POST'])
@login_required
def editar_post(post_id):
    post = Post.query.get_or_404(post_id)
    
    if request.method == 'POST':
        try:
            if 'imagem' in request.files:
                file = request.files['imagem']
                if file and file.filename != '':
                    uploaded_filename = save_uploaded_file(file)
                    if uploaded_filename:
                        if post.imagem and post.imagem != 'default.jpg':
                            delete_uploaded_file(post.imagem)
                        post.imagem = uploaded_filename
            
            data_publicacao_str = request.form.get('data_publicacao', '')
            try:
                data_publicacao = datetime.strptime(data_publicacao_str, '%d/%m/%Y')
            except ValueError:
                data_publicacao = post.data_publicacao
                flash('Data inválida. Mantendo data original.', 'warning')
            
            conteudo_bruto = request.form.get('conteudo', '').strip()
            conteudo_limpo = re.sub(r'<[^>]+>', '', conteudo_bruto)
            conteudo_limpo = re.sub(r'\*\*.*?\*\*', '', conteudo_limpo)
            resumo = conteudo_limpo[:150] + '...' if len(conteudo_limpo) > 150 else conteudo_limpo
            
            post.titulo = bleach.clean(request.form.get('titulo', '').strip())
            post.conteudo = conteudo_bruto
            post.resumo = bleach.clean(resumo)
            post.categoria = bleach.clean(request.form.get('categoria', ''))
            post.link_materia = request.form.get('link_materia', '').strip()
            post.data_publicacao = data_publicacao
            post.updated_at = datetime.utcnow()
            
            db.session.commit()
            flash('Post atualizado com sucesso!', 'success')
            return redirect(url_for('admin_blog'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Erro ao atualizar post: {str(e)}', 'error')
    
    data_formatada = post.data_publicacao.strftime('%d/%m/%Y')
    return render_template('admin/post_form.html', post=post, data_hoje=data_formatada)

@app.route(f'{ADMIN_URL_PREFIX}/blog/<int:post_id>/excluir', methods=['POST'])
@login_required
def excluir_post(post_id):
    try:
        post = Post.query.get_or_404(post_id)
        if post.imagem and post.imagem != 'default.jpg':
            delete_uploaded_file(post.imagem)
        
        post.ativo = False
        db.session.commit()
        flash(f'Post "{post.titulo}" excluído com sucesso!', 'success')
    except Exception:
        db.session.rollback()
        flash('Erro ao excluir post.', 'error')
    
    return redirect(url_for('admin_blog'))

# ========================================
# ROTAS ADMINISTRATIVAS - PLANOS
# ========================================

@app.route(f'{ADMIN_URL_PREFIX}/planos')
@login_required
def admin_planos():
    planos_data = Plano.query.filter_by(ativo=True).order_by(Plano.ordem_exibicao).all()
    return render_template('admin/planos.html', planos=planos_data)

@app.route(f'{ADMIN_URL_PREFIX}/planos/adicionar', methods=['GET', 'POST'])
@login_required
def adicionar_plano():
    if request.method == 'POST':
        try:
            novo_plano = Plano(
                nome=bleach.clean(request.form['nome']),
                preco=bleach.clean(request.form['preco']),
                features=bleach.clean(request.form['features']),
                velocidade=bleach.clean(request.form.get('velocidade', '')),
                recomendado='recomendado' in request.form
            )
            db.session.add(novo_plano)
            db.session.commit()
            flash(f'Plano "{novo_plano.nome}" adicionado com sucesso!', 'success')
            return redirect(url_for('admin_planos'))
        except Exception:
            db.session.rollback()
            flash('Erro ao adicionar plano.', 'error')
    
    return render_template('admin/plano_form.html')

@app.route(f'{ADMIN_URL_PREFIX}/planos/<int:plano_id>/editar', methods=['GET', 'POST'])
@login_required
def editar_plano(plano_id):
    plano = Plano.query.get_or_404(plano_id)
    
    if request.method == 'POST':
        try:
            plano.nome = bleach.clean(request.form['nome'])
            plano.preco = bleach.clean(request.form['preco'])
            plano.features = bleach.clean(request.form['features'])
            plano.velocidade = bleach.clean(request.form.get('velocidade', ''))
            plano.recomendado = 'recomendado' in request.form
            
            db.session.commit()
            flash('Plano atualizado com sucesso!', 'success')
            return redirect(url_for('admin_planos'))
        except Exception:
            db.session.rollback()
            flash('Erro ao atualizar plano.', 'error')
    
    return render_template('admin/plano_form.html', plano=plano)

@app.route(f'{ADMIN_URL_PREFIX}/planos/<int:plano_id>/excluir', methods=['POST'])
@login_required
def excluir_plano(plano_id):
    try:
        plano = Plano.query.get_or_404(plano_id)
        plano.ativo = False
        db.session.commit()
        flash(f'Plano "{plano.nome}" excluído com sucesso!', 'success')
    except Exception:
        db.session.rollback()
        flash('Erro ao excluir plano.', 'error')
    
    return redirect(url_for('admin_planos'))

@app.route(f'{ADMIN_URL_PREFIX}/configuracoes', methods=['GET', 'POST'])
@login_required
def admin_configuracoes():
    if request.method == 'POST':
        try:
            for chave, valor in request.form.items():
                if chave not in ['csrf_token'] and valor.strip():
                    config = Configuracao.query.filter_by(chave=chave).first()
                    if config:
                        config.valor = bleach.clean(valor.strip())
                    else:
                        config = Configuracao(chave=chave, valor=bleach.clean(valor.strip()))
                        db.session.add(config)
            db.session.commit()
            flash('Configurações atualizadas com sucesso!', 'success')
        except Exception:
            db.session.rollback()
            flash('Erro ao atualizar configurações.', 'error')
    
    configs = get_configs()
    return render_template('admin/configuracoes.html', configs=configs)

# ========================================
# UTILITÁRIOS
# ========================================

def get_configs():
    """Retorna configurações sanitizadas"""
    try:
        configuracoes_db = Configuracao.query.all()
        configs = {}
        for config in configuracoes_db:
            configs[config.chave] = bleach.clean(config.valor)
        return configs
    except Exception:
        return {
            'SITE_NAME': 'NetFyber',
            'SITE_DESCRIPTION': 'Plataforma de Testes de Velocidade'
        }

@app.route('/api/planos')
def api_planos():
    planos_data = Plano.query.filter_by(ativo=True).order_by(Plano.ordem_exibicao).all()
    planos_list = []
    for plano in planos_data:
        planos_list.append({
            'id': plano.id,
            'nome': plano.nome,
            'preco': plano.preco,
            'velocidade': plano.velocidade,
            'features': plano.get_features_list(),
            'recomendado': plano.recomendado
        })
    return jsonify(planos_list)

@app.route('/api/blog/posts')
def api_blog_posts():
    try:
        posts = Post.query.filter_by(ativo=True).order_by(Post.data_publicacao.desc()).all()
        posts_list = []
        for post in posts:
            posts_list.append({
                'id': post.id,
                'titulo': post.titulo,
                'resumo': post.resumo,
                'categoria': post.categoria,
                'imagem': post.get_imagem_url(),
                'link_materia': post.link_materia,
                'data_publicacao': post.get_data_formatada(),
                'conteudo_html': post.get_conteudo_html()
            })
        return jsonify(posts_list)
    except Exception:
        return jsonify([])

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy', 
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

# ========================================
# HANDLERS DE ERRO
# ========================================

@app.errorhandler(404)
def pagina_nao_encontrada(error):
    return render_template('public/404.html', configs=get_configs()), 404

@app.errorhandler(403)
def acesso_negado(error):
    return render_template('public/403.html', configs=get_configs()), 403

@app.errorhandler(500)
def erro_servidor(error):
    return render_template('public/500.html', configs=get_configs()), 500

# ========================================
# INICIALIZAÇÃO DO BANCO DE DADOS
# ========================================

def init_database():
    """Inicializa o banco de dados automaticamente"""
    try:
        with app.app_context():
            # Cria todas as tabelas
            db.create_all()
            print("✅ Tabelas criadas/verificadas com sucesso!")
            
            # Configurações padrão
            configs_padrao = {
                'telefone_contato': '(63) 8494-1778',
                'email_contato': 'contato@netfyber.com',
                'endereco': 'AV. Tocantins – 934, Centro – Sítio Novo – TO<br>Axixá TO / Juverlândia / São Pedro / Folha Seca / Morada Nova / Santa Luzia / Boa Esperança',
                'horario_segunda_sexta': '08h às 18h',
                'horario_sabado': '08h às 13h',
                'whatsapp_numero': '556384941778',
                'instagram_url': 'https://www.instagram.com/netfybertelecom',
                'facebook_url': '#',
                'hero_imagem': 'images/familia.png',
                'hero_titulo': 'Internet de Alta Velocidade',
                'hero_subtitulo': 'Conecte sua família ao futuro com a NetFyber Telecom'
            }
            
            for chave, valor in configs_padrao.items():
                if Configuracao.query.filter_by(chave=chave).first() is None:
                    config = Configuracao(chave=chave, valor=valor)
                    db.session.add(config)
            
            db.session.commit()
            print("🎉 Banco de dados inicializado com sucesso!")
            
    except Exception as e:
        print(f"⚠️ Erro ao inicializar banco de dados: {e}")

# ========================================
# INICIALIZAÇÃO DA APLICAÇÃO
# ========================================

# Inicializa o banco de dados quando o aplicativo começar
with app.app_context():
    init_database()

if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)