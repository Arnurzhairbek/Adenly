// Централизованная обработка ошибок API

export function handleApiError(error) {
  if (error.message.includes("401") || error.message.includes("токен") || error.message.includes("Сессия")) {
    localStorage.removeItem("token");
    return "Сессия мерзімі өтті. Қайта кіріңіз.";
  }

  if (error.message.includes("404")) {
    return "Сұралған ресурс табылмады.";
  }

  if (error.message.includes("500")) {
    return "Сервер қатесі. Кейінірек көріңіз.";
  }

  if (error.message.includes("сеть") || error.message.includes("fetch") || error.message.includes("қосылу")) {
    return "Серверге қосылу мәселесі.";
  }

  return error.message || "Белгісіз қате орын алды.";
}

