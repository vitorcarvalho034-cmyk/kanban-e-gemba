# Configuração do Google Drive OAuth

## Passo 1: Criar um Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Criar Projeto"
3. Dê um nome ao projeto (ex: "KANBAN E GEMBA")
4. Clique em "Criar"

## Passo 2: Habilitar a Google Drive API

1. No console, vá para "APIs e Serviços" > "Biblioteca"
2. Procure por "Google Drive API"
3. Clique em "Ativar"

## Passo 3: Criar Credenciais OAuth 2.0

1. Vá para "APIs e Serviços" > "Credenciais"
2. Clique em "Criar Credenciais" > "ID do cliente OAuth"
3. Escolha "Aplicação da Web"
4. Adicione os URIs autorizados:
   - **JavaScript autorizado:** `https://kanbanprod-6urstnn2.manus.space`
   - **URIs de redirecionamento autorizado:** `https://kanbanprod-6urstnn2.manus.space/auth/google/callback`
5. Clique em "Criar"

## Passo 4: Copiar o Client ID

1. Copie o "ID do cliente" gerado
2. Adicione a variável de ambiente no seu projeto:

```bash
VITE_GOOGLE_CLIENT_ID=seu_client_id_aqui
```

## Passo 5: Testar a Sincronização

1. Acesse o app KANBAN E GEMBA
2. Clique em "Conectar Google Drive"
3. Faça login com sua conta Google
4. Clique em "Sincronizar Agora" para fazer backup
5. Clique em "Restaurar" para restaurar dados

## Troubleshooting

### Erro: "Erro ao conectar com Google Drive"
- Verifique se o Client ID está correto
- Verifique se o URI de redirecionamento está configurado corretamente no Google Cloud Console

### Erro: "Erro ao fazer upload"
- Verifique se a Google Drive API está habilitada
- Verifique se o token de acesso não expirou

### Dados não aparecem após restaurar
- Os dados são restaurados no localStorage
- Recarregue a página para ver os dados restaurados
