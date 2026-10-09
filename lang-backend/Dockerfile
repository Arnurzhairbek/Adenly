# Используем официальный Node.js образ
FROM node:22-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --omit=dev

# Копируем остальные файлы приложения
COPY . .

# Создаем директорию для uploads, если её нет
RUN mkdir -p uploads && chmod 755 uploads

# Открываем порт
EXPOSE 5000

# Команда запуска
CMD ["node", "index.js"]
