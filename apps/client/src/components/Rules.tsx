import { useState } from 'react'
import { useLocale, useMessages } from '../i18n/messages'
import { rulesText } from '../i18n/rules'
import { Overlay } from './Overlay'
import { RuleExample } from './RuleExample'

export function Rules({ onClose }: { onClose: () => void }) {
  const t = useMessages()
  const text = rulesText[useLocale()]
  const [tab, setTab] = useState(0)
  const section = text.sections[tab]

  return (
    <Overlay title={t.rules} parchment onClose={onClose}>
      <div className="grid grid-cols-3 gap-1">
        {text.sections.map(({ tab: label }, index) => (
          <button
            key={label}
            type="button"
            aria-pressed={tab === index}
            onClick={() => setTab(index)}
            className={`pixel-box py-1.5 text-sm ${tab === index ? 'bg-accent text-on-accent' : 'bg-raised'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="flex flex-col gap-3 text-sm leading-tight">
        {section.rules.map(({ text, example }) => (
          <li key={text} className="flex gap-2">
            <span aria-hidden="true" className="mt-1 size-2 shrink-0 bg-gold" />
            <div className="min-w-0 flex-1">
              <p>{text}</p>
              {example && <RuleExample id={example} />}
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClose} className="pixel-box bg-raised py-2">
        {t.close}
      </button>
    </Overlay>
  )
}
