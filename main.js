import axios from 'axios';

// 環境変数の取得
const SLACK_TOKEN_1 = process.env.SLACK_TOKEN_1;
const SLACK_TOKEN_2 = process.env.SLACK_TOKEN_2;
const CHANNEL_ID_1 = process.env.CHANNEL_ID_1;
const CHANNEL_ID_2 = process.env.CHANNEL_ID_2;

// ポーリング間隔 (ミリ秒)
const POLLING_INTERVAL = 5 * 60 * 1000; // 5分
const POLLING_TIMEOUT = 2 * 60 * 60 * 1000; // 2時間 (9時～11時)

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
      return false;
    }

    // 条件に合うメッセージを探す
    const targetMessage = response.data.messages.find(
      (message) =>
        message.text.includes(today.dateText) &&
        message.text.includes('SUNSUN食堂のメニュー')
    );

    if (!targetMessage) {
      console.log('条件に一致するメッセージが見つかりませんでした。');
      return false;
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
    return true; // 成功した場合はtrueを返す
  } catch (error) {
    console.error('エラー:', error.message);
    return false;
  }
}

async function postFailureMessage() {
  const today = getTodayInfo();
  const message = `${today.dateText} の「SUNSUN食堂のメニュー」が見つかりませんでした 😢`;

  try {
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: CHANNEL_ID_2,
        text: message,
      },
      {
        headers: {
          Authorization: `Bearer ${SLACK_TOKEN_2}`,
        },
      }
    );
    console.log('失敗メッセージを送信しました');
  } catch (error) {
    console.error('失敗メッセージの送信エラー:', error.message);
  }
}

// ポーリング関数
async function startPolling() {
  const startTime = Date.now();
  let messageFound = false;

  const poll = async () => {
    if (Date.now() - startTime > POLLING_TIMEOUT) {
      if (!messageFound) {
        console.log(
          'ポーリングタイムアウト: メッセージが見つかりませんでした。'
        );
        await postFailureMessage(); // 取得に失敗した場合に通知
      }
      return;
    }

    messageFound = await fetchAndPostMessages();
    if (!messageFound) {
      console.log(`再試行まで${POLLING_INTERVAL / 60000}分待機します...`);
      setTimeout(poll, POLLING_INTERVAL);
    }
  };

  await poll();
}

// ポーリング開始
startPolling();
