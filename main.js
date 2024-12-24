const axios = require('axios');

const SLACK_TOKEN_1 = process.env.SLACK_TOKEN_1;
const SLACK_TOKEN_2 = process.env.SLACK_TOKEN_2;
const CHANNEL_ID_1 = process.env.CHANNEL_ID_1;
const CHANNEL_ID_2 = process.env.CHANNEL_ID_2;

async function fetchAndPostMessages() {
  try {
    // ワークスペース1からメッセージを取得
    const response = await axios.get(
      `https://slack.com/api/conversations.history?channel=${CHANNEL_ID_1}`,
      {
        headers: {
          Authorization: `Bearer ${SLACK_TOKEN_1}`,
        },
      }
    );

    if (response.data.ok) {
      const latestMessage = response.data.messages[0].text; // 最新メッセージ
      console.log('取得したメッセージ:', latestMessage);

      // ワークスペース2にメッセージを送信
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: CHANNEL_ID_2,
          text: latestMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${SLACK_TOKEN_2}`,
          },
        }
      );

      console.log('メッセージを送信しました');
    } else {
      console.error('メッセージの取得に失敗:', response.data.error);
    }
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

fetchAndPostMessages();
