import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';

export async function withCwd(dir: string, work: () => Promise<void>) {
  const cwd = process.cwd();
  try {
    process.chdir(dir);
    await work();
  } finally {
    process.chdir(cwd);
  }
}

export async function withTempDir(work: (dir: string) => Promise<void>) {
  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), 'cdk8s-'));
  try {
    await work(workdir);
  } finally {
    await fs.remove(workdir);
  }
}
