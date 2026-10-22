# Meu Bolso

**Controle financeiro pessoal simples, responsivo e conectado à nuvem.**

Meu Bolso é uma aplicação web para registrar receitas e despesas, acompanhar o saldo e visualizar para onde o dinheiro está indo. A interface foi pensada para ser direta e confortável em dispositivos móveis, com autenticação de usuários e persistência dos lançamentos por meio do Supabase.

> **Status:** primeira versão do projeto. O escopo atual prioriza os registros financeiros essenciais e uma visão rápida do saldo.

## Funcionalidades

- **Cadastro e login:** criação de conta e autenticação por e-mail e senha.
- **Saldo consolidado:** cálculo do saldo a partir da diferença entre receitas e despesas.
- **Registro de movimentações:** inclusão de receitas ou despesas com valor, descrição, categoria e data.
- **Categorias predefinidas:** categorias específicas para entradas e saídas.
- **Filtros rápidos:** visualização de todas as movimentações, somente receitas ou somente despesas.
- **Resumo financeiro:** totais de receitas e despesas, gastos agrupados por categoria e destaque para as três maiores receitas.
- **Exclusão de lançamentos:** remoção de movimentações registradas.
- **Interface responsiva:** layout compacto para telas menores e suporte ao tema escuro conforme a preferência do sistema operacional.
- **Dados na nuvem:** integração com Supabase para autenticação e armazenamento.

## Tecnologias

| Tecnologia | Utilização |
|---|---|
| HTML5 | Estrutura da aplicação |
| CSS3 | Layout responsivo, componentes e temas |
| JavaScript (Vanilla) | Interações, cálculos e integração com o backend |
| Supabase | Autenticação e banco de dados PostgreSQL |
| Font Awesome 6 | Ícones da interface |
| Google Fonts — Plus Jakarta Sans | Tipografia |

O projeto não utiliza framework JavaScript nem precisa de etapa de compilação. As bibliotecas externas são carregadas por CDN.

## Estrutura do projeto

```text
meu-bolso/
├── index.html       # Estrutura da interface e pontos de entrada
├── css/
│   └── styles.css   # Estilos, responsividade e tema
├── script/
│   └── js.js        # Autenticação, movimentações e resumo financeiro
└── README.md        # Documentação do projeto
```

## Como executar localmente

### Pré-requisitos

- Um navegador moderno atualizado.
- Um projeto Supabase configurado, com autenticação por e-mail habilitada e a tabela `transactions` criada.
- Python 3 **ou** uma extensão de servidor local, como Live Server no Visual Studio Code.

### 1. Obtenha o código

Clone o repositório pelo endereço exibido na página do GitHub:

```bash
git clone <URL_DO_REPOSITORIO>
cd <PASTA_DO_PROJETO>
```

Se você baixou o ZIP original, extraia-o e entre na pasta `meu_bolso/`. Ao criar o repositório, coloque o conteúdo dessa pasta na raiz do repositório para que `index.html`, `css/` e `script/` fiquem nos caminhos indicados acima.

### 2. Configure o Supabase

No arquivo `script/js.js`, configure a URL do seu projeto e a chave pública (*publishable key*) do Supabase no início do arquivo:

```javascript
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_KEY = "SUA_CHAVE_PUBLICA_SUPABASE";
```

Use a URL e a chave pública disponibilizadas nas configurações de API do seu projeto Supabase. **Não coloque uma chave `service_role` ou qualquer chave secreta no JavaScript do navegador.** A chave pública pode ser usada no frontend, mas a proteção dos registros depende das políticas de acesso do banco.

### 3. Crie a tabela e configure a segurança

No **SQL Editor** do Supabase, execute o SQL abaixo em um projeto novo. Ele cria a tabela esperada pelo código e ativa a segurança por linha (*Row Level Security* — RLS), restringindo cada usuário autenticado aos próprios registros.

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

> **Importante:** o código consulta `transactions` sem filtrar manualmente pelo ID do usuário. Por isso, as políticas RLS não são opcionais: elas são a barreira que impede um usuário de ler ou excluir registros de outra conta. Se a tabela já existir, revise a estrutura e as políticas antes de executar qualquer SQL de criação.

Em **Authentication**, habilite o provedor de e-mail. Se a confirmação de e-mail estiver habilitada, o usuário deverá confirmar o link recebido antes de entrar. Ao publicar o app, configure também a URL do site e as URLs de redirecionamento permitidas no Supabase para o endereço publicado.

### 4. Inicie um servidor local

Na pasta que contém `index.html`, execute:

```bash
python -m http.server 5500
```

Abra [http://localhost:5500](http://localhost:5500) no navegador. Também é possível usar o **Live Server** no Visual Studio Code. Servir o projeto por HTTP local evita limitações que podem ocorrer ao abrir o arquivo diretamente com o protocolo `file://`.

## Publicação

Como a aplicação é estática, ela pode ser hospedada em serviços como **GitHub Pages** ou outro host de sites estáticos.

Para publicar no GitHub Pages:

1. Envie `index.html`, `css/` e `script/` para a raiz do repositório.
2. No GitHub, abra **Settings → Pages** e selecione a branch e a pasta que contêm o `index.html`.
3. Aguarde a publicação e copie a URL gerada.
4. Cadastre essa URL nas configurações de autenticação e redirecionamento do Supabase.
5. Teste cadastro, login, criação de lançamento e exclusão com contas diferentes para confirmar que cada conta vê apenas os próprios dados.

## Escopo atual e próximos passos

A primeira versão cobre o fluxo principal de registro e consulta de receitas e despesas. Entre as evoluções possíveis estão:

- Edição de movimentações existentes.
- Filtros por mês e período personalizado.
- Cadastro e personalização de categorias.
- Exportação de dados para CSV.
- Testes automatizados e validações adicionais de acessibilidade.
- Melhorias no tratamento de datas e mensagens de erro.

Esses itens são sugestões de evolução, não funcionalidades já implementadas nesta versão.

## Privacidade e segurança

O Meu Bolso trabalha com informações financeiras pessoais. Antes de usar com dados reais ou divulgar uma instância pública:

- Confirme que a RLS está habilitada na tabela `transactions` e que as políticas limitam `SELECT`, `INSERT` e `DELETE` ao usuário autenticado correspondente.
- Faça testes com duas contas diferentes para verificar o isolamento dos dados.
- Nunca exponha chaves secretas ou a chave `service_role` no frontend ou no repositório.
- Revise as configurações de autenticação, confirmação de e-mail e URLs de redirecionamento do Supabase.

## Licença

Nenhum arquivo de licença foi incluído no projeto recebido. A licença ainda precisa ser definida. Até que uma licença seja adicionada ao repositório, não presuma que o código esteja liberado para redistribuição ou uso sob uma licença específica.

## Autor

Desenvolvido por [JS171555](https://github.com/JS171555).

---

*Meu Bolso — seu dinheiro organizado, em qualquer lugar.*
