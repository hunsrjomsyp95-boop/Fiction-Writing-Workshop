import { useState, useEffect, useRef, useCallback } from 'react'
import { marked } from 'marked'
import sanitizeHtml from '../sanitizeHtml.js'
import { Eye } from 'lucide-react'
import { useToast } from '../ToastContext.jsx'

const POMODORO_WORK = 25
const POMODORO_BREAK = 5

export default function FocusModal({ novel, chapter, initialContent, onSave, onClose }) {
  const toast = useToast()
  const [text, setText] = useState(initialContent || '')
  const [sessionWords, setSessionWords] = useState(0)
  const [preview, setPreview] = useState(false)
  const [pomodoro, setPomodoro] = useState(null) // eslint-disable-line no-unused-vars
  const [timerMode, setTimerMode] = useState('stopwatch')
  const [stopwatch, setStopwatch] = useState(0)
  const [pomoPhase, setPomoPhase] = useState('work')
  const [pomoRemain, setPomoRemain] = useState(POMODORO_WORK * 60)
  const timerRef = useRef(null)
  const textareaRef = useRef(null)
  const stopwatchRef = useRef(null)
  const lastLenRef = useRef(0)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (!stopwatchRef.current) {
      stopwatchRef.current = setInterval(() => {
        setStopwatch((s) => s + 1)
      }, 1000)
    }
    return () => {
      if (stopwatchRef.current) {
        clearInterval(stopwatchRef.current)
        stopwatchRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (timerMode !== 'pomodoro') {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }
    timerRef.current = setInterval(() => {
      setPomoRemain((prev) => {
        if (prev <= 1) {
          const isWork = pomoPhase === 'work'
          setPomoPhase(isWork ? 'break' : 'work')
          const nextMinutes = isWork ? POMODORO_BREAK : POMODORO_WORK
          const msg = isWork ? '专注时间到！休息一下吧' : '休息结束，继续写作！'
          toast(msg, 'info')
          return nextMinutes * 60
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [timerMode, pomoPhase, toast])

  const countChars = (s) => (s || '').replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '').length

  const handleChange = (e) => {
    const val = e.target.value
    const newLen = countChars(val)
    const oldLen = lastLenRef.current
    if (newLen > oldLen) {
      setSessionWords((w) => w + (newLen - oldLen))
    }
    lastLenRef.current = newLen
    setText(val)
  }

  const handleFinish = useCallback(async () => {
    const elapsed = stopwatch
    const minutes = Math.max(1, Math.round(elapsed / 60))
    try {
      await window.api.addFocusSession(novel.id, minutes)
      await window.api.addTypingWords(novel.id, sessionWords || countChars(text))
    } catch (e) {
      /* db write failed, session not saved */
    }
    onSave?.(text)
    onClose()
  }, [novel.id, stopwatch, sessionWords, text, onSave, onClose])

  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const resetPomodoro = () => {
    setPomoPhase('work')
    setPomoRemain(POMODORO_WORK * 60)
  }

  const togglePreview = () => setPreview((p) => !p)

  const currentWords = countChars(text)

  return (
    <div className='focus-modal-mask' onClick={onClose}>
      <div className='focus-modal' onClick={(e) => e.stopPropagation()}>
        <div className='focus-header'>
          <div className='focus-timer'>
            {timerMode === 'stopwatch' ? (
              <span className='focus-clock'>{fmtTime(stopwatch)}</span>
            ) : (
              <div className='focus-pomo'>
                <span className='focus-clock'>{fmtTime(pomoRemain)}</span>
                <span className='focus-pomo-phase'>{pomoPhase === 'work' ? '专注' : '休息'}</span>
                <button className='ghost small' onClick={resetPomodoro}>
                  重置
                </button>
              </div>
            )}
            <button
              className='ghost small'
              onClick={() => setTimerMode(timerMode === 'stopwatch' ? 'pomodoro' : 'stopwatch')}
            >
              {timerMode === 'stopwatch' ? '番茄钟' : '正计时'}
            </button>
          </div>
          <div className='focus-stats'>
            <span className='badge'>{currentWords}</span>
            {sessionWords > 0 && <span className='badge green'>+{sessionWords}</span>}
            {chapter && <span className='hint'>{chapter.title}</span>}
          </div>
          <div className='grow' />
          <button className={`ghost small ${preview ? 'active' : ''}`} onClick={togglePreview} title='预览'>
            <Eye size={16} />
          </button>
          <button className='small primary' onClick={handleFinish}>
            完成并保存
          </button>
        </div>
        <div className='focus-body' style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <textarea
            ref={textareaRef}
            className='focus-editor'
            value={text}
            onChange={handleChange}
            placeholder='开始专注写作..'
            spellCheck={false}
          />
          {preview && (
            <div
              className='focus-preview reading-wrap'
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(text || '')) }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
