import axios from 'axios';

// 環境変数の取得
const SLACK_TOKEN_1 = process.env.SLACK_TOKEN_1;
const SLACK_TOKEN_2 = process.env.SLACK_TOKEN_2;
const CHANNEL_ID_1 = process.env.CHANNEL_ID_1;
const CHANNEL_ID_2 = process.env.CHANNEL_ID_2;

// 今日の日付と曜日を取得
function getTodayInfo() {
  const now = new Date();
  const dayOfWeekMap = ['日', '月', '火', '水', '木', '金', '土'];
  const month = now.getMonth() + 1; // 月は0始まり
  const date = now.getDate();
  const dayOfWeek = dayOfWeekMap[now.getDay()];
  return {
    dateText: `${month}/${date}（${dayOfWeek}）`,
    fullDate: `${now.getFullYear()}-${String(month).padStart(2, '0')}-${String(
      date
    ).padStart(2, '0')}`,
  };
}

async function fetchAndPostMessages() {
  const today = getTodayInfo();
  console.log('今日の日付:', today.dateText);

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

    if (!response.data.ok) {
      console.error('メッセージの取得に失敗:', response.data.error);
      return;
    }

    // 条件に合うメッセージを探す
    const targetMessage = response.data.messages.find(
      (message) =>
        message.text.includes(today.dateText) &&
        message.text.includes('SUNSUN食堂のメニュー')
    );

    if (!targetMessage) {
      console.log('条件に一致するメッセージが見つかりませんでした。');
      return;
    }

    console.log('取得したメッセージ:', targetMessage.text);

    // ワークスペース2にメッセージを送信
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: CHANNEL_ID_2,
        text: targetMessage.text,
      },
      {
        headers: {
          Authorization: `Bearer ${SLACK_TOKEN_2}`,
        },
      }
    );

    console.log('メッセージを送信しました');
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

fetchAndPostMessages();
