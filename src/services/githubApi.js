// GitHub REST API 读写通信服务 (针对私有仓库的单文件 JSON 同步)

// UTF-8 安全的 Base64 编码解码
export const utoa = (str) => {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
};

export const atou = (b64) => {
  return decodeURIComponent(Array.prototype.map.call(atob(b64), (c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
};

export const parseRepo = (repoStr) => {
  const parts = repoStr.trim().replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '').split('/');
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  return null;
};

export const githubApi = {
  testConnection: async (token, repo) => {
    const parsed = parseRepo(repo);
    if (!parsed) throw new Error('仓库格式不正确，请输入形如 "username/repo" 的格式');

    const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('Token 无效或已过期');
      if (res.status === 404) throw new Error('未找到该仓库，请检查仓库名是否正确且 Token 拥有访问权限');
      throw new Error(`GitHub 访问错误 (${res.status}): ${res.statusText}`);
    }

    const data = await res.json();
    return {
      success: true,
      repoName: data.full_name,
      isPrivate: data.private,
      defaultBranch: data.default_branch
    };
  },

  fetchData: async (token, repo, branch = 'main', path = 'gym-data.json') => {
    const parsed = parseRepo(repo);
    if (!parsed) throw new Error('仓库格式不正确');

    const url = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${path}?ref=${branch}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      cache: 'no-store'
    });

    if (res.status === 404) {
      // 首次使用，文件尚不存在
      return { exists: false, sha: null, data: null };
    }

    if (!res.ok) {
      throw new Error(`读取远程数据失败: ${res.statusText}`);
    }

    const fileMeta = await res.json();
    const content = atou(fileMeta.content.replace(/\s/g, ''));
    return {
      exists: true,
      sha: fileMeta.sha,
      data: JSON.parse(content)
    };
  },

  syncData: async (token, repo, branch = 'main', data, path = 'gym-data.json') => {
    const parsed = parseRepo(repo);
    if (!parsed) throw new Error('仓库格式不正确');

    // 1. 先查取现有文件的 sha（若存在）
    let currentSha = null;
    try {
      const getRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${path}?ref=${branch}`, {
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        cache: 'no-store'
      });
      if (getRes.ok) {
        const meta = await getRes.json();
        currentSha = meta.sha;
      }
    } catch (e) {
      console.warn('Checking remote SHA failed, trying create new file', e);
    }

    // 2. 提交更新或创建
    const contentStr = JSON.stringify(data, null, 2);
    const body = {
      message: `Sync gym workout data [${new Date().toISOString().slice(0, 16).replace('T', ' ')}]`,
      content: utoa(contentStr),
      branch: branch
    };
    if (currentSha) {
      body.sha = currentSha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      throw new Error(errJson.message || `同步至 GitHub 失败 (${putRes.status})`);
    }

    const result = await putRes.json();
    return {
      success: true,
      commitSha: result.commit.sha,
      newFileSha: result.content.sha,
      syncedAt: new Date().toISOString()
    };
  }
};
