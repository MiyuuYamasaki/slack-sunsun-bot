import vercel from '@vercel/node';
import crypto from 'crypto';

const { json } = vercel;

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET; // GitHub Secretsで設定した値

export default async function handler(req, res) {
  // リクエストが正当かどうかを検証
  const { body, headers } = req;

  const timestamp = headers['x-slack-request-timestamp'];
  const signature = headers['x-slack-signature'];

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = `v0=${crypto
    .createHmac('sha256', SLACK_SIGNING_SECRET)
    .update(sigBasestring)
    .digest('hex')}`;

  if (
    crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature))
  ) {
    // リクエストが正当な場合、イベントを処理
    if (body.type === 'url_verification') {
      // URL検証リクエスト
      return res.status(200).json({ challenge: body.challenge });
    } else if (body.event && body.event.type === 'message') {
      // メッセージイベント処理
      const message = body.event.text;
      console.log('新しいメッセージ:', message);
      // 必要に応じて、メッセージに対する処理を追加
      return res.status(200).json({ status: 'ok' });
    }
  } else {
    return res.status(400).send('Signature verification failed');
  }
}
