// Client half of the "Claude Code 会话导入器" Cordis Plugin.
// Plain JavaScript + React.createElement — no JSX/TS. Load via cordis_define
// with this function body as code.client.
return {
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    styles.insert(`
:root {
  --cc-brand: #6366f1;
  --cc-brand-2: #8b5cf6;
  --cc-green: #22c55e;
}
.cc-toggle { background: transparent; border: 0; color: inherit; cursor: pointer; font: inherit; padding: 5px 10px; border-radius: 8px; white-space: nowrap; transition: background .15s; }
.cc-toggle:hover { background: rgba(99,102,241,.14); }
.cc-panel { position: fixed; top: 14px; right: 14px; bottom: 14px; width: 440px; max-width: calc(100vw - 28px); display: flex; flex-direction: column; background: linear-gradient(180deg, var(--cc-surface, #ffffff), var(--cc-surface-2, #f8fafc)); color: var(--cc-text, #0f172a); border: 1px solid var(--cc-border, #e2e8f0); border-radius: 18px; box-shadow: 0 24px 80px rgba(2,6,23,.28), 0 2px 8px rgba(2,6,23,.08); z-index: 999; pointer-events: auto; overflow: hidden; font: 13px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; animation: cc-rise .18s ease-out; }
.cc-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-weight: 700; font-size: 14px; letter-spacing: .2px; }
.cc-panel-head-icon { margin-right: 8px; }
.cc-panel-close { background: rgba(255,255,255,.12); border: 0; cursor: pointer; font-size: 14px; color: #fff; width: 26px; height: 26px; line-height: 1; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: background .15s, transform .15s; }
.cc-panel-close:hover { background: rgba(255,255,255,.28); transform: rotate(90deg); }
.cc-panel-body { flex: 1; overflow: auto; padding: 14px 16px; }
.cc-panel-body::-webkit-scrollbar, .cc-pop-body::-webkit-scrollbar { width: 6px; }
.cc-panel-body::-webkit-scrollbar-thumb, .cc-pop-body::-webkit-scrollbar-thumb { background: rgba(100,116,139,.28); border-radius: 3px; }
.cc-rootrow { display: flex; gap: 8px; margin-bottom: 14px; }
.cc-rootinput { flex: 1; padding: 8px 12px; border: 1px solid var(--cc-border, #e2e8f0); border-radius: 10px; background: var(--cc-input, #ffffff); color: inherit; font: inherit; outline: none; transition: border-color .15s, box-shadow .15s; }
.cc-rootinput:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.16); }
.cc-btn { padding: 7px 14px; border-radius: 10px; border: 1px solid var(--cc-border, #cbd5e1); background: var(--cc-btn, #f1f5f9); color: inherit; cursor: pointer; font: inherit; font-weight: 600; transition: transform .12s, box-shadow .15s, background .15s, opacity .15s; }
.cc-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(2,6,23,.12); }
.cc-btn:active:not(:disabled) { transform: translateY(0); }
.cc-btn:disabled { opacity: .5; cursor: default; }
.cc-btn.primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: 0; color: #fff; box-shadow: 0 4px 14px rgba(99,102,241,.35); }
.cc-btn.green { background: linear-gradient(135deg, #22c55e, #16a34a); border: 0; color: #fff; box-shadow: 0 4px 14px rgba(22,163,74,.3); }
.cc-err { color: #ef4444; margin: 8px 0; white-space: pre-wrap; word-break: break-all; font-size: 12px; background: rgba(239,68,68,.08); border-radius: 8px; padding: 8px 10px; }
.cc-ok { color: #16a34a; margin: 8px 0; font-size: 12px; }
.cc-debug { font-size: 10.5px; color: var(--cc-muted, #64748b); margin: 8px 0; white-space: pre-wrap; word-break: break-all; background: var(--cc-card-2, #f1f5f9); border-radius: 8px; padding: 8px 10px; }
.cc-empty { text-align: center; color: var(--cc-muted, #94a3b8); padding: 30px 10px; font-size: 12.5px; line-height: 1.8; white-space: pre-wrap; }
.cc-proj { border: 1px solid var(--cc-border, #e2e8f0); border-radius: 12px; margin-bottom: 10px; overflow: hidden; background: var(--cc-card, #ffffff); transition: box-shadow .18s, border-color .18s; }
.cc-proj:hover { border-color: rgba(99,102,241,.5); box-shadow: 0 6px 20px rgba(2,6,23,.08); }
.cc-proj-head { padding: 10px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background .15s; }
.cc-proj-head:hover { background: rgba(99,102,241,.06); }
.cc-proj-arrow { color: var(--cc-muted, #94a3b8); font-size: 10px; transition: transform .2s; flex-shrink: 0; width: 12px; text-align: center; }
.cc-proj-arrow.open { transform: rotate(90deg); color: #6366f1; }
.cc-proj-dir { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; font-family: ui-monospace, 'Cascadia Code', Consolas, monospace; font-size: 12px; }
.cc-proj-count { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; flex-shrink: 0; }
.cc-proj-cwd { color: var(--cc-muted, #94a3b8); font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; flex-shrink: 1; }
.cc-ses { padding: 9px 12px; cursor: pointer; border-left: 3px solid transparent; transition: background .12s, border-color .12s, padding-left .12s; }
.cc-ses:hover { background: rgba(99,102,241,.07); padding-left: 15px; }
.cc-ses.sel { background: linear-gradient(90deg, rgba(99,102,241,.14), transparent); border-left-color: #6366f1; }
.cc-ses-title { font-weight: 600; font-size: 12.5px; }
.cc-ses-meta { color: var(--cc-muted, #94a3b8); font-size: 11px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cc-pop { position: fixed; right: 470px; width: 400px; max-width: calc(100vw - 490px); background: linear-gradient(180deg, var(--cc-surface, #ffffff), var(--cc-surface-2, #f8fafc)); color: var(--cc-text, #0f172a); border: 1px solid var(--cc-border, #e2e8f0); border-radius: 14px; box-shadow: 0 20px 60px rgba(2,6,23,.25), 0 2px 6px rgba(2,6,23,.08); z-index: 1001; pointer-events: auto; font: 13px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; overflow: visible; animation: cc-rise .18s ease-out; }
.cc-pop::before, .cc-pop::after { content: ''; position: absolute; width: 0; height: 0; pointer-events: none; }
.cc-pop::before { right: -13px; top: var(--arrow-top, 40px); border-top: 9px solid transparent; border-bottom: 9px solid transparent; border-left: 0; border-right: 9px solid var(--cc-border, #e2e8f0); }
.cc-pop::after { right: -10px; top: calc(var(--arrow-top, 40px) + 3px); border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 0; border-right: 6px solid var(--cc-surface, #ffffff); }
.cc-pop-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--cc-border, #eef2f7); font-weight: 700; font-size: 13px; }
.cc-pop-head-left { display: flex; align-items: center; gap: 8px; overflow: hidden; }
.cc-pop-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cc-pop-badge { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; flex-shrink: 0; }
.cc-pop-close { background: transparent; border: 0; cursor: pointer; font-size: 15px; color: var(--cc-muted, #94a3b8); width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; flex-shrink: 0; }
.cc-pop-close:hover { background: rgba(239,68,68,.12); color: #ef4444; }
.cc-pop-body { overflow: auto; padding: 12px; }
.cc-msg { margin: 8px 0; max-width: 88%; padding: 9px 13px; border-radius: 14px; white-space: pre-wrap; word-break: break-word; font-size: 12.5px; line-height: 1.55; }
.cc-msg.user { margin-left: auto; background: rgba(59,130,246,.12); color: var(--cc-text, #0f172a); border-bottom-right-radius: 4px; }
.cc-msg.assistant { margin-right: auto; background: var(--cc-msg-assist, #f1f5f9); color: var(--cc-text, #0f172a); border-bottom-left-radius: 4px; }
.cc-msg.tool { margin-right: auto; background: rgba(245,158,11,.12); border-left: 3px solid #f59e0b; font-family: ui-monospace, 'Cascadia Code', Consolas, monospace; font-size: 11px; }
.cc-msg.summary { margin-right: auto; background: rgba(168,85,247,.12); border-left: 3px solid #a855f7; }
.cc-msg-role { font-weight: 700; margin-bottom: 4px; font-size: 11px; display: flex; align-items: center; gap: 6px; }
.cc-msg.user .cc-msg-role { color: #2563eb; }
.cc-msg.assistant .cc-msg-role { color: #16a34a; }
.cc-msg.tool .cc-msg-role { color: #d97706; }
.cc-msg.summary .cc-msg-role { color: #9333ea; }
.cc-msg-time { font-size: 10px; color: var(--cc-muted, #94a3b8); margin-top: 3px; text-align: right; font-family: ui-monospace, 'Cascadia Code', Consolas, monospace; }
.cc-msg.user .cc-msg-time { color: rgba(37,99,235,.75); }
.cc-panel-foot { padding: 12px 16px; border-top: 1px solid var(--cc-border, #eef2f7); display: flex; gap: 8px; align-items: center; background: var(--cc-surface, #ffffff); }
.cc-foot-note { font-size: 11px; color: var(--cc-muted, #94a3b8); }
@keyframes cc-rise { from { opacity: 0; transform: translateY(10px) scale(.985); } to { opacity: 1; transform: none; } }
@media (prefers-color-scheme: dark) {
  .cc-panel { background: linear-gradient(180deg, #1e293b, #0f172a); color: #e2e8f0; border-color: #334155; }
  .cc-pop { background: linear-gradient(180deg, #1e293b, #0f172a); color: #e2e8f0; border-color: #334155; }
  .cc-rootinput { background: #0f172a; border-color: #334155; }
  .cc-btn { background: #1e293b; border-color: #475569; }
  .cc-proj { background: #1e293b; border-color: #334155; }
  .cc-proj-head:hover { background: rgba(99,102,241,.1); }
  .cc-debug { background: #0f172a; }
  .cc-panel-head { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
  .cc-pop-head { border-bottom-color: #334155; }
  .cc-panel-foot { background: #0f172a; border-top-color: #334155; }
  .cc-msg.user { background: rgba(59,130,246,.2); color: #dbeafe; }
  .cc-msg.user .cc-msg-role { color: #60a5fa; }
  .cc-msg.user .cc-msg-time { color: rgba(147,197,253,.6); }
  .cc-msg.assistant { background: #26334a; }
  .cc-msg.tool { background: rgba(245,158,11,.13); }
  .cc-msg.summary { background: rgba(168,85,247,.15); }
  .cc-pop::before { border-right-color: #334155; }
  .cc-pop::after { border-right-color: #1e293b; }
  .cc-ses.sel { background: linear-gradient(90deg, rgba(99,102,241,.22), transparent); }
}
`)

    const store = {
      listeners: new Set(),
      state: { open: false },
      get() { return this.state },
      set(patch) {
        this.state = Object.assign({}, this.state, patch)
        this.listeners.forEach((fn) => { try { fn() } catch (e) {} })
      },
      subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn) },
    }

    function useStore() {
      const [v, setV] = React.useState(store.get())
      React.useEffect(() => store.subscribe(() => setV(store.get())), [])
      return v
    }

    function fmtTime(iso) {
      if (!iso) return ''
      try {
        const d = new Date(iso)
        if (isNaN(d.getTime())) return ''
        const p = (n) => String(n).padStart(2, '0')
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
      } catch (e) { return '' }
    }

    function CCPanel() {
      const s = useStore()
      const [root, setRoot] = React.useState('')
      const [probeMsg, setProbeMsg] = React.useState('')
      const [probeErr, setProbeErr] = React.useState('')
      const [debugText, setDebugText] = React.useState('')
      const [projects, setProjects] = React.useState([])
      const [openDir, setOpenDir] = React.useState('')
      const [selName, setSelName] = React.useState('')
      const [popup, setPopup] = React.useState(null)
      const [popPos, setPopPos] = React.useState(null)
      const [popDetail, setPopDetail] = React.useState(null)
      const [popErr, setPopErr] = React.useState('')
      const [popH, setPopH] = React.useState(0)
      const [loading, setLoading] = React.useState(false)
      const [err, setErr] = React.useState('')
      const [autoDone, setAutoDone] = React.useState(false)

      const runProbe = () => {
        setLoading(true); setErr(''); setProbeMsg('正在检测 Claude Code 目录…'); setProbeErr('')
        host.call('cc-probe', { root }).then((r) => {
          setRoot(r.root || '')
          if (!r.ok) {
            setProbeErr(r.error || '未找到 Claude Code 目录')
            setProbeMsg('')
            setLoading(false)
            if (r.workspaceRoot) setDebugText('workspaceRoot = ' + r.workspaceRoot + '\n' + JSON.stringify(r.candidates || [], null, 1))
            return
          }
          setProbeErr('')
          return host.call('cc-list', { root: r.root }).then((lr) => {
            if (!lr.ok) { setErr(lr.error || '扫描失败'); setProbeMsg('已检测到目录，但扫描失败'); return }
            setProjects(lr.projects || [])
            setProbeMsg('共 ' + (lr.projects || []).length + ' 个项目')
          }).catch((e) => setErr(String(e)))
        }).catch((e) => { setProbeErr(String(e)) }).finally(() => { setLoading(false); setAutoDone(true) })
      }

      React.useEffect(() => { if (!autoDone) runProbe() }, [])

      React.useEffect(() => {
        if (!popup) { setPopDetail(null); setPopErr(''); return }
        setPopDetail(null); setPopErr('')
        host.call('cc-read', { root, dir: popup.dir, name: popup.name }).then((r) => {
          if (!r.ok) { setPopErr(r.error || '读取失败'); return }
          setPopDetail(r)
        }).catch((e) => setPopErr(String(e)))
      }, [popup])

      const popRef = (el) => {
        if (!el) return
        const h = el.offsetHeight
        if (h > 0 && Math.abs(h - popH) > 2) setPopH(h)
      }

      React.useEffect(() => {
        if (!popPos || !popH) return
        let vh = 800
        try { vh = window.innerHeight || vh } catch (err) {}
        const MIN_TOP = 8
        const BOTTOM_PAD = 16
        const HEAD_H = 56
        const actualH = Math.min(popH, vh - MIN_TOP - BOTTOM_PAD)
        let top = popPos.rowCenter - actualH / 2
        top = Math.max(MIN_TOP, Math.min(top, vh - actualH - BOTTOM_PAD))
        const bodyMax = Math.max(120, vh - top - BOTTOM_PAD - HEAD_H)
        const arrowTop = Math.max(14, Math.min(popPos.rowCenter - top - 8, actualH - 30))
        if (Math.abs(top - popPos.top) > 1 || Math.abs(arrowTop - popPos.arrowTop) > 1 || Math.abs(bodyMax - popPos.bodyMax) > 1) {
          setPopPos(Object.assign({}, popPos, { top, arrowTop, bodyMax }))
        }
      }, [popPos, popH])

      const scan = () => {
        setLoading(true); setErr(''); setProjects([]); setOpenDir(''); setSelName(''); setPopup(null); setPopPos(null); setPopH(0); setDebugText('')
        host.call('cc-list', { root }).then((r) => {
          if (!r.ok) { setErr(r.error || '扫描失败'); return }
          setProjects(r.projects || [])
          setProbeErr('')
          setProbeMsg('共 ' + (r.projects || []).length + ' 个项目')
          if (!r.projects || !r.projects.length) { setErr('未发现任何 Claude 项目，请检查目录路径是否正确') }
        }).catch((e) => setErr(String(e))).finally(() => setLoading(false))
      }

      const closePopup = () => {
        setPopup(null)
        setPopPos(null)
        setPopH(0)
        setSelName('')
      }

      const toggleProject = (pdir) => {
        const next = openDir === pdir ? '' : pdir
        setOpenDir(next)
        if (popup && popup.dir !== next) closePopup()
      }

      const clickSession = (e, pdir, sname) => {
        if (popup && popup.dir === pdir && popup.name === sname) {
          closePopup()
          return
        }
        let vh = 800
        try { vh = window.innerHeight || vh } catch (err) {}
        const rect = e.currentTarget.getBoundingClientRect()
        const rowCenter = rect.top + rect.height / 2
        const MIN_TOP = 8
        const BOTTOM_PAD = 16
        const HEAD_H = 56
        const EST_H = 480
        let top = rowCenter - EST_H / 2
        top = Math.max(MIN_TOP, Math.min(top, vh - EST_H - BOTTOM_PAD))
        const bodyMax = Math.max(120, vh - top - BOTTOM_PAD - HEAD_H)
        const arrowTop = Math.max(14, Math.min(rowCenter - top - 8, EST_H - 30))
        setSelName(sname)
        setPopH(0)
        setPopPos({ rowCenter, top, arrowTop, bodyMax })
        setPopup({ dir: pdir, name: sname })
      }

      const importToWorkspace = () => {
        if (!selName) { setErr('请先选择一个会话'); return }
        setLoading(true); setErr('')
        host.call('cc-import', { root, dir: openDir, name: selName }).then((r) => {
          if (!r.ok) { setErr(r.error || '导入失败'); return }
          const svc = ctx.get('sessions')
          if (svc && r.sessionId) { try { svc.open(r.sessionId) } catch (e) {} }
          closePopup()
          store.set({ open: false })
        }).catch((e) => setErr(String(e))).finally(() => setLoading(false))
      }

      if (!s.open) return null

      const msgs = (popDetail && popDetail.messages) || []
      const roleName = (m) => m.kind === 'user' ? '我' : m.kind === 'assistant' ? 'Claude' : m.kind === 'tool' ? '工具 · ' + m.tool : '上下文摘要'
      return React.createElement('div', { className: 'cc-panel' },
        React.createElement('div', { className: 'cc-panel-head' },
          React.createElement('span', null, React.createElement('span', { className: 'cc-panel-head-icon' }, '✦'), 'Claude Code 会话导入'),
          React.createElement('button', { className: 'cc-panel-close', onClick: () => { closePopup(); store.set({ open: false }) } }, '✕')
        ),
        React.createElement('div', { className: 'cc-panel-body' },
          React.createElement('div', { className: 'cc-rootrow' },
            React.createElement('input', { className: 'cc-rootinput', value: root, onChange: (e) => setRoot(e.target.value), placeholder: 'Claude Code projects 目录', spellCheck: false }),
            React.createElement('button', { className: 'cc-btn primary', onClick: scan, disabled: loading }, loading ? '扫描中…' : '重新扫描')
          ),
          probeErr ? React.createElement('div', { className: 'cc-err' }, probeErr) : null,
          probeMsg ? React.createElement('div', { className: 'cc-ok' }, probeMsg) : null,
          err ? React.createElement('div', { className: 'cc-err' }, err) : null,
          debugText ? React.createElement('div', { className: 'cc-debug' }, debugText) : null,
          projects.length === 0 && autoDone && !loading
            ? React.createElement('div', { className: 'cc-empty' }, '尚未发现 Claude 项目\n请确认本机已安装并使用过 Claude Code，\n或在上方输入正确的 projects 目录后点击「重新扫描」')
            : null,
          projects.map((p) =>
            React.createElement('div', { className: 'cc-proj', key: p.dir },
              React.createElement('div', { className: 'cc-proj-head', onClick: () => toggleProject(p.dir) },
                React.createElement('span', { className: 'cc-proj-arrow' + (openDir === p.dir ? ' open' : '') }, '▶'),
                React.createElement('span', { className: 'cc-proj-dir' }, p.dir),
                React.createElement('span', { className: 'cc-proj-count' }, p.count),
                React.createElement('span', { className: 'cc-proj-cwd' }, (p.sessions[0] && p.sessions[0].cwd) || '')
              ),
              openDir === p.dir ? p.sessions.map((sess) =>
                React.createElement('div', { className: 'cc-ses' + (popup && popup.name === sess.name ? ' sel' : ''), key: sess.name, onClick: (e) => clickSession(e, p.dir, sess.name) },
                  React.createElement('div', { className: 'cc-ses-title' }, sess.title),
                  React.createElement('div', { className: 'cc-ses-meta' }, fmtTime(sess.lastTs) + (sess.first ? ' · ' + sess.first : ''))
                )
              ) : null
            )
          )
        ),
        React.createElement('div', { className: 'cc-panel-foot' },
          React.createElement('button', { className: 'cc-btn green', onClick: importToWorkspace, disabled: !selName || loading }, '导入到工作区'),
          selName ? React.createElement('span', { className: 'cc-foot-note' }, '已选中 1 个会话') : null
        ),
        popup && popPos ? React.createElement('div', { className: 'cc-pop', ref: popRef, style: { top: popPos.top + 'px', '--arrow-top': popPos.arrowTop + 'px' } },
          React.createElement('div', { className: 'cc-pop-head' },
            React.createElement('div', { className: 'cc-pop-head-left' },
              React.createElement('span', { className: 'cc-pop-title' }, popDetail ? popDetail.title : '加载中…'),
              popDetail ? React.createElement('span', { className: 'cc-pop-badge' }, popDetail.total + ' 条') : null
            ),
            React.createElement('button', { className: 'cc-pop-close', onClick: () => closePopup() }, '✕')
          ),
          React.createElement('div', { className: 'cc-pop-body', style: { maxHeight: popPos.bodyMax + 'px' } },
            popErr ? React.createElement('div', { className: 'cc-err' }, popErr) : null,
            popDetail ? msgs.map((m, i) =>
              React.createElement('div', { className: 'cc-msg ' + m.kind, key: i },
                React.createElement('div', { className: 'cc-msg-role' }, roleName(m)),
                m.text,
                m.ts ? React.createElement('div', { className: 'cc-msg-time' }, fmtTime(m.ts)) : null
              )
            ) : React.createElement('div', { className: 'cc-debug' }, '加载会话内容…')
          )
        ) : null
      )
    }

    slots.inject('conversation.session.header.actions', () => slots.register(
      { name: 'conversation.session.header.actions', id: 'cc-import-toggle', order: 30, label: () => 'Claude 会话' },
      () => {
        const s = useStore()
        return React.createElement('button', {
          className: 'cc-toggle',
          onClick: () => store.set({ open: !store.get().open }),
          title: 'Claude Code 会话导入',
        }, s.open ? '关闭' : 'Claude 会话')
      }
    ))

    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'cc-import-panel', order: 50 },
      () => React.createElement(CCPanel, null)
    ))
  }
}
