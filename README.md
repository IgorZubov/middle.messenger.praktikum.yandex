
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

## Спринт 4: роутер и тесты

`Router` (`src/framework/Router.ts` + `Route.ts`) — синглтон по мотивам теории: `use(path, PageBlock, props)`, `start`, `go`, `replace`, `back`, `forward`, `getRoute`, `onNotFound`. Страница создаётся при первом заходе на маршрут и дальше только показывается/скрывается.

`HTTPTransport` (`src/framework/HTTPTransport.ts`) — запросы на чистом `XMLHttpRequest`. На нём построен `WeatherService` (`src/services/WeatherService.ts`) — прогноз погоды через [Open-Meteo](https://open-meteo.com) (ключ не нужен).

Тесты на [Vitest](https://vitest.dev) + jsdom:

- `npm test` — прогнать все тесты один раз
- `npm run test:watch` — режим наблюдения

| Файл | Что проверяет |
| --- | --- |
| `src/framework/Router.test.ts` | маршрутизация, история браузера, 404 |
| `src/framework/HTTPTransport.test.ts` | построение XHR-запросов и обработка ответов/ошибок |
| `src/services/WeatherService.test.ts` | сервис погоды: со стабом транспорта и поверх фейкового XHR |
| `src/framework/Block.test.ts` | `Block` в целом: рендер, `setProps`, жизненный цикл, события, `refs`, дочерние компоненты |
| `src/components/button/Button.test.ts` | готовый компонент `Button`, в том числе внутри родителя |

Фейковый `XMLHttpRequest` для тестов написан вручную: `src/test-utils/FakeXHR.ts`.

## Ссылки:

### На веб-приложение:

Netlify: https://questionnaire-njkadsfh.netlify.app

### На сверстанные макеты:

Страница создания опросника: https://questionnaire-njkadsfh.netlify.app
