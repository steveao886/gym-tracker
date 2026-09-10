import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { githubApi, parseRepo, utoa, atou } from './githubApi';

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: String(status),
  json: async () => body
});

describe('parseRepo', () => {
  it('accepts "owner/repo"', () => {
    expect(parseRepo('gaosi/gym-data')).toEqual({ owner: 'gaosi', repo: 'gym-data' });
  });

  it('accepts a full GitHub URL with .git suffix and whitespace', () => {
    expect(parseRepo('  https://github.com/gaosi/gym-data.git ')).toEqual({ owner: 'gaosi', repo: 'gym-data' });
  });

  it('returns null for a bare name', () => {
    expect(parseRepo('gym-data')).toBeNull();
  });
});

describe('utoa / atou', () => {
  it('round-trips UTF-8 text through base64', () => {
    const text = '杠铃深蹲 315# · 网球 1.5h';
    expect(atou(utoa(text))).toBe(text);
  });
});

describe('githubApi', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('testConnection', () => {
    it('reports the repo name and visibility', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { full_name: 'g/gym-data', private: true, default_branch: 'main' }));
      const res = await githubApi.testConnection('tok', 'g/gym-data');
      expect(res).toMatchObject({ success: true, repoName: 'g/gym-data', isPrivate: true });
      expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/repos/g/gym-data');
      expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    });

    it('maps 401 to an invalid token error', async () => {
      fetchMock.mockResolvedValue(jsonResponse(401, {}));
      await expect(githubApi.testConnection('bad', 'g/r')).rejects.toThrow('Token 无效或已过期');
    });

    it('maps 404 to a repo-not-found error', async () => {
      fetchMock.mockResolvedValue(jsonResponse(404, {}));
      await expect(githubApi.testConnection('tok', 'g/missing')).rejects.toThrow(/未找到该仓库/);
    });

    it('rejects a malformed repo string before calling the network', async () => {
      await expect(githubApi.testConnection('tok', 'nope')).rejects.toThrow(/仓库格式不正确/);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('syncData', () => {
    const data = { history: [{ id: 'log-1', routineTitle: '卧推日' }] };

    it('updates the existing file, passing its sha and the encoded content', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(200, { sha: 'old-sha' }))
        .mockResolvedValueOnce(jsonResponse(200, { commit: { sha: 'c1' }, content: { sha: 'new-sha' } }));

      const res = await githubApi.syncData('tok', 'g/r', 'main', data);

      const [url, init] = fetchMock.mock.calls[1];
      expect(url).toBe('https://api.github.com/repos/g/r/contents/gym-data.json');
      expect(init.method).toBe('PUT');
      const body = JSON.parse(init.body);
      expect(body.sha).toBe('old-sha');
      expect(body.branch).toBe('main');
      expect(JSON.parse(atou(body.content))).toEqual(data);
      expect(res).toMatchObject({ success: true, commitSha: 'c1', newFileSha: 'new-sha' });
    });

    it('creates the file without a sha when it does not exist yet', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(404, {}))
        .mockResolvedValueOnce(jsonResponse(201, { commit: { sha: 'c1' }, content: { sha: 'n' } }));

      await githubApi.syncData('tok', 'g/r', 'main', data);

      const body = JSON.parse(fetchMock.mock.calls[1][1].body);
      expect(body).not.toHaveProperty('sha');
    });

    it('surfaces the GitHub error message when the write fails', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(200, { sha: 's' }))
        .mockResolvedValueOnce(jsonResponse(409, { message: 'is at abc but expected def' }));

      await expect(githubApi.syncData('tok', 'g/r', 'main', data)).rejects.toThrow('is at abc but expected def');
    });
  });

  describe('fetchData', () => {
    it('returns exists=false on 404', async () => {
      fetchMock.mockResolvedValue(jsonResponse(404, {}));
      expect(await githubApi.fetchData('tok', 'g/r')).toEqual({ exists: false, sha: null, data: null });
    });

    it('decodes the remote file content', async () => {
      const remote = { history: [], note: '中文' };
      fetchMock.mockResolvedValue(jsonResponse(200, { sha: 'abc', content: utoa(JSON.stringify(remote)) + '\n' }));
      expect(await githubApi.fetchData('tok', 'g/r')).toEqual({ exists: true, sha: 'abc', data: remote });
    });
  });
});
