# LoveSpin

Романтическая интерактивная открытка: публичный конструктор создаёт персональную ссылку с двумя комплиментами и гарантированным главным подарком на третьем вращении.

## Локальный запуск

Требуются Node.js 20.9+, pnpm и PostgreSQL.

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm db:migrate
pnpm dev
```

Откройте `http://localhost:3000/create`. В `.env.example` стоят официальные always-pass тестовые ключи Cloudflare Turnstile; они подходят для localhost и автоматических тестов.
Команда `pnpm dev` запускает локальную очистку при старте и повторяет её раз в час. Для разовой очистки используйте `pnpm cleanup`.

## VPS

Production deployment for the Just Ours Love stack uses `compose.production.yml`
and the shared `justours-edge` Docker network. Configure `spin.justours.love`
in Caddy, create `.env.production` from `.env.production.example`, and provide
production Turnstile keys that allow that hostname. Then run:

```bash
git pull --ff-only
bash scripts/deploy-production.sh
```

The script builds a release image, creates a PostgreSQL backup, starts the app
and cleanup worker, and checks `/api/healthz`. It keeps database and upload
volumes across updates.

The section below documents the standalone loopback setup.

1. Создайте `.env` и задайте сильные `POSTGRES_PASSWORD` и `IP_HASH_SECRET`.
2. Укажите публичный HTTPS-адрес в `NEXT_PUBLIC_SITE_URL`.
3. Пока используется тестовый Turnstile, оставьте тестовые ключи. Перед публичным запуском создайте widget для своего hostname, замените обе переменные Turnstile и пересоберите image.
4. Запустите `docker compose up -d --build`.
5. Направьте домен через Caddy или nginx на `127.0.0.1:3000`. Приложение берёт IP из `X-Forwarded-For`; reverse proxy должен формировать этот заголовок сам, поскольку по нему действует лимит 3 публикации в час и 10 в сутки. Не открывайте порт приложения напрямую в интернет.

Пример Caddy:

```caddy
love.example.com {
  reverse_proxy 127.0.0.1:3000 {
    header_up -X-Real-IP
  }
}
```

PostgreSQL и вложения (фотография или PDF-сертификат) находятся в Docker volumes и не публикуются наружу. Страница перестаёт отдаваться ровно через 7 дней; сервис `cleanup` раз в час окончательно удаляет запись и связанный файл. Поле `owner_id` уже предусмотрено для будущего входа через Google.

Ссылка на открытку служит ключом доступа: каждый, кто получил её целиком, может открыть страницу и вложение до истечения срока. Новые ссылки содержат 128 случайных бит; старые ссылки продолжают работать до своего обычного срока. При обновлении существующей установки миграция `003_stronger_share_slugs.sql` применяется автоматически при запуске контейнера или командой `pnpm db:migrate` перед запуском приложения.

## Проверки

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
