import { useState } from 'react'

const labels: Record<number, string> = {
  [-1]: 'Shorter',
  0: 'No change',
  1: 'Longer',
}

function App() {
  const [answer, setAnswer] = useState(0)

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" aria-label="SOJU study home">SOJU<span>●</span></a>
        <div className="study-name"><span>Research study</span><strong>Facial Perception</strong></div>
        <div className="progress"><span>Question 07 of 12</span><i><b /></i></div>
      </header>

      <section className="survey">
        <div className="prompt">
          <p className="eyebrow">Visual assessment · 02</p>
          <h1>How would you adjust<br />the length of this<br /><em>person’s neck?</em></h1>
          <p className="instruction">Move the slider to indicate your perception.<br />There are no right or wrong answers.</p>
          <div className="answer-readout" aria-live="polite">
            <span>Your response</span>
            <strong>{answer > 0 ? '+' : ''}{answer}</strong>
            <small>{labels[answer]}</small>
          </div>
        </div>

        <div className="portrait-wrap">
          <div className="image-number">07</div>
          <img src="/face-image.png" alt="Portrait for visual assessment" />
          <p>Image shown for research purposes</p>
        </div>
      </section>

      <section className="controls" aria-label="Neck length response">
        <div className="scale-labels"><span>Shorter</span><span>Neutral</span><span>Longer</span></div>
        <div className="slider-row">
          <span>−1</span>
          <div className="range-wrap">
            <div className="ticks"><i /><i /><i /></div>
            <input
              aria-label="Adjust perceived neck length"
              type="range"
              min="-1"
              max="1"
              step="1"
              value={answer}
              onChange={(event) => setAnswer(Number(event.target.value))}
              style={{ '--position': `${(answer + 1) * 50}%` } as React.CSSProperties}
            />
          </div>
          <span>+1</span>
          <button type="button" onClick={() => setAnswer(0)}>Reset</button>
          <button className="next" type="button">Next question <span>→</span></button>
        </div>
      </section>

      <footer><span>SOJU RESEARCH LAB · 2026</span><span>ANONYMOUS RESPONSE</span></footer>
    </main>
  )
}

export default App
