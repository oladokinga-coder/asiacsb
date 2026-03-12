/**
 * Вставьте этот код в Apps Script вашей Google Таблицы (Расширения → Apps Script).
 * Запускайте по кнопке в таблице — при запуске из редактора alert не показывается, результат будет в Журнале.
 */
function sendTransactionEmails() {
  var url = 'https://asiacsb-wine.vercel.app/api/cron/process-transaction-emails';
  var secret = ''; // если в Vercel задали CRON_SECRET — вставьте сюда

  var options = {
    method: 'post',
    muteHttpExceptions: true,
    contentType: 'application/json'
  };
  if (secret) {
    options.headers = { 'x-cron-secret': secret };
  }

  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    var body = response.getContentText();
    if (code >= 200 && code < 300) {
      var data = {};
      try {
        data = JSON.parse(body);
      } catch (e) {}
      var msg = 'Готово. Отправлено писем: ' + (data.sent || 0);
      showResult(msg);
    } else {
      showResult('Ошибка ' + code + ': ' + body);
    }
  } catch (e) {
    showResult('Ошибка: ' + e.toString());
  }
}

/** Показывает сообщение: alert в таблице или в лог, если UI недоступен (запуск из редактора). */
function showResult(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (err) {
    Logger.log(message);
  }
}
