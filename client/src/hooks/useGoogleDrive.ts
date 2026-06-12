import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface GoogleAuthResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export function useGoogleDrive() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const authenticate = useCallback(async () => {
    try {
      // Gerar state aleatório para segurança
      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem('google_oauth_state', state);

      // Redirecionar para Google OAuth
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.append('response_type', 'token');
      authUrl.searchParams.append('scope', SCOPES);
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('access_type', 'offline');

      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Erro ao autenticar:', error);
      toast.error('Erro ao conectar com Google Drive');
    }
  }, []);

  const handleAuthCallback = useCallback((token: string) => {
    setAccessToken(token);
    setIsAuthenticated(true);
    sessionStorage.setItem('google_drive_token', token);
    toast.success('Conectado ao Google Drive!');
  }, []);

  const uploadToGoogleDrive = useCallback(
    async (fileName: string, fileContent: any) => {
      if (!accessToken) {
        toast.error('Não autenticado com Google Drive');
        return;
      }

      setIsSyncing(true);
      try {
        // Criar metadados do arquivo
        const metadata = {
          name: fileName,
          mimeType: 'application/json',
          parents: ['appDataFolder'], // Salvar em pasta privada do app
        };

        // Criar FormData para upload
        const form = new FormData();
        form.append(
          'metadata',
          new Blob([JSON.stringify(metadata)], { type: 'application/json' })
        );
        form.append(
          'file',
          new Blob([JSON.stringify(fileContent, null, 2)], {
            type: 'application/json',
          })
        );

        // Upload para Google Drive
        const response = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: form,
          }
        );

        if (!response.ok) {
          throw new Error('Erro ao fazer upload');
        }

        const result = await response.json();
        toast.success('Dados sincronizados com Google Drive!');
        return result;
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        toast.error('Erro ao sincronizar com Google Drive');
      } finally {
        setIsSyncing(false);
      }
    },
    [accessToken]
  );

  const downloadFromGoogleDrive = useCallback(
    async (fileName: string) => {
      if (!accessToken) {
        toast.error('Não autenticado com Google Drive');
        return;
      }

      setIsSyncing(true);
      try {
        // Buscar arquivo por nome
        const searchResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false&spaces=appDataFolder&fields=files(id,name)`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const searchResult = await searchResponse.json();
        if (!searchResult.files || searchResult.files.length === 0) {
          toast.error('Arquivo não encontrado no Google Drive');
          return;
        }

        const fileId = searchResult.files[0].id;

        // Download do arquivo
        const downloadResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!downloadResponse.ok) {
          throw new Error('Erro ao fazer download');
        }

        const data = await downloadResponse.json();
        toast.success('Dados restaurados do Google Drive!');
        return data;
      } catch (error) {
        console.error('Erro ao fazer download:', error);
        toast.error('Erro ao restaurar do Google Drive');
      } finally {
        setIsSyncing(false);
      }
    },
    [accessToken]
  );

  const logout = useCallback(() => {
    setAccessToken(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('google_drive_token');
    toast.success('Desconectado do Google Drive');
  }, []);

  return {
    isAuthenticated,
    isSyncing,
    authenticate,
    handleAuthCallback,
    uploadToGoogleDrive,
    downloadFromGoogleDrive,
    logout,
  };
}
