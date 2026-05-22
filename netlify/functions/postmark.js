const POSTMARK_SERVER_TOKEN = '51d893d2-6150-4030-8cb9-43f93d4bf4fb';
const FROM_EMAIL = 'returns@baboodle.co.uk';
const FROM_NAME = 'Baboodle Returns';

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };

  try {
    const { to, toName, subject, body, photoUrl } = JSON.parse(event.body);

    // Build attachments array if photo URL provided
    let attachments = [];
    if (photoUrl) {
      try {
        const photoRes = await fetch(photoUrl);
        if (photoRes.ok) {
          const buffer = await photoRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const contentType = photoRes.headers.get('content-type') || 'image/jpeg';
          const ext = contentType.split('/')[1] || 'jpg';
          attachments = [{
            Name: `return-photo.${ext}`,
            Content: base64,
            ContentType: contentType
          }];
        }
      } catch(e) {
        console.warn('Photo fetch failed:', e.message);
      }
    }

    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN
      },
      body: JSON.stringify({
        From: `${FROM_NAME} <${FROM_EMAIL}>`,
        To: `${toName} <${to}>`,
        Subject: subject,
        TextBody: body,
        HtmlBody: body.replace(/\n/g, '<br>'),
        Attachments: attachments,
        MessageStream: 'outbound'
      })
    });

    const data = await res.json();
    return { statusCode: res.status, headers: cors, body: JSON.stringify(data) };

  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
