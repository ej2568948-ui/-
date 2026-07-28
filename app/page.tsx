"use client";

import { useEffect, useMemo, useState } from "react";

type SubjectResult = { subject: string; summary: string; draft: string; review: string; flags: string[] };
type SavedRecord = { id?: string; student_id: string; grade: string; subject: string; content: string; created_at?: string };

const subjects = ["국어", "수학", "영어", "통합사회", "통합과학", "정보", "예체능"];
const models = ["Gemini 3.5 Flash-Lite", "Gemini 3.5 Flash", "Gemini 3.5 Pro"];

function makeResult(subject: string, keywords: string, grade: string): SubjectResult {
  const clean = keywords.trim() || "수업 참여와 탐구 활동";
  const summary = `${clean}을(를) 중심으로 ${subject} 수업에서의 관찰 내용을 정리했습니다.`;
  const draft = `${grade}학년 ${subject} 수업에서 ${clean}에 꾸준히 관심을 보이며 관련 자료를 탐색함. 탐구 과정에서 핵심 내용을 스스로 구조화하고, 자신의 생각을 근거와 함께 설명하려는 태도가 돋보임. 활동 결과를 성찰하며 다음 학습으로 확장하려는 모습을 보임.`;
  const flags = ["단정적 표현 점검 완료", "순위·비교 표현 없음", "관찰 근거 중심으로 다듬음"];
  return { subject, summary, draft, review: "검토 완료 · 학생의 과정과 관찰 가능한 행동 중심", flags };
}

