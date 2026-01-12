import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { ListBulletIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import NewsCard from './components/NewsCard.jsx';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

const speakText = (text, voice, rate) => {
  if (!synth) return;
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) {
    utterance.voice = voice;
  }
  utterance.rate = rate;
  synth.cancel();
  synth.speak(utterance);
};

const loadVoices = () => {
  if (!synth) return [];
  return synth.getVoices().filter((voice) => voice.lang.startsWith('ja') || voice.lang.startsWith('en'));
};

const useSpeechVoices = () => {
  const [voices, setVoices] = useState(loadVoices);

  useEffect(() => {
    if (!synth) return;
    const handleVoicesChanged = () => {
      setVoices(loadVoices());
    };
    synth.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      synth.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);

  return voices;
};

function App() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [queue, setQueue] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speechRate, setSpeechRate] = useState(1);
  const voices = useSpeechVoices();

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/news');
        if (!response.ok) {
          throw new Error('ニュースの取得に失敗しました');
        }
        const json = await response.json();
        setNewsItems(json.items ?? []);
        setError('');
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const filteredNews = useMemo(() => {
    if (!filterDate) return newsItems;
    const selected = dayjs(filterDate);
    return newsItems.filter((item) => dayjs(item.published_at).isSame(selected, 'day'));
  }, [filterDate, newsItems]);

  const isQueued = (itemId) => queue.some((item) => item.id === itemId);

  const handlePlay = (item) => {
    const voice = voices.find((v) => v.name === selectedVoice);
    const text = `${item.title}。${item.summary}`;
    speakText(text, voice, speechRate);
  };

  const handleQueue = (item) => {
    setQueue((prev) => {
      if (prev.some((queued) => queued.id === item.id)) {
        return prev.filter((queued) => queued.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handlePlayQueue = () => {
    if (!synth || queue.length === 0) return;
    const items = [...queue];
    const voice = voices.find((v) => v.name === selectedVoice);

    const playNext = () => {
      const item = items.shift();
      if (!item) return;
      const utterance = new SpeechSynthesisUtterance(`${item.title}。${item.summary}`);
      if (voice) utterance.voice = voice;
      utterance.rate = speechRate;
      utterance.onend = playNext;
      synth.speak(utterance);
    };

    synth.cancel();
    playNext();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-slate-100 shadow-2xl shadow-sky-500/5">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-bold">AI News Reader</h1>
          <span className="rounded-full bg-sky-500/20 px-4 py-1 text-sm text-sky-300">最新のAIニュースを自動取得</span>
        </div>
        <p className="text-sm text-slate-300">
          NewsAPIを利用してAIに関連する最新ニュースを収集し、ブラウザの音声合成機能で読み上げます。
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
          <label className="flex flex-col gap-1">
            日付で絞り込み
            <input
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            音声
            <select
              value={selectedVoice}
              onChange={(event) => setSelectedVoice(event.target.value)}
              className="min-w-[200px] rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-100 focus:border-sky-400 focus:outline-none"
            >
              <option value="">システム既定</option>
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            再生速度: {speechRate.toFixed(1)}x
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(event) => setSpeechRate(Number(event.target.value))}
              className="w-48"
            />
          </label>
          <button
            type="button"
            onClick={handlePlayQueue}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-400 hover:text-sky-200"
          >
            <ListBulletIcon className="h-5 w-5" />
            再生リストを再生 ({queue.length})
          </button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </header>

      <main className="grid grid-cols-1 gap-6 pb-16 md:grid-cols-2">
        {loading ? (
          <div className="col-span-full flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-slate-300">
            <SpeakerWaveIcon className="mr-3 h-6 w-6 animate-pulse" />
            最新ニュースを取得しています…
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-300">
            表示できるニュースがありません。
          </div>
        ) : (
          filteredNews.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              onPlay={handlePlay}
              onQueue={handleQueue}
              isQueued={isQueued(item.id)}
            />
          ))
        )}
      </main>
    </div>
  );
}

export default App;
