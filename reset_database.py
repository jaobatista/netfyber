from app import app, db, AdminUser, Plano, Configuracao, Post
from datetime import datetime
import os
from dotenv import load_dotenv

# Carrega variáveis do .env
load_dotenv()

def reset_database():
    with app.app_context():
        try:
            print("🔄 Iniciando reset completo do banco de dados...")
            
            # Drop todas as tabelas
            db.drop_all()
            print("✅ Tabelas existentes removidas")
            
            # Criar todas as tabelas novamente
            db.create_all()
            print("✅ Novas tabelas criadas com estrutura atualizada")
            
            # Criar usuário admin com credenciais do .env
            admin_username = os.environ.get('ADMIN_USERNAME', 'netfyber_admin')
            admin_email = os.environ.get('ADMIN_EMAIL', 'admin@netfyber.com')
            admin_password = os.environ.get('ADMIN_PASSWORD', 'Admin@Netfyber2025!')
            
            admin_user = AdminUser(
                username=admin_username, 
                email=admin_email
            )
            admin_user.set_password(admin_password)
            
            db.session.add(admin_user)
            db.session.commit()
            print("✅ Usuário administrativo criado")
            
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
                config = Configuracao(chave=chave, valor=valor)
                db.session.add(config)
            
            print("✅ Configurações padrão criadas")
            
            # Planos de exemplo
            planos_exemplo = [
                Plano(
                    nome="100 MEGA",
                    preco="69,90",
                    velocidade="100 Mbps",
                    features="Wi-Fi Grátis\nInstalação Grátis\nSuporte 24h\nFibra Óptica",
                    recomendado=False,
                    ordem_exibicao=1
                ),
                Plano(
                    nome="200 MEGA",
                    preco="79,90",
                    velocidade="200 Mbps",
                    features="Wi-Fi Grátis\nInstalação Grátis\nSuporte 24h\nFibra Óptica\nModem Incluso",
                    recomendado=True,
                    ordem_exibicao=2
                ),
                Plano(
                    nome="400 MEGA",
                    preco="89,90",
                    velocidade="400 Mbps",
                    features="Wi-Fi Grátis\nInstalação Grátis\nSuporte 24h\nFibra Óptica\nModem Incluso\nAntivírus",
                    recomendado=False,
                    ordem_exibicao=3
                )
            ]
            
            for plano in planos_exemplo:
                db.session.add(plano)
            
            print("✅ Planos de exemplo criados")
            
            # Posts de exemplo para o blog
            posts_exemplo = [
                Post(
                    titulo='IA generativa cresce fortemente, mas requer estratégia bem pensada',
                    conteudo='De acordo com executivos do Itaú e do Banco do Brasil, a inteligência artificial generativa tem grande potencial disruptivo, mas exige investimento significativo e planejamento estratégico — "não basta usar por usar", segundo Marisa Reghini, do BB.\n\n**Muitos bancos preparam uso de "agentes de IA" para automatizar tarefas complexas.**\n<a href="https://www.ibm.com/br-pt/news" target="_blank">IBM Brasil Newsroom</a>\n\n**Apesar do entusiasmo, existe cautela sobre os custos e riscos da adoção.**\n<a href="https://veja.abril.com.br" target="_blank">VEJA</a>',
                    resumo='IA generativa cresce fortemente, mas requer estratégia bem pensada. De acordo com executivos do Itaú e do Banco do Brasil...',
                    categoria='tecnologia',
                    imagem='default.jpg',
                    link_materia='https://www.valor.com.br/tecnologia/noticia/ia-generativa-cresce-fortemente-mas-requer-estrategia',
                    data_publicacao=datetime(2025, 11, 1)
                ),
                Post(
                    titulo='Investimentos em IA no Brasil devem ultrapassar US$ 2,4 bilhões em 2025',
                    conteudo='Um estudo de projeção aponta que os gastos em IA (infraestrutura, software e serviços) devem alcançar cerca de US$ 2,4 bilhões ainda em 2025. Esse crescimento reflete a prioridade cada vez maior que as empresas brasileiras dão à IA generativa e outras tecnologias associadas.\n<a href="https://www.ianews.com.br" target="_blank">FelipeCFerreira IANews</a>\n\n**A IA não está mais apenas em pilotos: muitas empresas já planejam escalar para usos mais estratégicos.**\n<a href="https://www.xpi.com.br" target="_blank">XP Investimentos</a>\n\n**Parte desse investimento é direcionada a nuvem híbrida e open-source, segundo dados da NTT Data.**\n<a href="https://www.nttdata.com" target="_blank">IT Forum</a>',
                    resumo='Investimentos em IA no Brasil devem ultrapassar US$ 2,4 bilhões em 2025. Um estudo de projeção aponta que os gastos em IA...',
                    categoria='tecnologia',
                    imagem='default.jpg',
                    link_materia='https://www.ianews.com.br/investimentos-ia-brasil-2025',
                    data_publicacao=datetime(2025, 8, 5)
                ),
                Post(
                    titulo='YouTube fecha acordo histórico para transmitir 38 jogos do Brasileirão (2025–2027)',
                    conteudo='Segundo o jornalista Daniel Castro, o Google comprou os direitos para transmitir 38 jogos por ano do Brasileirão para a plataforma YouTube entre 2025 e 2027, em parceria com a CazéTV.\n<a href="https://www.noticiasdatv.com.br" target="_blank">Notícias da TV</a>\n\n**Os jogos serão os mesmos exibidos pela Record.**\n<a href="https://www.noticiasdatv.com.br" target="_blank">Notícias da TV</a>\n\n**Isso marca uma estratégia agressiva do Google para entrar no mercado de futebol no Brasil.**\n<a href="https://www.noticiasdatv.com.br" target="_blank">Notícias da TV</a>',
                    resumo='YouTube fecha acordo histórico para transmitir 38 jogos do Brasileirão entre 2025 e 2027, em parceria com a CazéTV...',
                    categoria='noticias',
                    imagem='default.jpg',
                    link_materia='https://www.noticiasdatv.com.br/youtube-brasileirao-2025',
                    data_publicacao=datetime(2024, 10, 10)
                )
            ]
            
            for post in posts_exemplo:
                db.session.add(post)
            
            print("✅ Posts de exemplo criados")
            
            db.session.commit()
            
            print("\n" + "="*60)
            print("🎉 BANCO DE DADOS RESETADO COM SUCESSO!")
            print("="*60)
            
            print("\n📊 RESUMO DA CRIAÇÃO:")
            print(f"   👤 1 usuário administrativo")
            print(f"   ⚙️ {len(configs_padrao)} configurações do site")
            print(f"   📡 {len(planos_exemplo)} planos de internet")
            print(f"   📝 {len(posts_exemplo)} posts do blog")
            
            print("\n👤 USUÁRIO ADMINISTRATIVO:")
            print(f"   📧 Usuário: {admin_username}")
            print(f"   📨 Email: {admin_email}")
            print(f"   🔑 Senha: {admin_password}")
            
            print("\n🔐 CONFIGURAÇÕES DE SEGURANÇA:")
            admin_url_prefix = os.environ.get('ADMIN_URL_PREFIX', '/gestao-exclusiva-netfyber')
            print(f"   🌐 URL Admin: {admin_url_prefix}/login")
            print(f"   🛡️ IPs Autorizados: {os.environ.get('ADMIN_IPS', '127.0.0.1')}")
            
            print("\n💡 PRÓXIMOS PASSOS:")
            print("   1. Acesse o painel administrativo na URL informada")
            print("   2. Verifique se todas as funcionalidades estão funcionando")
            print("   3. A página /blog deve estar acessível sem erros")
            print("="*60)
            
        except Exception as e:
            print(f"\n❌ ERRO AO RESETAR BANCO DE DADOS: {e}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    reset_database()