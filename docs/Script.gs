/**
 * Вставьте этот код в Apps Script вашей Google Таблицы
 * (Расширения → Apps Script). Замените URL и секрет ниже.
 */
function sendTransactionEmails() {
  var url = 'https://asiacsb.online/api/cron/process-transaction-emails';
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
      var data = JSON.parse(body);
      SpreadsheetApp.getUi().alert('Готово. Отправлено писем: ' + (data.sent || 0));
    } else {
      SpreadsheetApp.getUi().alert('Ошибка ' + code + ': ' + body);
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert('Ошибка: ' + e.toString());
  }
}
