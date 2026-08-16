// Host half of the "Claude Code 会话导入器" Cordis Plugin.
// Plain JavaScript — no TS/JSX/import. Load via cordis_define with this
// function body as code.host.
return {
  apply(ctx) {
    const fs = ctx.get('fs')
    const sandboxPolicy = ctx.get('sandboxPolicy')
    if (fs === undefined || sandboxPolicy === undefined) return

    const workspaceRoot = sandboxPolicy.workspaceRoot || ''
    const MAX_LIST_HEAD = 96 * 1024
    const MAX_FULL = 24 * 1024 * 1024
    const readCache = new Map()
    const CACHE_LIMIT = 60

    const join = (a, b) => String(a).replace(/[\\/]+$/, '') + '\\' + String(b).replace(/^[\\/]+/, '')
    const parentOf = (p) => String(p).replace(/[\\/]+$/, '').replace(/[\\/][^\\/]*$/, '')
    const basenameOf = (p) => { const s = String(p).replace(/[\\/]+$/, ''); const i = s.lastIndexOf('\\'); const j = s.lastIndexOf('/'); const k = Math.max(i, j); return k >= 0 ? s.slice(k + 1) : s }

    async function resolveOrNull(p) {
      try { return await fs.resolve(p) } catch (e) { return undefined }
    }
    async function statOf(t) {
      try { return await fs.stat(t) } catch (e) { return undefined }
    }
    async function listChildren(t) {
      try { return await fs.listDir(t) } catch (e) { return { error: String((e && e.message) || e) } }
    }
    async function readHeadText(t, maxBytes) {
      try {
        const iter = await fs.streamText(t)
        let out = ''
        for await (const chunk of iter) {
          out += chunk
          if (out.length >= maxBytes) break
        }
        return out
      } catch (e) { return '' }
    }

    function parseLines(text) {
      const out = []
      if (!text) return out
      for (const raw of String(text).split('\n')) {
        const line = raw.trim()
        if (!line) continue
        try { out.push(JSON.parse(line)) } catch (e) { /* skip malformed */ }
      }
      return out
    }

    function titleOf(lines) {
      for (const l of lines) {
        if (l && typeof l === 'object') {
          const t = l.aiTitle
          if (typeof t === 'string' && t) return t
        }
      }
      return undefined
    }

    function cwdOf(lines) {
      for (const l of lines) {
        if (l && typeof l === 'object' && typeof l.cwd === 'string' && l.cwd) return l.cwd
      }
      return undefined
    }

    function lastTsOf(lines) {
      let last = ''
      for (const l of lines) {
        if (l && typeof l === 'object' && typeof l.timestamp === 'string' && l.timestamp) {
          if (l.timestamp > last) last = l.timestamp
        }
      }
      return last
    }

    function truncate(s, n) {
      const str = String(s == null ? '' : s)
      return str.length > n ? str.slice(0, n) + '…' : str
    }

    function firstUserText(lines) {
      for (const l of lines) {
        if (!l || typeof l !== 'object') continue
        if (l.type !== 'user') continue
        const m = l.message
        if (!m || m.role !== 'user') continue
        const c = m.content
        if (typeof c === 'string' && c.trim()) return truncate(c.trim().replace(/\s+/g, ' '), 140)
        if (Array.isArray(c)) {
          for (const b of c) {
            if (b && b.type === 'text' && typeof b.text === 'string' && b.text.trim()) {
              return truncate(b.text.trim().replace(/\s+/g, ' '), 140)
            }
          }
        }
      }
      return ''
    }

    function contentText(c, limit) {
      if (typeof c === 'string') return truncate(c, limit)
      if (Array.isArray(c)) {
        const parts = []
        for (const b of c) {
          if (!b || typeof b !== 'object') continue
          if (b.type === 'text' && typeof b.text === 'string') parts.push(b.text)
        }
        return truncate(parts.join('\n'), limit)
      }
      return ''
    }

    function extractMessages(lines) {
      const messages = []
      for (const l of lines) {
        if (!l || typeof l !== 'object') continue
        const type = l.type
        const m = l.message
        const ts = typeof l.timestamp === 'string' ? l.timestamp : ''
        if (type === 'user' && m && m.role === 'user') {
          const c = m.content
          if (typeof c === 'string' && c.trim()) {
            messages.push({ role: 'user', kind: 'user', text: truncate(c, 8000), ts })
          } else if (Array.isArray(c) && c.some((b) => b && b.type === 'text')) {
            messages.push({ role: 'user', kind: 'user', text: contentText(c, 8000), ts })
          }
        } else if (type === 'assistant' && m && m.role === 'assistant') {
          const blocks = Array.isArray(m.content)
            ? m.content
            : (typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : [])
          let model = ''
          if (typeof m.model === 'string') model = m.model
          for (const b of blocks) {
            if (!b || typeof b !== 'object') continue
            if (b.type === 'text' && typeof b.text === 'string' && b.text.trim()) {
              messages.push({ role: 'assistant', kind: 'assistant', text: truncate(b.text, 8000), model, ts })
            } else if (b.type === 'tool_use' && b.name) {
              messages.push({ role: 'assistant', kind: 'tool', tool: b.name, text: truncate(JSON.stringify(b.input || {}), 600), ts })
            }
          }
        } else if (type === 'summary') {
          const s = typeof l.summary === 'string' ? l.summary : ''
          if (s) messages.push({ role: 'system', kind: 'summary', text: truncate(s, 2000), ts })
        }
      }
      return messages
    }

    function candidateRoots() {
      const list = []
      const seen = new Set()
      const add = (p) => { if (p && !seen.has(p)) { seen.add(p); list.push(p) } }
      if (workspaceRoot) {
        add(join(workspaceRoot, '.claude\\projects'))
        let level = workspaceRoot.replace(/[\\/]+$/, '')
        for (let i = 0; i < 8; i++) {
          const parent = parentOf(level)
          if (!parent || parent === level) break
          level = parent
          add(join(level, '.claude\\projects'))
        }
      }
      return list
    }

    async function pickRoot(explicit) {
      if (explicit && String(explicit).trim()) return String(explicit).trim()
      const cands = candidateRoots()
      for (const c of cands) {
        const target = await resolveOrNull(c)
        const info = target ? await statOf(target) : undefined
        if (info && info.type === 'directory') return c
      }
      return cands[0] || ''
    }

    async function probeRoot(root) {
      const target = await resolveOrNull(root)
      if (!target) return { ok: false, root, error: 'resolve 失败: ' + root, type: null }
      const info = await statOf(target)
      return { ok: !!(info && info.type === 'directory'), root, error: info ? (info.type === 'directory' ? '' : '存在但不是目录: ' + info.type) : '路径不存在（stat 返回 undefined）', type: info ? info.type : null }
    }

    harness.handle('cc-probe', async (args) => {
      const explicit = (args && typeof args.root === 'string' && args.root.trim()) ? args.root.trim() : ''
      const candidates = explicit ? [explicit] : candidateRoots()
      const results = []
      let chosen = ''
      for (const c of candidates) {
        const r = await probeRoot(c)
        results.push(r)
        if (r.ok && !chosen) chosen = c
      }
      return {
        ok: !!chosen,
        root: chosen || explicit || (candidates[0] || ''),
        workspaceRoot,
        candidates: results,
        error: chosen ? '' : '未找到可用的 Claude Code projects 目录（已尝试 ' + candidates.length + ' 个候选）',
      }
    })

    harness.handle('cc-list', async (args) => {
      const root = await pickRoot(args && args.root)
      const target = await resolveOrNull(root)
      if (!target) return { ok: false, error: '目录不存在: ' + root, root }
      const info = await statOf(target)
      if (!info || info.type !== 'directory') return { ok: false, error: '不是有效目录: ' + root + (info ? (' (type=' + info.type + ')') : ''), root }
      const listed = await listChildren(target)
      if (listed.error) return { ok: false, error: '读取目录失败: ' + listed.error, root }
      const projEntries = listed.filter((e) => e.type === 'directory')
      const projects = []
      for (const p of projEntries.slice(0, 300)) {
        const sesListed = await listChildren(p.target)
        const sesEntries = sesListed.error ? [] : sesListed.filter((e) => e.type === 'file' && /\.jsonl$/i.test(e.name))
        const sessions = []
        for (const s of sesEntries.slice(0, 200)) {
          const head = await readHeadText(s.target, MAX_LIST_HEAD)
          const lines = parseLines(head)
          sessions.push({
            name: s.name,
            size: s.size || 0,
            title: titleOf(lines) || s.name.replace(/\.jsonl$/i, ''),
            first: firstUserText(lines),
            cwd: cwdOf(lines) || '',
            lastTs: lastTsOf(lines),
          })
        }
        sessions.sort((a, b) => (b.lastTs || '').localeCompare(a.lastTs || ''))
        projects.push({ dir: p.name, count: sesEntries.length, sessions })
      }
      return { ok: true, root, projects }
    })

    harness.handle('cc-read', async (args) => {
      const root = await pickRoot(args && args.root)
      const dir = args && typeof args.dir === 'string' ? args.dir : ''
      const name = args && typeof args.name === 'string' ? args.name : ''
      if (!dir || !name || /[\\/]/.test(dir) || /[\\/]/.test(name)) return { ok: false, error: '无效路径' }
      const cacheKey = dir + '/' + name
      const cached = readCache.get(cacheKey)
      if (cached) {
        readCache.delete(cacheKey)
        readCache.set(cacheKey, cached)
        return cached
      }
      const file = await resolveOrNull(join(join(root, dir), name))
      if (!file) return { ok: false, error: '会话文件不存在' }
      const st = await statOf(file)
      if (st && (st.size || 0) > MAX_FULL) return { ok: false, error: '会话文件过大（>24MB），暂不支持导入' }
      let text = ''
      try { text = await fs.readText(file) } catch (e) { return { ok: false, error: '读取失败: ' + String((e && e.message) || e) } }
      const lines = parseLines(text)
      const title = titleOf(lines) || name.replace(/\.jsonl$/i, '')
      const cwd = cwdOf(lines) || ''
      const messages = extractMessages(lines)
      const result = {
        ok: true,
        title,
        cwd,
        total: messages.length,
        messages,
      }
      if (readCache.size >= CACHE_LIMIT) readCache.clear()
      readCache.set(cacheKey, result)
      return result
    })

    harness.handle('cc-import', async (args) => {
      const root = await pickRoot(args && args.root)
      const dir = args && typeof args.dir === 'string' ? args.dir : ''
      const name = args && typeof args.name === 'string' ? args.name : ''
      if (!dir || !name || /[\\/]/.test(dir) || /[\\/]/.test(name)) return { ok: false, error: '无效路径' }
      const file = await resolveOrNull(join(join(root, dir), name))
      if (!file) return { ok: false, error: '会话文件不存在' }
      const st = await statOf(file)
      if (st && (st.size || 0) > MAX_FULL) return { ok: false, error: '会话文件过大（>24MB），暂不支持导入' }
      let text = ''
      try { text = await fs.readText(file) } catch (e) { return { ok: false, error: '读取失败: ' + String((e && e.message) || e) } }
      const lines = parseLines(text)
      const title = titleOf(lines) || name.replace(/\.jsonl$/i, '')
      const cwd = cwdOf(lines) || ''
      const messages = extractMessages(lines)
      if (!cwd) return { ok: false, error: '会话中没有 cwd 字段，无法关联工作区' }

      const workspaceRegistry = ctx.get('workspaceRegistry')
      const sessions = ctx.get('sessions')
      if (!workspaceRegistry || !sessions) return { ok: false, error: 'workspaceRegistry/sessions 服务不可用' }

      let ws
      try {
        ws = await workspaceRegistry.resolveByPath(cwd)
        if (!ws) ws = await workspaceRegistry.create(cwd, basenameOf(cwd))
      } catch (e) {
        return { ok: false, error: '工作区创建失败: ' + String((e && e.message) || e) }
      }

      let session
      try {
        session = sessions.create(undefined, { meta: { cwd } })
      } catch (e) {
        return { ok: false, error: '会话创建失败: ' + String((e && e.message) || e) }
      }

      let count = 0
      let turn = 0
      try {
        for (const m of messages) {
          if (m.kind === 'user') {
            session.append('user/message', {
              id: 'cc-imp-' + count + '-' + Math.random().toString(36).slice(2, 12),
              role: 'user',
              content: [{ type: 'text', text: m.text }],
              source: { kind: 'user' },
            }, { surfaceOp: 'append' })
            count++
          } else if (m.kind === 'assistant') {
            turn++
            session.append('assistant/message', {
              turn,
              step: 0,
              message: {
                id: 'cc-imp-' + count + '-' + Math.random().toString(36).slice(2, 12),
                role: 'assistant',
                content: [{ type: 'text', text: m.text }],
                source: { kind: 'model', provider: 'claude-code-import', model: m.model || 'claude' },
              },
            }, { surfaceOp: 'append' })
            count++
          }
        }
      } catch (e) {
        return { ok: false, error: '写入消息失败: ' + String((e && e.message) || e) }
      }

      try {
        await ws.attachSession(session.id)
        await sessions.flush(session)
      } catch (e) {
        return { ok: false, error: '关联工作区/持久化失败: ' + String((e && e.message) || e) }
      }

      return { ok: true, sessionId: String(session.id), workspaceId: String(ws.id), title, total: count }
    })

    harness.handle('cc-debug', async () => {
      const candidates = candidateRoots()
      const out = { workspaceRoot, candidates: [] }
      for (const c of candidates) {
        const target = await resolveOrNull(c)
        const info = target ? await statOf(target) : undefined
        const entry = { path: c, resolved: !!target, displayPath: target ? target.displayPath : '', info: info ? { type: info.type, size: info.size } : null }
        if (target && info && info.type === 'directory') {
          const listed = await listChildren(target)
          entry.entries = listed.error ? { error: listed.error } : listed.slice(0, 30).map((e) => ({ name: e.name, type: e.type }))
        }
        out.candidates.push(entry)
      }
      return out
    })
  }
}
