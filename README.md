<div align="center">

# 💰 Meu Bolso

### Controle financeiro pessoal simples, responsivo e pronto para uso em qualquer dispositivo

[![Demo](https://img.shields.io/badge/🚀_Demo-GitHub%20Pages-16a34a?style=for-the-badge)](https://js171555.github.io/meu_bolso/)
[![Stack](https://img.shields.io/badge/Stack-HTML%20%7C%20CSS%20%7C%20JavaScript-2563eb?style=for-the-badge)](#-tecnologias)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](#-tecnologias)
[![PWA](https://img.shields.io/badge/Tipo-PWA-7c3aed?style=for-the-badge)](#-sobre-o-projeto)

</div>

Meu Bolso é uma aplicação web para registrar receitas e despesas, acompanhar o saldo e visualizar para onde o dinheiro está indo. A interface foi pensada para ser direta e confortável em dispositivos móveis, com autenticação de usuários e persistência dos lançamentos por meio do Supabase.

> Status: versão funcional focada no fluxo principal de controle financeiro pessoal.

## 📌 Sobre o projeto

O Meu Bolso nasceu para ajudar a manter o controle do orçamento diário com uma experiência simples e rápida, sem a necessidade de cadastro em plataformas complexas ou uso de frameworks pesados.

Ele permite:

- registrar receitas e despesas;
- visualizar o saldo atual em tempo real;
- agrupar gastos por categoria;
- acompanhar as maiores entradas do mês;
- manter os dados separados por usuário autenticado;
- usar a aplicação como PWA em celular, tablet ou desktop.

## ✨ Funcionalidades

- Autenticação com e-mail e senha;
- Login com Google via Supabase OAuth;
- Cadastro de receitas e despesas com valor, categoria, descrição e data;
- Visualização do saldo consolidado e totais por tipo de movimento;
- Filtros por todas, receitas e despesas;
- Resumo dos gastos por categoria;
- Destaque das maiores receitas;
- Exclusão de lançamentos;
- Interface responsiva para mobile e desktop;
- Persistência em banco via Supabase;
- Instalação como aplicativo na tela inicial do celular.

## 📱 Preview da interface

Abaixo estão algumas telas principais do aplicativo:

<div align="center">

<table>
  <tr>
    <td align="center"><img src="https://i.imgur.com/UGI8qly.jpeg" alt="Tela 1 do Meu Bolso" width="320" /></td>
    <td align="center"><img src="https://i.imgur.com/aKJWXsE.jpeg" alt="Tela 2 do Meu Bolso" width="320" /></td>
  </tr>
  <tr>
    <td align="center"><img src="https://i.imgur.com/8DaiSWO.jpeg" alt="Tela 3 do Meu Bolso" width="320" /></td>
    <td align="center"><img src="https://i.imgur.com/b1ZDqbL.jpeg" alt="Tela 4 do Meu Bolso" width="320" /></td>
  </tr>
</table>

</div>

## 🧰 Tecnologias

| Tecnologia | Uso no projeto |
| --- | --- |
| HTML5 | Estrutura da interface e conteúdo da aplicação |
| CSS3 | Layout, responsividade, temas e estilos visuais |
| JavaScript | Lógica da aplicação, cálculos e interações |
| Supabase | Autenticação, persistência e banco de dados |
| Font Awesome 6 | Ícones da interface |
| Google Fonts | Tipografia |

O projeto foi desenvolvido com JavaScript puro e não exige etapa de build ou dependências de instalação via npm.

## 📁 Estrutura do projeto

```text
meu_bolso/
├── index.html            # Estrutura principal da interface
├── css/
│   └── styles.css        # Estilos e responsividade
├── script/
│   └── js.js             # Lógica do app, autenticação e dados
├── assets/               # Ícones e imagens do projeto
├── manifest.json         # Configuração da PWA
├── sw.js                 # Service Worker
├── icon-192.png          # Ícone do app para dispositivos
├── icon-512.png          # Ícone do app em alta resolução
├── README.md             # Documentação do projeto
└── .github/              # Configurações do GitHub (se houver)
```

## 🚀 Como executar localmente

### 1) Clone o repositório

```bash
git clone https://github.com/JS171555/meu_bolso.git
cd meu_bolso
```

### 2) Configure o Supabase

No arquivo `script/js.js`, ajuste as constantes iniciais com a URL e a chave pública do seu projeto Supabase:

```javascript
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_KEY = "SUA_CHAVE_PUBLICA";
```

Esses valores ficam em: `Supabase → Project Settings → API`.

> Importante: use apenas a chave pública (`anon` / `publishable`) no frontend. Nunca exponha a `service_role` ou qualquer chave secreta no navegador ou no repositório.

### 3) Crie a tabela de transações

No SQL Editor do Supabase, execute o seguinte script:

```sql
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  type text not null check (type in ('in', 'out')),
  amount numeric(12, 2) not null check (amount > 0),
  description varchar(40) not null,
  category text not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can read their own transactions"
on public.transactions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
on public.transactions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own transactions"
on public.transactions
for delete
to authenticated
using (auth.uid() = user_id);
```

### 4) Habilite autenticação

No painel do Supabase:

- vá em `Authentication → Providers`;
- habilite o provedor de e-mail;
- habilite o login com Google, se desejar;
- configure a URL do site e os redirecionamentos permitidos.

### 5) Inicie o servidor local

Na raiz do projeto, execute:

```bash
python3 -m http.server 5500
```

Depois abra no navegador:

```text
http://localhost:5500
```

Também é possível usar o Live Server no VS Code para facilitar o desenvolvimento local.

## 🌐 Publicação

Como a aplicação é estática, ela pode ser hospedada em serviços como GitHub Pages ou qualquer servidor de arquivos estáticos.

### GitHub Pages

1. Faça push do projeto para o repositório GitHub;
2. acesse `Settings → Pages`;
3. selecione a branch e a pasta correta;
4. aguarde a publicação;
5. copie a URL gerada;
6. configure essa URL nas opções de autenticação/redirecionamento do Supabase.

## 📲 Instalação no iPhone (iOS)

Abra a aplicação no Safari e siga estes passos:

1. toque em `Compartilhar`;
2. selecione `Adicionar à Tela de Início`;
3. confirme o nome da aplicação;
4. a partir daí ela fica disponível como um app instalado.

## 🛡️ Segurança e privacidade

O projeto lida com dados financeiros pessoais. Antes de usar com dados reais:

- confirme que a RLS da tabela `transactions` está habilitada;
- teste o isolamento das informações com duas contas diferentes;
- nunca exponha chaves secretas ou `service_role` no frontend;
- revise as URLs autorizadas do Supabase para login e redirecionamento;
- mantenha a autenticação e a confirmação de e-mail configuradas corretamente.

## 🗺️ Roadmap e próximos passos

A primeira versão cobre o fluxo principal de registro, consulta e análise financeira. Entre melhorias possíveis estão:

- edição de lançamentos existentes;
- filtros por mês e período personalizado;
- cadastro e personalização de categorias;
- exportação em CSV;
- testes automatizados;
- melhorias de acessibilidade e UX;
- tratamento mais robusto de erros e validações.

## 📄 Licença

Nenhuma licença foi adicionada ao repositório até o momento. Enquanto uma licença não for definida, o uso do código deve ser tratado com cuidado, especialmente em contextos públicos ou de distribuição.

## 👤 Autor

Desenvolvido por [JS171555](https://github.com/JS171555).

---

*Meu Bolso — seu dinheiro organizado, em qualquer lugar.*
