import { PlayIcon, StarIcon } from '@heroicons/react/24/solid';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const NewsCard = ({ item, onPlay, onQueue, isQueued }) => {
  const handlePlay = () => onPlay(item);
  const handleQueue = () => onQueue(item);

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg transition hover:border-sky-500/70 hover:shadow-sky-500/20">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
          <span>{item.source}</span>
          <time dateTime={item.published_at}>
            {dayjs(item.published_at).format('YYYY/MM/DD HH:mm')}
          </time>
        </div>
        <h3 className="text-xl font-semibold text-slate-50">{item.title}</h3>
      </header>
      <p className="text-sm leading-relaxed text-slate-300">{item.summary}</p>
      <div className="mt-auto flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          <PlayIcon className="h-4 w-4" />
          読み上げ
        </button>
        <button
          type="button"
          onClick={handleQueue}
          className={clsx(
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300',
            isQueued
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-slate-700 text-slate-300 hover:border-amber-400 hover:text-amber-300'
          )}
        >
          <StarIcon className={clsx('h-4 w-4', isQueued ? 'text-amber-300' : 'text-slate-400')} />
          {isQueued ? '再生リストに追加済み' : '再生リストに追加'}
        </button>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          詳細を見る
        </a>
      </div>
    </article>
  );
};

NewsCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    published_at: PropTypes.string.isRequired,
    source: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  }).isRequired,
  onPlay: PropTypes.func.isRequired,
  onQueue: PropTypes.func.isRequired,
  isQueued: PropTypes.bool,
};

NewsCard.defaultProps = {
  isQueued: false,
};

export default NewsCard;
