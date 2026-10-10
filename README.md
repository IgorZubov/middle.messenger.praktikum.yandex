
# Мастер создания опросов

Очень хитрый опросник, который показывает только те ответы, в которых есть позитивные пересечения: оба ответа "да"

## Дизайн
Макеты находятся в папке ui проекта

## Установка
Установить зависимости проекта: `npm install`

Собрать проект: `npm run build`

Запустить проект на localhost: `npm run start`

## Спринт 1 → спринт 2

Все этапы перехода живут рядом, нужный выбирается параметром `?app=` (переключатель есть вверху страницы):

| Адрес | Что запускается |
| --- | --- |
| `/?app=sprint1` | Приложение спринта 1 без изменений: partials + `innerHTML` (`src/legacy`) |
| `/?app=formLite` | `Block` без дочерних компонентов: шаблон, `refs`, `events` (`src/demos/FormLite.ts`) |
| `/?app=form` | `Block` с дочерними компонентами через `registerComponent` (`src/demos/Form.ts`) |
| `/` | Приложение спринта 2: компоненты на `Block`, страницы, `Router` (`src/App.ts`) |

Ядро спринта 2 лежит в `src/framework`: `Block.ts`, `ComponentRegistry.ts`, `Router.ts`.

## Ссылки:

### На веб-приложение:

Netlify: https://questionnaire-njkadsfh.netlify.app

### На сверстанные макеты:

Страница создания опросника: https://questionnaire-njkadsfh.netlify.app
