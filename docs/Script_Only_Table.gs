/**
 * Всё в таблице: кнопка отправляет письма через Gmail (без других сервисов).
 * Вставьте в Расширения → Apps Script. При нажатии кнопки — письма по строкам с send = "ok".
 */
function sendTransactionEmails() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Транзакции');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Лист "Транзакции" не найден.');
    return;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('Нет данных для отправки.');
    return;
  }

  var headers = data[0].map(function(h) { return String(h || '').toLowerCase().trim(); });
  var col = function(name, alt) {
    var i = headers.indexOf(name);
    if (i === -1 && alt) i = headers.indexOf(alt);
    return i;
  };
  var idxId = col('id', 'userId');
  var idxEmail = col('email');
  var idxAmount = col('amount');
  var idxDesc = col('description');
  var idxDate = col('date');
  var idxSend = col('send');

  if (idxEmail === -1 || idxSend === -1) {
    SpreadsheetApp.getUi().alert('Нужны колонки: email, send (и id, amount, description, date).');
    return;
  }

  var sent = 0;
  var errors = [];

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var sendVal = String(row[idxSend] || '').trim().toLowerCase();
    if (sendVal !== 'ok') continue;

    var email = String(row[idxEmail] || '').trim().toLowerCase();
    if (!email || email.indexOf('@') === -1) {
      errors.push('Строка ' + (r + 1) + ': нет email');
      continue;
    }

    var amount = row[idxAmount];
    if (amount === '' || amount === null || Number(amount) <= 0) {
      errors.push('Строка ' + (r + 1) + ': сумма должна быть > 0');
      continue;
    }
    amount = Number(amount);
    var description = String((idxDesc >= 0 ? row[idxDesc] : '') || '').trim();
    var dateStr = String((idxDate >= 0 ? row[idxDate] : '') || '').trim();

    var subject = 'ČSOB Asia – Balance topped up';
    var body = 'Your balance has been topped up by ' + amount + '.\n';
    if (dateStr) body += 'Date: ' + dateStr + '.\n';
    if (description) body += 'Description: ' + description + '.';

    try {
      GmailApp.sendEmail(email, subject, body);
      sheet.getRange(r + 1, idxSend + 1).setValue('отправлено');
      sent++;
    } catch (e) {
      errors.push('Строка ' + (r + 1) + ': ' + e.toString());
    }
  }

  var msg = 'Отправлено писем: ' + sent;
  if (errors.length > 0) msg += '\nОшибки:\n' + errors.join('\n');
  SpreadsheetApp.getUi().alert(msg);
}
