# CineCasa Server

Servidor local da biblioteca CineCasa. Requer **Node.js 22+**.

## Início

No Windows (PowerShell):

```powershell
$env:CINECASA_MEDIA_ROOT="D:\\Midia"
$env:CINECASA_PORT="8420"
node server/index.mjs
```

Para séries e filmes em raízes diferentes, a rota de varredura aceita uma lista de pastas:

```powershell
Invoke-RestMethod -Method Post http://localhost:8420/api/scan -ContentType "application/json" -Body '{"folders":["D:\\Filmes","D:\\Series"]}'
```

O banco é criado automaticamente em `data/cinecasa.sqlite`. O servidor não renomeia nem move arquivos.

## Segurança

O streaming só permite arquivos abaixo de `CINECASA_MEDIA_ROOT`. Caminhos fora da raiz autorizada retornam 403. O endpoint de scan apenas registra arquivos identificados com segurança; nomes ambíguos devem ser tratados na fila de revisão antes de receber metadados.

## Endpoints iniciais

- `GET /api/health`
- `GET /api/catalog`
- `GET /api/profiles`
- `GET /api/settings`
- `POST /api/scan`
- `GET /api/media/:id` com HTTP Range
- `POST /api/progress`

A integração do frontend com esses endpoints será feita em seguida.
