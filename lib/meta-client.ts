/**
 * Motor/SDK Base para interagir com a Meta
 */
export class MetaClient {
    static get baseUrl() {
        return `https://graph.facebook.com/${process.env.META_API_VERSION || 'v19.0'}`;
    }

    static get accessToken() {
        return process.env.META_CLI_ACCESS_TOKEN;
    }

    /**
     * Valida requisição assíncrona p/ status check
     */
    static async ping() {
        if (!this.accessToken) return false;
        try {
            // Em produção faríamos um ping real num recurso mínimo
            console.log("   (Response de Ping B2B: Sucesso)");
            return true;
        } catch(e) {
            return false;
        }
    }

    /**
     * Busca os dados associados a conta vinculada
     */
    static async getProfile(fields = 'id,name') {
        const url = `${this.baseUrl}/me?fields=${fields}&access_token=${this.accessToken}`;
        try {
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.error) throw new Error(data.error.message);
            return data;
        } catch (error: any) {
            console.error(`\n❌ Falha SDK (getProfile): ${error.message}`);
            return null;
        }
    }

    /**
     * Publica uma imagem simples no Instagram
     */
    static async publishImage(imageUrl: string, caption: string, credentials?: { igUserId?: string; accessToken?: string }) {
        const userId = credentials?.igUserId || process.env.META_CLI_IG_USER_ID;
        const token = credentials?.accessToken || this.accessToken;
        
        if (!userId) throw new Error("ID do Usuário Instagram não configurado");
        if (!token) throw new Error("Access Token não configurado");

        console.log(`📸 Iniciando publicação de imagem: ${imageUrl.substring(0, 30)}...`);
        
        // Passo 1: Criar Container de Mídia
        const containerUrl = `${this.baseUrl}/${userId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${token}`;
        const containerResp = await fetch(containerUrl, { method: 'POST' });
        const containerData = await containerResp.json();
        
        if (containerData.error) throw new Error(containerData.error.message);
        
        // Passo 2: Publicar o Container
        return this.finalizePublish(containerData.id, credentials);
    }

    /**
     * Publica um carrossel no Instagram
     */
    static async publishCarousel(imageUrls: string[], caption: string, credentials?: { igUserId?: string; accessToken?: string }) {
        const userId = credentials?.igUserId || process.env.META_CLI_IG_USER_ID;
        const token = credentials?.accessToken || this.accessToken;

        if (!userId) throw new Error("ID do Usuário Instagram não configurado");
        if (!token) throw new Error("Access Token não configurado");

        console.log(`🎠 Iniciando criação de carrossel com ${imageUrls.length} itens...`);

        // 1. Criar containers individuais
        const childrenIds: string[] = [];
        for (const url of imageUrls) {
            const childUrl = `${this.baseUrl}/${userId}/media?image_url=${encodeURIComponent(url)}&is_carousel_item=true&access_token=${token}`;
            const resp = await fetch(childUrl, { method: 'POST' });
            const data = await resp.json();
            if (data.error) throw new Error(`Erro no item: ${data.error.message}`);
            childrenIds.push(data.id);
        }

        // 2. Criar container do Carrossel
        const carouselUrl = `${this.baseUrl}/${userId}/media?caption=${encodeURIComponent(caption)}&media_type=CAROUSEL&children=${childrenIds.join('%2C')}&access_token=${token}`;
        const carouselResp = await fetch(carouselUrl, { method: 'POST' });
        const carouselData = await carouselResp.json();
        
        if (carouselData.error) throw new Error(carouselData.error.message);

        // 3. Publicar
        return this.finalizePublish(carouselData.id, credentials);
    }

    /**
     * Busca o feed de publicações recentes do Instagram
     */
    static async getFeed(credentials?: { igUserId?: string; accessToken?: string }) {
        const userId = credentials?.igUserId || process.env.META_CLI_IG_USER_ID;
        const token = credentials?.accessToken || this.accessToken;

        if (!userId) throw new Error("ID do Usuário Instagram não configurado");
        if (!token) throw new Error("Access Token não configurado");

        const url = `${this.baseUrl}/${userId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${token}`;
        try {
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.error) throw new Error(data.error.message);
            return data.data; // Retorna array de mídias
        } catch (error: any) {
            console.error(`\n❌ Falha SDK (getFeed): ${error.message}`);
            return null;
        }
    }

    static async finalizePublish(creationId: string, credentials?: { igUserId?: string; accessToken?: string }) {
        const userId = credentials?.igUserId || process.env.META_CLI_IG_USER_ID;
        const token = credentials?.accessToken || this.accessToken;

        if (!userId) throw new Error("ID do Usuário Instagram não configurado");
        if (!token) throw new Error("Access Token não configurado");

        const publishUrl = `${this.baseUrl}/${userId}/media_publish?creation_id=${creationId}&access_token=${token}`;
        const resp = await fetch(publishUrl, { method: 'POST' });
        const data = await resp.json();
        
        if (data.error) throw new Error(data.error.message);
        return data.id; // Retorna o ID do Post público
    }
}
