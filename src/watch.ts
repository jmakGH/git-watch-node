import { format } from 'date-fns';
import { addAll, commit, hasNewOrChangedFiles, push } from './git';
import log from './log';

let timer: NodeJS.Timeout;

function handleExit(callback?: () => void) {
  clearTimeout(timer);

  if (callback) {
    callback();
  }

  process.exit(1);
}

async function handleCommitAndPush(
  dateFormat: string,
  onComplete?: (...args: any[]) => void,
) {
  try {
    const hasChanges = await hasNewOrChangedFiles();

    if (hasChanges) {
      await addAll().catch((e) => {
        throw e;
      });

      const timestamp = format(new Date(), dateFormat);
      await commit(`Commit (${timestamp})`).catch((e) => {
        throw e;
      });

      await push().catch((e) => {
        throw e;
      });

      log.info(`Commited and pushed ${timestamp}`);
    } else {
      log.info('No changes found');
    }

    if (onComplete) {
      onComplete();
    }
  } catch (e) {
    handleExit(() => log.error(e));
  }
}

export default function watch(interval: number, dateFormat: string) {
  process.on('SIGINT', () => handleCommitAndPush(dateFormat, handleExit));

  timer = setTimeout(function run() {
    handleCommitAndPush(dateFormat, () => {
      clearTimeout(timer);
      timer = setTimeout(run, interval);
    });
  }, interval);
}
