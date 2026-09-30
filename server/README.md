# CineCasa Server

Servidor local da biblioteca CineCasa. Requer **Node.js 22.13+** (o projeto usa `node:sqlite`).

## Início

No Windows (PowerShell):

```powershell
$env:CINECASA_MEDIA_ROOTS="D:\\Midia;E:\\Filmes"
$env:CINECASA_PORT="8420"
$env:CINECASA_HOST="0.0.0.0"
node server/index.mjs
```

As pastas que podem ser escaneadas precisam estar dentro de uma das raízes autorizadas. Para séries e filmes em raízes diferentes, configure `CINECASA_MEDIA_ROOTS` separado por `;`:

```powershell
Invoke-RestMethod -Method Post http://localhost:8420/api/scan -ContentType "application/json" -Body '{"folders":["D:\\Filmes","D:\\Series"]}'
```

O banco é criado automaticamente em `data/cinecasa.sqlite`. O servidor não renomeia nem move arquivos.

### Teste em outra máquina

1. Na máquina que possui os vídeos, inicie o servidor com `CINECASA_HOST=0.0.0.0`.
2. Descubra o IP dessa máquina na rede (por exemplo, `192.168.1.20`).
3. Abra a interface em outro computador/celular e, em **Configurações → Servidor CineCasa**, informe `http://192.168.1.20:8420`.
4. Libere a porta TCP 8420 no Firewall do Windows somente para a rede necessária.
5. Para acessar de fora de casa, prefira uma VPN de rede privada (como Tailscale ou WireGuard) em vez de expor a porta 8420 diretamente à internet.

A URL configurada na interface fica no navegador e pode ser trocada sem recompilar o projeto. Para ambientes de teste, também é possível definir `VITE_CINECASA_SERVER_URL` durante o build como valor padrão; a configuração salva no navegador continua tendo prioridade.

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