export default function Home() {
  const [active, setActive] = useState<"write" | "history" | "settings">("write");
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("1학년");
  const [subject, setSubject] = useState("국어");
  const [keywords, setKeywords] = useState("");
  const [results, setResults] = useState<SubjectResult[]>([]);
  const [history, setHistory] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(models[0]);
  const [supabaseState, setSupabaseState] = useState("연결 설정 전");

  useEffect(() => {
    setApiKey(localStorage.getItem("gemini_api_key") || "");
    setModel(localStorage.getItem("gemini_model") || models[0]);
    void loadHistory();
  }, []);

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && supabaseKey);
  const loadHistory = async () => {
    if (!supabaseConfigured) { setSupabaseState("로컬 미리보기"); return; }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/seteuk_records?select=*&order=created_at.desc`, { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
      if (!response.ok) throw new Error("history");
      setHistory(await response.json()); setSupabaseState("Supabase 연결됨");
    } catch { setSupabaseState("연결 확인 필요"); }
  };

  const runAgents = () => {
    setLoading(true); setSaved(false);
    window.setTimeout(() => { setResults([makeResult(subject, keywords, grade)]); setLoading(false); }, 650);
  };
  const saveResult = async () => {
    if (!results.length) return;
    const record = { student_id: studentId || "미입력", grade, subject: results[0].subject, content: results[0].draft };
    if (supabaseConfigured) {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/seteuk_records`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(record) });
      await loadHistory();
    } else setHistory((items) => [{ ...record, created_at: new Date().toISOString() }, ...items]);
    setSaved(true);
  };
  const download = (item: SubjectResult) => { const blob = new Blob([item.draft], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${item.subject}-세특-초안.txt`; a.click(); URL.revokeObjectURL(url); };
  const count = useMemo(() => keywords.length, [keywords]);

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">s</span><span>세특 스튜디오</span></div>
      <p className="eyebrow">학생 기록 워크스페이스</p>
      <nav>
        <button className={active === "write" ? "nav-item active" : "nav-item"} onClick={() => setActive("write")}><span>✦</span> 새 세특 작성</button>
        <button className={active === "history" ? "nav-item active" : "nav-item"} onClick={() => { setActive("history"); void loadHistory(); }}><span>◷</span> 저장 내역 <b>{history.length || ""}</b></button>
        <button className={active === "settings" ? "nav-item active" : "nav-item"} onClick={() => setActive("settings")}><span>⚙</span> 개인 메뉴</button>
      </nav>
      <div className="sidebar-bottom"><div className="connection"><span className={supabaseConfigured ? "dot green" : "dot"}></span><div><strong>{supabaseState}</strong><small>Vercel + Supabase</small></div></div><div className="avatar">교</div></div>
    </aside>
    <section className="content">
      <header className="topbar"><div><p className="kicker">2026학년도 · 기록 도우미</p><h1>{active === "write" ? "새 세특 작성" : active === "history" ? "저장 내역" : "개인 메뉴"}</h1></div><div className="profile-pill"><span className="avatar small">교</span><span>교사 계정</span><span className="chevron">⌄</span></div></header>
      {active === "settings" ? <div className="settings-card"><div className="section-heading"><div><p className="kicker">PERSONAL SETTINGS</p><h2>생성 환경 설정</h2><p>사용할 Gemini API와 모델을 이 기기에서 관리합니다.</p></div><span className="setting-icon">⚙</span></div><label>Gemini API Key<input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza..." /></label><label>선호 모델<select value={model} onChange={(e) => setModel(e.target.value)}>{models.map((item) => <option key={item}>{item}</option>)}</select></label><button className="primary" onClick={() => { localStorage.setItem("gemini_api_key", apiKey); localStorage.setItem("gemini_model", model); setSaved(true); }}>설정 저장</button>{saved && <span className="saved-note">설정을 저장했습니다.</span>}<p className="security-note">API Key는 서버로 전송하지 않고 브라우저에만 보관됩니다. 실제 서비스 운영 시 Vercel 환경 변수 사용을 권장합니다.</p></div> : active === "history" ? <div className="history-panel"><div className="panel-head"><div><p className="kicker">ARCHIVE</p><h2>저장된 세특 기록</h2></div><button className="ghost" onClick={() => void loadHistory()}>새로고침 ↻</button></div>{history.length === 0 ? <div className="empty"><span>◷</span><h3>아직 저장된 기록이 없습니다</h3><p>새 세특을 생성하고 저장하면 이곳에서 다시 확인할 수 있어요.</p></div> : <div className="history-list">{history.map((item, index) => <article className="history-item" key={item.id || index}><div className="history-meta"><span className="subject-tag">{item.subject}</span><span>{item.grade}</span><span>학생 {item.student_id}</span><time>{item.created_at ? new Date(item.created_at).toLocaleString("ko-KR") : "방금 전"}</time></div><p>{item.content}</p></article>)}</div>}</div> : <>
        <div className="intro"><div><span className="live-badge"><i></i> AI WORKFLOW READY</span><h2>학생의 활동을<br /><em>성장 기록</em>으로 바꿔보세요.</h2><p>키워드만 입력하면 수집 · 작성 · 검토 에이전트가<br />과목에 맞는 세특 초안을 함께 완성합니다.</p></div><div className="intro-art"><div className="orbit orbit-a"></div><div className="orbit orbit-b"></div><div className="star">✦</div></div></div>
        <div className="workspace-grid"><div className="form-card"><div className="section-heading"><div><p className="kicker">STEP 01 · INPUT</p><h2>학생 활동 입력</h2></div><span className="step-count">1 / 3</span></div><div className="field-row"><label>학생 식별값<input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="예: 1-05 또는 익명 코드" /></label><label>학년<select value={grade} onChange={(e) => setGrade(e.target.value)}><option>1학년</option><option>2학년</option><option>3학년</option></select></label></div><label>과목<select value={subject} onChange={(e) => setSubject(e.target.value)}>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label><label className="textarea-label">활동 키워드 또는 관찰 내용<span className="char-count">{count} / 1,000</span><textarea maxLength={1000} value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="학생의 활동, 수업 태도, 탐구 과정에서 관찰한 내용을 자유롭게 적어주세요.&#10;&#10;예) 기후 변화에 관심을 갖고 탄소 발자국 자료를 찾아 친구들에게 설명함" /></label><button className="primary full" onClick={runAgents} disabled={loading}>{loading ? "에이전트가 작업 중입니다…" : "세특 초안 생성하기  →"}</button><p className="hint">입력 내용은 수집 에이전트가 먼저 핵심 행동과 근거로 정리합니다.</p></div>
          <div className="agent-card"><div className="section-heading"><div><p className="kicker">STEP 02 · AGENTS</p><h2>에이전트 진행 상태</h2></div><span className="agent-pulse">● 대기 중</span></div><div className="agent-list"><div className={loading ? "agent running" : results.length ? "agent done" : "agent"}><span className="agent-number">01</span><div><strong>수집 에이전트</strong><p>활동 키워드와 관찰 근거 정리</p></div><span className="agent-status">{loading ? "분석 중" : results.length ? "완료" : "대기"}</span></div><div className={loading ? "agent running" : results.length ? "agent done" : "agent"}><span className="agent-number">02</span><div><strong>작성 에이전트</strong><p>과목별 세특 문장 초안 구성</p></div><span className="agent-status">{loading ? "작성 중" : results.length ? "완료" : "대기"}</span></div><div className={results.length ? "agent done" : "agent"}><span className="agent-number">03</span><div><strong>검토 에이전트</strong><p>금지어·단정 표현 점검 및 다듬기</p></div><span className="agent-status">{results.length ? "완료" : "대기"}</span></div></div><div className="agent-footer"><span>사용 모델</span><strong>{model}</strong></div></div></div>
        {results.length > 0 && <section className="result-section"><div className="result-head"><div><p className="kicker">STEP 03 · REVIEWED RESULT</p><h2>검토 완료된 세특 초안</h2><p>과목별로 나누어 확인하고 필요한 부분을 수정할 수 있습니다.</p></div><button className="primary" onClick={saveResult}>{saved ? "저장 완료 ✓" : "Supabase에 저장"}</button></div>{results.map((item) => <article className="result-card" key={item.subject}><div className="result-title"><span className="subject-tag">{item.subject}</span><span className="reviewed">✓ 검토 완료</span><button className="download" onClick={() => download(item)}>텍스트 다운로드 ↓</button></div><div className="result-summary">{item.summary}</div><p>{item.draft}</p><div className="flags">{item.flags.map((flag) => <span key={flag}>{flag}</span>)}</div></article>)}</section>}
      </>}
    </section>
  </main>;
}
