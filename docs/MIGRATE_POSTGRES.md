# Перенос Postgres со старого Vercel на новый

Чтобы удалить старый аккаунт Vercel, нужно перенести базу **prisma-postgres-cerise-flame** в новую БД на новом аккаунте.

## Шаг 1. Создать новую базу Postgres на новом Vercel

1. Зайди на **новый** аккаунт Vercel.
2. **Storage** (в боковом меню) → **Create Database** → **Postgres**.
3. Создай базу (имя любое), привяжи к проекту **asiacsb** или к команде.
4. Скопируй **Connection string** (переменная будет типа `POSTGRES_URL` или `DATABASE_URL`). Это твой **NEW_PRISMA_DATABASE_URL**.

## Шаг 2. Создать схему в новой базе

В папке проекта (`bank-new`):

```bash
cd ~/bank-new
export PRISMA_DATABASE_URL="НОВЫЙ_connection_string"
npx prisma db push
```

(или `npx prisma migrate deploy`, если используешь миграции.)

## Шаг 3. Скопировать данные из старой базы в новую

Старый URL — тот, что сейчас в старом Vercel (prisma-postgres-cerise-flame). Новый — из шага 1.

```bash
npm install
OLD_PRISMA_DATABASE_URL="postgres://...старый_url..." NEW_PRISMA_DATABASE_URL="postgres://...новый_url..." npm run db:migrate-copy
```

В консоли появится количество перенесённых User, Session, PasswordResetToken, ProcessedTransactionNotification.

## Шаг 4. Переключить новый проект на новую базу

1. В **новом** Vercel → проект **asiacsb** → **Settings** → **Environment Variables**.
2. Замени **PRISMA_DATABASE_URL** на **новый** connection string из шага 1.
3. Сохрани и сделай **Redeploy**.

## Шаг 5. Проверка

Открой https://asiacsb-wine.vercel.app, залогинься под одним из 4 пользователей. Всё должно работать как раньше.

## Шаг 6. Удалить старый проект и аккаунт Vercel

1. Старый аккаунт Vercel → выбери старый проект → **Settings** → внизу **Delete Project**.
2. При необходимости удали аккаунт: **Account Settings** → раздел удаления аккаунта.

После этого база prisma-postgres-cerise-flame будет отвязана; данные уже в новой БД на новом аккаунте.
